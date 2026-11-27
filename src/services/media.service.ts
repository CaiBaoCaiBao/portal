import "server-only";

import { serverEnvConfig } from "@/config/server-env.config";
import {
    MediaFolderDao,
    MediaAssetDao,
    AssetVersionDao,
    MediaFileDao,
    MediaVariantDao,
} from "@/dao";
import {
    AUDIO_MIME,
    IMAGE_MIME,
    VIDEO_MIME,
} from "@/constant/mime-type.constant";
import {
    DOCUMENT_EXT,
    DOCUMENT_MIME,
    VARIANT_AV_PURPOSE,
    VARIANT_DOC_PURPOSE,
    VARIANT_IMAGE_PURPOSE,
} from "@/constant/media/media-variant.constant";
import {
    type MediaFolderDTO,
    type MediaFolderQueryDTO,
    type AddFileDTO,
    type MediaAssetCallbackDTO,
    type MediaAssetDTO,
    type MediaAssetQueryDTO,
    mediaFolderOrderSchema,
    mediaAssetOrderSchema,
    AddFilECallbackDTO,
    type AssetVersionDTO,
    MediaVariantDTO,
    MediaAssetUpdateDTO,
} from "@/schema/media";
import {
    type PaginationDTO,
    type OrderDTO,
    type IdQueryDTO
} from "@/schema/globals.schema";
import {
    BadRequestError,
    ConflictError,
    InternalError,
    NotFoundError,
    QiniuError,
} from "@/lib";
import {
    type MediaAssetDetailVO,
    type MediaAssetListVO,
    type MediaFolderListVO
} from "@/types/media.type";
import qiniu from "qiniu";
import { db, type Tx } from "@/prisma/db";

export class MediaService {
    static readonly ak = serverEnvConfig.qiniu.accessKey;
    static readonly sk = serverEnvConfig.qiniu.secretKey;
    static readonly bucket = serverEnvConfig.qiniu.bucket;
    static readonly domain = serverEnvConfig.qiniu.domain;
    static readonly mc = new qiniu.auth.digest.Mac(this.ak, this.sk);

    // ========================================================================
    // ========================== ASSET SERVICES ==============================
    // ========================================================================

    /** @description 创建媒体资产 */
    static async createAsset(dto: MediaAssetDTO): Promise<{
        assetId: string,
        fileId: string,
        storageKey: string,
        token?: string,
    }> {
        const existing = await MediaFileDao.findByChecksum(dto.etag);
        if (!existing) {
            const uploadToken = this.generateUploadToken(dto.storageKey);
            const created = await this.createAssetTransaction(dto, null);
            return { ...created, storageKey: dto.storageKey, token: uploadToken };
        }
        if (existing.status === "ready") {
            dto.status = "ready";
            const created = await this.createAssetTransaction(dto, existing.id);
            return { ...created, storageKey: existing.storageKey };
        }
        if (existing.status !== "failed" && existing.status !== "uploading") {
            throw new InternalError(
                "MEDIA",
                `Media file ${existing.originalName} has unknown status: ${existing.status}. - id: ${existing.id}`,
            );
        }
        if (existing.status === "uploading") {
            const qiniuStatusCode = await this.checkQiniuObject(existing.storageKey);
            if (qiniuStatusCode === 200) {
                const created = await this.finishPendingOrCreate(dto, existing.id);
                return { ...created, storageKey: existing.storageKey };
            }
            if (qiniuStatusCode !== 404) {
                throw new QiniuError("Check Qiniu Storage", "Failed to stat file");
            }
            this.assertTokenInterval(existing.updatedAt);
        }
        const uploadToken = this.generateUploadToken(existing.storageKey);
        await MediaFileDao.update(existing.id, {
            status: "uploading",
            updatedAt: new Date(),
        });
        // 同一未完成上传再次创建时，复用已有资产
        const pending = await MediaAssetDao.findPendingUpload(existing.id, dto.title, dto.folderId);
        if (pending) {
            return {
                assetId: pending.id,
                fileId: existing.id,
                storageKey: existing.storageKey,
                token: uploadToken,
            };
        }
        dto.status = "pending";
        const created = await this.createAssetTransaction(dto, existing.id);
        return { ...created, storageKey: existing.storageKey, token: uploadToken };
    }

    /** @description 创建媒体资产事务 */
    private static async createAssetTransaction(
        dto: MediaAssetDTO, existingId: string | null
    ): Promise<{ assetId: string, fileId: string }> {
        return await db.transaction(async (tx) => {
            const ready = Boolean(existingId) && dto.status === "ready";
            let fileId: string = existingId ?? "";
            const assetId = await MediaAssetDao.insert({
                title: dto.title,
                description: dto.description,
                folderId: dto.folderId,
                status: ready ? "ready" : "pending",
                currentVersionId: null,
                pendingFileId: ready ? null : existingId,
                kind: dto.type,
            }, tx.orm);
            if (!existingId) {
                fileId = await MediaFileDao.insert({
                    originalName: dto.title,
                    storageKey: dto.storageKey,
                    url: `${this.domain}/${dto.storageKey}`,
                    checksum: dto.etag,
                    mimeType: dto.type,
                    status: "uploading",
                    size: BigInt(dto.size),
                    width: dto.width,
                    height: dto.height,
                    durationMs: dto.durationMs,
                    updatedAt: new Date(),
                }, tx.orm);
                await MediaAssetDao.update(assetId, { pendingFileId: fileId }, tx.orm);
            }
            if (ready && existingId) {
                const versionId = await AssetVersionDao.insert({
                    assetId,
                    fileId: existingId,
                    version: 1,
                }, tx.orm);
                await MediaAssetDao.update(assetId, { currentVersionId: versionId }, tx.orm);
            }
            return { assetId, fileId };
        });
    }

    /** @description 对象已经在七牛时，完成未完成资产或新建一个就绪资产 */
    private static async finishPendingOrCreate(
        dto: MediaAssetDTO, fileId: string,
    ): Promise<{ assetId: string, fileId: string }> {
        const pending = await MediaAssetDao.findPendingUpload(fileId, dto.title, dto.folderId);
        if (!pending) {
            await MediaFileDao.update(fileId, { status: "ready" });
            dto.status = "ready";
            return this.createAssetTransaction(dto, fileId);
        }
        await db.transaction(async (tx) => {
            await MediaFileDao.update(fileId, { status: "ready" }, tx.orm);
            const versionId = await AssetVersionDao.insert({
                assetId: pending.id,
                fileId,
                version: 1,
            }, tx.orm);
            await MediaAssetDao.update(pending.id, {
                currentVersionId: versionId,
                status: "ready",
                pendingFileId: null,
            }, tx.orm);
        });
        return { assetId: pending.id, fileId };
    }

    /** @description 创建媒体资产回调 */
    static async createAssetCallback(dto: MediaAssetCallbackDTO): Promise<{ versionId: string } | void> {
        const asset = await MediaAssetDao.findUploadState(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");
        if (asset.pendingFileId && asset.pendingFileId !== dto.fileId) {
            throw new BadRequestError("MEDIA", "File does not belong to this asset");
        }
        const file = await MediaFileDao.findById(dto.fileId);
        if (!file) throw new NotFoundError("MEDIA", "File not found");

        const linked = (await AssetVersionDao.query({
            assetId: dto.assetId,
            fileId: dto.fileId,
        }))[0];
        if (linked) return { versionId: linked.id };
        if (asset.status === "ready") throw new BadRequestError("MEDIA", "Asset is already ready");

        if (!dto.qiniuSuccess) {
            await db.transaction(async (tx) => {
                await MediaAssetDao.delete(dto.assetId, tx.orm);
                await this.markFileFailedIfUnreferenced(dto.fileId, tx.orm);
            });
            return;
        }

        const versionId = await db.transaction(async (tx) => {
            const createdVersionId = await AssetVersionDao.insert({
                assetId: dto.assetId,
                fileId: dto.fileId,
                version: 1,
            }, tx.orm);
            await MediaFileDao.update(dto.fileId, {
                status: "ready",
                size: BigInt(dto.size),
            }, tx.orm);
            await MediaAssetDao.update(dto.assetId, {
                currentVersionId: createdVersionId,
                status: "ready",
                pendingFileId: null,
            }, tx.orm);
            return createdVersionId;
        });
        return { versionId };
    }

    /** @description 距上次签发凭证不足 10 秒时拒绝重发 */
    private static assertTokenInterval(updatedAt: string | Date) {
        const timeDiff = Date.now() - new Date(updatedAt).getTime();
        if (timeDiff < 10 * 1000) {
            const waitSeconds = Math.ceil((10 * 1000 - timeDiff) / 1000);
            throw new BadRequestError("MEDIA", `Please retry in ${waitSeconds}s.`);
        }
    }

    /** @description 没有版本引用这份文件时，才把它标成失败 */
    private static async markFileFailedIfUnreferenced(
        fileId: string, orm: Tx["orm"] = db.orm,
    ) {
        const file = await MediaFileDao.findById(fileId);
        if (!file || file.status === "ready") return;
        const referenced = await AssetVersionDao.query({ fileId });
        if (referenced.length > 0) return;
        await MediaFileDao.update(fileId, { status: "failed" }, orm);
    }

    /** @description 更新媒体资产信息 */
    static async updateAsset(id: IdQueryDTO, dto: MediaAssetUpdateDTO) {
        const asset = await MediaAssetDao.findById(id);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");
        await MediaAssetDao.update(id, dto);
    }

    /** @description 删除媒体资产，并清掉不再被引用的文件 */
    static async deleteAsset(id: IdQueryDTO) {
        const asset = await MediaAssetDao.findById(id);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");

        const versions = await AssetVersionDao.query({ assetId: id });
        const fileIds = [...new Set(versions.map((item) => item.fileId))];
        const fileVersions = await Promise.all(fileIds.map(async (fileId) => ({
            fileId,
            versions: await AssetVersionDao.query({ fileId }),
        })));
        const orphanFileIds = fileVersions
            .filter((item) => item.versions.every((version) => version.assetId === id))
            .map((item) => item.fileId);
        const orphans = await Promise.all(orphanFileIds.map(async (fileId) => ({
            file: await MediaFileDao.findById(fileId),
            variants: await MediaVariantDao.findByFileId(fileId),
        })));

        await db.transaction(async (tx) => {
            if (asset.currentVersionId) {
                await MediaAssetDao.update(id, { currentVersionId: null }, tx.orm);
            }
            for (const version of versions) {
                await AssetVersionDao.delete(version.id, tx.orm);
            }
            await MediaAssetDao.delete(id, tx.orm);
            for (const orphan of orphans) {
                if (!orphan.file) continue;
                for (const variant of orphan.variants) {
                    await MediaVariantDao.delete(variant.id, tx.orm);
                }
                await MediaFileDao.delete(orphan.file.id, tx.orm);
            }
        });

        const keys = orphans.flatMap((orphan) => orphan.file
            ? [orphan.file.storageKey, ...orphan.variants.map((variant) => variant.storageKey)]
            : []);
        for (const key of keys) {
            await this.deleteQiniuObject(key);
        }
    }

    /** @description 分页查询媒体资产 */
    static async queryAsset(
        query: MediaAssetQueryDTO,
        page: PaginationDTO = { pageIndex: 0, pageSize: 10 },
        order: OrderDTO<typeof mediaAssetOrderSchema> = []
    ): Promise<{
        list: MediaAssetListVO[],
        total: number,
    }> {
        const { rows, total } = await MediaAssetDao.query({
            folderId: query.folderId,
            title: query.title,
            status: query.status,
            kind: query.kind,
            createdFrom: query.createdFrom,
            createdTo: query.createdTo,
        }, page, order);
        const versionIds = rows.flatMap((row) => row.currentVersionId ? [row.currentVersionId] : []);
        const versions = await AssetVersionDao.findByIds(versionIds);
        const fileIdByVersionId = new Map(versions.map((version) => [version.id, version.fileId]));
        const thumbnails = await MediaVariantDao.findByFileIds(
            [...new Set(versions.map((version) => version.fileId))],
            "thumbnail",
        );
        const urlByFileId = new Map(thumbnails.map((item) => [item.fileId, item.url]));
        return {
            list: rows.map((row) => {
                const fileId = row.currentVersionId
                    ? fileIdByVersionId.get(row.currentVersionId)
                    : undefined;
                return {
                    ...row,
                    thumbnailUrl: fileId ? urlByFileId.get(fileId) ?? null : null,
                };
            }),
            total,
        };
    }

    /** @description 获取媒体资产详情 */
    static async getAssetDetail(id: IdQueryDTO): Promise<MediaAssetDetailVO> {
        const asset = await MediaAssetDao.findById(id);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");

        const [folder, versionRows] = await Promise.all([
            asset.folderId ? MediaFolderDao.findById(asset.folderId) : null,
            AssetVersionDao.query({ assetId: id }),
        ]);

        const fileIds = [...new Set(versionRows.map((version) => version.fileId))];
        const files = await Promise.all(fileIds.map(async (fileId) => {
            const [file, variants] = await Promise.all([
                MediaFileDao.findById(fileId),
                MediaVariantDao.findByFileId(fileId),
            ]);
            if (!file) throw new NotFoundError("MEDIA", "File not found");
            return [fileId, { ...file, variants }] as const;
        }));
        const fileById = new Map(files);

        const versions = versionRows
            .map((version) => {
                const file = fileById.get(version.fileId);
                if (!file) throw new NotFoundError("MEDIA", "File not found");
                return { ...version, file };
            })
            .sort((left, right) => left.version - right.version);

        const currentVersion = asset.currentVersionId
            ? versions.find((version) => version.id === asset.currentVersionId) ?? null
            : null;
        if (asset.currentVersionId && !currentVersion) {
            throw new NotFoundError("MEDIA", "Version not found");
        }

        return { ...asset, folder, currentVersion, versions };
    }

    // ========================================================================
    // ========================== FILE SERVICES ===============================
    // ========================================================================

    /** @description 添加媒体文件 */
    static async addFile(dto: AddFileDTO): Promise<{
        fileId: string,
        storageKey: string,
        token?: string,
        versionId?: string,
    }> {
        const asset = await MediaAssetDao.findById(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");
        if (dto.currentVersionId !== asset.currentVersionId)
            throw new BadRequestError("MEDIA", "Version is not the current version");

        const version = await AssetVersionDao.findById(dto.currentVersionId);
        if (!version) throw new NotFoundError("MEDIA", "Version not found");

        const existing = await MediaFileDao.findByChecksum(dto.etag);
        if (existing) {
            if (existing.id === version.fileId) {
                return { fileId: existing.id, storageKey: existing.storageKey };
            }
            if (existing.status === "ready") {
                dto.status = "ready";
                const added = await this.addFileTransaction(dto, existing.id);
                return {
                    fileId: added.fileId,
                    storageKey: existing.storageKey,
                    versionId: added.versionId,
                };
            }
            if (existing.status !== "failed" && existing.status !== "uploading") {
                throw new InternalError(
                    "MEDIA",
                    `Media file ${existing.originalName} has unknown status: ${existing.status}. - id: ${existing.id}`,
                );
            }
            if (existing.status === "uploading") {
                const qiniuStatusCode = await this.checkQiniuObject(existing.storageKey);
                if (qiniuStatusCode === 200) {
                    dto.status = "ready";
                    const added = await this.addFileTransaction(dto, existing.id);
                    return {
                        fileId: added.fileId,
                        storageKey: existing.storageKey,
                        versionId: added.versionId,
                    };
                }
                if (qiniuStatusCode !== 404) {
                    throw new QiniuError("Check Qiniu Storage", "Failed to stat file");
                }
                this.assertTokenInterval(existing.updatedAt);
            }
            const uploadToken = this.generateUploadToken(existing.storageKey);
            await MediaFileDao.update(existing.id, {
                status: "uploading",
                updatedAt: new Date(),
            });
            return {
                fileId: existing.id,
                storageKey: existing.storageKey,
                token: uploadToken,
            };
        }

        const added = await this.addFileTransaction(dto, null);
        const uploadToken = this.generateUploadToken(dto.storageKey);
        return {
            fileId: added.fileId,
            storageKey: dto.storageKey,
            token: uploadToken,
        };
    }

    /** @description 添加媒体文件事务 */
    private static async addFileTransaction(
        dto: AddFileDTO, existingId: string | null
    ): Promise<{ fileId: string, versionId?: string }> {
        const versions = await AssetVersionDao.query({ assetId: dto.assetId });
        if (versions.length === 0) throw new NotFoundError("MEDIA", "Version not found");
        const maxVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);
        if (!existingId) {
            const fileId = await MediaFileDao.insert({
                originalName: dto.originalName,
                status: dto.status,
                checksum: dto.etag,
                mimeType: dto.type,
                size: BigInt(dto.size),
                width: dto.width,
                height: dto.height,
                durationMs: dto.durationMs,
                updatedAt: new Date(),
                storageKey: dto.storageKey,
                url: `${this.domain}/${dto.storageKey}`,
            });
            return { fileId };
        }
        if (dto.status !== "ready") return { fileId: existingId };
        const linked = versions.find((item) => item.fileId === existingId);
        if (linked) {
            if (linked.id !== dto.currentVersionId) {
                await MediaAssetDao.update(dto.assetId, { currentVersionId: linked.id });
            }
            return { fileId: existingId, versionId: linked.id };
        }
        const versionId = await db.transaction(async (tx) => {
            await MediaFileDao.update(existingId, { status: "ready" }, tx.orm);
            const createdVersionId = await AssetVersionDao.insert({
                assetId: dto.assetId,
                fileId: existingId,
                version: maxVersion + 1,
            }, tx.orm);
            await MediaAssetDao.update(dto.assetId, {
                currentVersionId: createdVersionId,
            }, tx.orm);
            return createdVersionId;
        });
        return { fileId: existingId, versionId };
    }

    /** @description 添加媒体文件回调 */
    static async addFileCallback(
        dto: AddFilECallbackDTO,
    ): Promise<{ versionId: string, current: boolean } | void> {
        const asset = await MediaAssetDao.findById(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset is not found");
        const file = await MediaFileDao.findById(dto.fileId);
        if (!file) throw new NotFoundError("MEDIA", "Target file not found");

        const versions = await AssetVersionDao.query({ assetId: dto.assetId });
        const linked = versions.find((item) => item.fileId === dto.fileId);
        if (linked) {
            return {
                versionId: linked.id,
                current: asset.currentVersionId === linked.id,
            };
        }

        if (!dto.qiniuSuccess) {
            await this.markFileFailedIfUnreferenced(dto.fileId);
            return;
        }

        const maxVersion = versions.reduce((max, item) => Math.max(max, item.version), 0);
        const switchCurrent = asset.currentVersionId === dto.currentVersionId;
        const versionId = await db.transaction(async (tx) => {
            if (file.status !== "ready") {
                await MediaFileDao.update(dto.fileId, {
                    status: "ready",
                    size: BigInt(dto.size),
                }, tx.orm);
            }
            const createdVersionId = await AssetVersionDao.insert({
                assetId: dto.assetId,
                fileId: dto.fileId,
                version: maxVersion + 1,
            }, tx.orm);
            if (switchCurrent) {
                await MediaAssetDao.update(dto.assetId, {
                    currentVersionId: createdVersionId,
                }, tx.orm);
            }
            return createdVersionId;
        });
        return { versionId, current: switchCurrent };
    }

    /** @description 删除媒体文件 */
    static async removeFile(dto: IdQueryDTO) {
        const file = await MediaFileDao.findById(dto);
        if (!file) throw new NotFoundError("MEDIA", "File not found");
        if (file.status === "uploading") {
            throw new BadRequestError("MEDIA", "File is uploading");
        }

        const versions = await AssetVersionDao.query({ fileId: file.id });
        const variants = await MediaVariantDao.findByFileId(file.id);
        const assetIds = [...new Set(versions.map((item) => item.assetId))];
        const assets = await Promise.all(assetIds.map(async (assetId) => ({
            assetId,
            asset: await MediaAssetDao.findById(assetId),
            versions: await AssetVersionDao.query({ assetId }),
        })));

        await db.transaction(async (tx) => {
            for (const item of assets) {
                const removingIds = new Set(
                    versions
                        .filter((version) => version.assetId === item.assetId)
                        .map((version) => version.id),
                );
                if (!item.asset?.currentVersionId || !removingIds.has(item.asset.currentVersionId)) continue;
                const remaining = item.versions.filter((version) => !removingIds.has(version.id));
                const fallback = remaining.reduce<(typeof remaining)[number] | undefined>(
                    (max, version) => !max || version.version > max.version ? version : max,
                    undefined,
                );
                await MediaAssetDao.update(item.assetId, fallback
                    ? { currentVersionId: fallback.id }
                    : { currentVersionId: null, status: "archived" }, tx.orm);
            }
            for (const version of versions) {
                await AssetVersionDao.delete(version.id, tx.orm);
            }
            for (const variant of variants) {
                await MediaVariantDao.delete(variant.id, tx.orm);
            }
            await MediaAssetDao.releasePendingFile(file.id, tx.orm);
            await MediaFileDao.delete(file.id, tx.orm);
        });

        const keys = [file.storageKey, ...variants.map((variant) => variant.storageKey)];
        for (const key of keys) {
            await this.deleteQiniuObject(key);
        }
    }

    // ========================================================================
    // ========================== VERSION SERVICES ============================
    // ========================================================================

    /** @description 切换媒体资产版本 */
    static async changeVersion(dto: AssetVersionDTO) {
        const asset = await MediaAssetDao.findById(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset is not found");
        const targetVersion = await AssetVersionDao.findById(dto.targetVersionId);
        if (!targetVersion) throw new NotFoundError("MEDIA", "Target version is not found");
        if (targetVersion.assetId !== dto.assetId)
            throw new BadRequestError("MEDIA", "Target version does not belong to this asset");
        if (asset.currentVersionId === dto.targetVersionId) return;
        await MediaAssetDao.update(dto.assetId, {
            currentVersionId: dto.targetVersionId,
        });
    }

    // ========================================================================
    // ========================== VARIANT SERVICES ============================
    // ========================================================================

    /** @description 生成媒体变体 */
    static async generateVariant(dto: MediaVariantDTO) {
        const file = await MediaFileDao.findById(dto.fileId);
        if (!file) throw new NotFoundError("MEDIA", "File not found");
        if (file.status !== "ready") return;
        if (!this.purposeMatchesFile(file.mimeType, dto.purpose)) {
            throw new BadRequestError("MEDIA", "Purpose does not match file type");
        }
        if (dto.purpose === "waveform") {
            throw new BadRequestError("MEDIA", "Waveform variant is not supported");
        }

        const existing = (await MediaVariantDao.findByFileId(dto.fileId))
            .find((item) => item.purpose === dto.purpose);
        if (existing?.status === "ready" || existing?.status === "processing") return;

        const target = this.variantTarget(dto.fileId, dto.purpose);
        const record = {
            fileId: dto.fileId,
            purpose: dto.purpose,
            storageKey: target.storageKey,
            url: `${this.domain}/${target.storageKey}`,
            mime: target.mime,
            status: "processing",
            size: 0,
            width: null,
            height: null,
        };
        if (existing) {
            await MediaVariantDao.update(existing.id, record);
        } else {
            await MediaVariantDao.insert(record);
        }

        try {
            if (dto.purpose === "preview_pdf" && file.mimeType === "application/pdf") {
                await this.copyQiniuObject(file.storageKey, target.storageKey);
                await this.markVariant(dto.fileId, dto.purpose, {
                    ...record,
                    status: "ready",
                    size: this.toVariantSize(file.size),
                });
                return;
            }
            const fops = this.buildVariantFops(file.mimeType, target.storageKey, dto.purpose);
            await this.submitVariantPfop(file.storageKey, fops);
        } catch (error) {
            try {
                await this.markVariant(dto.fileId, dto.purpose, {
                    ...record,
                    status: "failed",
                });
            } catch {
                // 回写失败时仍抛出原来的处理错误
            }
            throw error;
        }
    }

    /** @description 判断衍生用途是否适用于该文件 */
    private static purposeMatchesFile(
        mimeType: string,
        purpose: MediaVariantDTO["purpose"],
    ): boolean {
        if (this.includesText(IMAGE_MIME, mimeType)) {
            return this.includesText(VARIANT_IMAGE_PURPOSE, purpose);
        }
        if (this.includesText(AUDIO_MIME, mimeType)) {
            return purpose === "audio_track" || purpose === "waveform";
        }
        if (this.includesText(VIDEO_MIME, mimeType)) {
            return this.includesText(VARIANT_AV_PURPOSE, purpose);
        }
        if (this.includesText(DOCUMENT_MIME, mimeType)) {
            return this.includesText(VARIANT_DOC_PURPOSE, purpose);
        }
        return false;
    }

    /** @description 衍生文件的存储键和 MIME */
    private static variantTarget(
        fileId: string,
        purpose: MediaVariantDTO["purpose"],
    ): { storageKey: string, mime: string } {
        const spec = {
            thumbnail: ["jpg", "image/jpeg"],
            preview_gif: ["gif", "image/gif"],
            preview_webp: ["webp", "image/webp"],
            transcode_vedio: ["mp4", "video/mp4"],
            hls_stream: ["m3u8", "application/vnd.apple.mpegurl"],
            audio_track: ["mp3", "audio/mpeg"],
            waveform: ["json", "application/json"],
            sprite_sheet: ["jpg", "image/jpeg"],
            preview_pdf: ["pdf", "application/pdf"],
        } as const satisfies Record<MediaVariantDTO["purpose"], readonly [string, string]>;
        const [ext, mime] = spec[purpose];
        const storageKey = purpose === "sprite_sheet"
            ? `variants/${fileId}/sprite_sheet-000001.jpg`
            : `variants/${fileId}/${purpose}.${ext}`;
        return { storageKey, mime };
    }

    /** @description 按用途拼七牛处理指令 */
    private static buildVariantFops(
        mimeType: string,
        storageKey: string,
        purpose: MediaVariantDTO["purpose"],
    ): string {
        const saveas = qiniu.util.encodedEntry(this.bucket, storageKey);
        switch (purpose) {
            case "thumbnail":
                return `imageView2/2/w/480/h/480/format/jpg|saveas/${saveas}`;
            case "preview_gif":
                return `imageView2/2/w/480/format/gif|saveas/${saveas}`;
            case "preview_webp":
                return `imageView2/2/w/1600/format/webp|saveas/${saveas}`;
            case "transcode_vedio":
                return `avthumb/mp4/vcodec/libx264/acodec/aac|saveas/${saveas}`;
            case "hls_stream": {
                const pattern = qiniu.util.urlsafeBase64Encode(
                    storageKey.replace(/\.m3u8$/, "-$(count).ts"),
                );
                return `avthumb/m3u8/noDomain/1/segtime/10/vcodec/libx264/acodec/aac/savePattern/${pattern}|saveas/${saveas}`;
            }
            case "audio_track":
                return `avthumb/mp3/acodec/libmp3lame/vn/1|saveas/${saveas}`;
            case "sprite_sheet": {
                const pattern = qiniu.util.urlsafeBase64Encode(
                    storageKey.replace(/-000001\.jpg$/, "-$(count).jpg"),
                );
                return `vsample/jpg/spriteFormat/jpg/frames/10/lines/2/columns/5/saveSpritePattern/${pattern}`;
            }
            case "preview_pdf": {
                const ext = DOCUMENT_EXT[mimeType];
                if (!ext) throw new BadRequestError("MEDIA", "Purpose does not match file type");
                return `yifangyun_preview/v2/ext/${ext}/format/pdf|saveas/${saveas}`;
            }
            case "waveform":
                throw new BadRequestError("MEDIA", "Waveform variant is not supported");
        }
    }

    /** @description 回写衍生记录状态 */
    private static async markVariant(
        fileId: string,
        purpose: MediaVariantDTO["purpose"],
        data: {
            fileId: string,
            purpose: string,
            storageKey: string,
            url: string,
            mime: string,
            status: string,
            size: number,
            width: null,
            height: null,
        },
    ) {
        const saved = (await MediaVariantDao.findByFileId(fileId))
            .find((item) => item.purpose === purpose);
        if (!saved) throw new NotFoundError("MEDIA", "Variant not found");
        await MediaVariantDao.update(saved.id, data);
    }

    /** @description 把已是 PDF 的源文件复制成预览衍生 */
    private static async copyQiniuObject(sourceKey: string, targetKey: string) {
        const bucketManager = new qiniu.rs.BucketManager(this.mc, this.qiniuConfig());
        const copied = await bucketManager.copy(
            this.bucket,
            sourceKey,
            this.bucket,
            targetKey,
            { force: true },
        );
        if (copied.resp.statusCode !== 200) {
            throw new QiniuError("Variant", "Failed to copy variant", {
                status: copied.resp.statusCode,
            });
        }
    }

    /** @description 提交七牛持久化处理 */
    private static submitVariantPfop(sourceKey: string, fops: string): Promise<void> {
        const manager = new qiniu.fop.OperationManager(this.mc, this.qiniuConfig());
        return new Promise((resolve, reject) => {
            manager.pfop(this.bucket, sourceKey, [fops], "", { force: true }, (error, body, info) => {
                if (error) {
                    reject(new QiniuError("Variant", error.message, { cause: error }));
                    return;
                }
                if (info?.statusCode !== 200) {
                    const message = body && typeof body === "object" && "error" in body
                        ? String(body.error)
                        : "Failed to submit variant";
                    reject(new QiniuError("Variant", message, { status: info?.statusCode }));
                    return;
                }
                resolve();
            });
        });
    }

    private static includesText(list: readonly string[], value: string): boolean {
        return list.includes(value);
    }

    private static toVariantSize(size: bigint): number {
        const value = Number(size);
        if (!Number.isSafeInteger(value) || value > 2147483647) {
            throw new BadRequestError("MEDIA", "File is too large for a variant");
        }
        return value;
    }

    // ========================================================================
    // ========================== FOLDER SERVICES =============================
    // ========================================================================

    /** @description 创建媒体目录 */
    static async createFolder(dto: MediaFolderDTO) {
        const uniqueName = await MediaFolderDao.findByName(dto.name);
        if (!uniqueName) {
            throw new ConflictError("MEDIA", "Folder Name is already in use");
        }
        await MediaFolderDao.insert(dto);
    }

    /** @description 更新媒体目录 */
    static async updateFolder(id: IdQueryDTO, dto: MediaFolderDTO) {
        const folder = await MediaFolderDao.findById(id);
        if (!folder) throw new NotFoundError("MEDIA", "Folder not found");
        if (folder.name === dto.name) return;
        await MediaFolderDao.update(id, dto);
    }

    /** @description 删除媒体目录 */
    static async deleteFolder(id: IdQueryDTO) {
        const folder = await MediaFolderDao.findById(id);
        if (!folder) throw new NotFoundError("MEDIA", "Folder not found");
        const assets = await MediaAssetDao.query(
            {
                folderId: id,
                title: void 0,
                status: void 0,
                kind: void 0,
                createdFrom: void 0,
                createdTo: void 0,
            },
            { pageIndex: 0, pageSize: 1 },
            [],
        );
        if (assets.total > 0) throw new BadRequestError("MEDIA", "Folder is not empty");
        await MediaFolderDao.delete(id);
    }

    /** @description 获取媒体目录列表 */
    static async getFolderList(
        query: MediaFolderQueryDTO,
        page: PaginationDTO,
        order: OrderDTO<typeof mediaFolderOrderSchema>
    ): Promise<{
        list: MediaFolderListVO[],
        total: number,
    }> {
        const { rows, total } = await MediaFolderDao.query(query, page, order);
        return {
            list: rows,
            total
        }
    }

    // ========================================================================
    // ========================== QINIU SERVICES ==============================
    // ========================================================================

    /** @description 配置七牛云 */
    private static qiniuConfig() {
        const config = new qiniu.conf.Config();
        config.zone = qiniu.zone.Zone_z2;
        return config;
    }

    /** @description 生成上传Token */
    private static generateUploadToken(
        storageKey: string, expires: number = 3600
    ): string {
        const options: qiniu.rs.PutPolicyOptions = {
            scope: this.bucket + ":" + storageKey,
            expires: expires,
            returnBody: '{"key":"$(key)","hash":"$(etag)","size":$(fsize)}',
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        return putPolicy.uploadToken(this.mc);
    }

    private static async checkQiniuObject(storageKey: string): Promise<number | undefined> {
        const bucketManager = new qiniu.rs.BucketManager(this.mc, this.qiniuConfig());
        const qiniuStat = await bucketManager.stat(this.bucket, storageKey);
        return qiniuStat.resp.statusCode;
    }

    /** @description 删除七牛对象，612 表示对象已经不存在 */
    private static async deleteQiniuObject(storageKey: string) {
        const bucketManager = new qiniu.rs.BucketManager(this.mc, this.qiniuConfig());
        const removed = await bucketManager.delete(this.bucket, storageKey);
        if (removed.resp.statusCode !== 200 && removed.resp.statusCode !== 612) {
            throw new QiniuError("Delete Qiniu Storage", "Failed to delete file", {
                status: removed.resp.statusCode,
            });
        }
    }

    /** @description 获取媒体文件下载链接 */
    static async getDownloadUrl(id: IdQueryDTO, expires = 3600): Promise<{ url: string }> {
        const file = await MediaFileDao.findById(id);
        if (!file) throw new NotFoundError("MEDIA", "File not found");
        if (file.status !== "ready") throw new BadRequestError("MEDIA", "File is not ready");
        const deadline = Math.floor(Date.now() / 1000) + expires;
        const base = `${this.domain}/${encodeURI(file.storageKey)}?attname=${encodeURIComponent(file.originalName)}&e=${deadline}`;
        const sign = qiniu.util.base64ToUrlSafe(qiniu.util.hmacSha1(base, this.sk));
        return { url: `${base}&token=${this.ak}:${sign}` };
    }
}