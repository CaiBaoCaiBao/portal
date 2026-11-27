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
    mediaFolderOrderSchema,
    AddFilECallbackDTO,
    type AssetVersionDTO,
    MediaVariantDTO,
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
import { type MediaFolderListVO } from "@/types/media.type";
import qiniu from "qiniu";
import { db } from "@/prisma/db";

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
    static async createAsset(dto: MediaAssetDTO): Promise<{ assetId: string, fileId: string, token?: string }> {
        const existing = await MediaFileDao.findByChecksum(dto.etag);

        if (existing) {
            if (existing.status === "ready") {
                dto.status = "ready";
                const created = await this.createAssetTransaction(dto, existing.id);
                return created;
            } else if (existing.status === "failed") {
                await MediaFileDao.update(existing.id, {
                    status: "uploading",
                });
                // 重新生成上传Token，并记录更新时间
                const uploadToken = this.generateUploadToken(existing.storageKey);
                await MediaFileDao.update(existing.id, {
                    updatedAt: new Date(),
                });
                const created = await this.createAssetTransaction(dto, existing.id);
                return { ...created, token: uploadToken };
            } else if (existing.status === "uploading") {
                // 查询七牛存储文件是否存在
                const qiniuStatusCode = await this.checkQiniuObject(existing.storageKey);
                if (qiniuStatusCode === 200) {
                    await MediaFileDao.update(existing.id, {
                        status: "ready",
                    });
                    dto.status = "ready";
                    const created = await this.createAssetTransaction(dto, existing.id);
                    return created;
                } else if (qiniuStatusCode === 404) {
                    const timeDiff = Date.now() - new Date(existing.updatedAt).getTime();
                    if (timeDiff < 10 * 1000) {
                        // 10秒内刚发过Token
                        throw new BadRequestError("MEDIA", `Pleast ${10 * 1000 - timeDiff}s later to try.`)
                    }
                    const uploadToken = this.generateUploadToken(existing.storageKey);
                    await MediaFileDao.update(existing.id, {
                        status: "uploading",
                        updatedAt: new Date(),
                    });
                    const created = await this.createAssetTransaction(dto, existing.id);
                    return { ...created, token: uploadToken };
                } else {
                    throw new QiniuError("Check Qiniu Storage", "Failed to stat file");
                }
            } else {
                throw new InternalError(
                    "MEDIA",
                    `Media file ${existing.originalName} has unknown status: ${existing.status}. - id: ${existing.id}`
                )
            }
        }

        // 文件记录不存在，创建文件记录和媒体资产记录
        const uploadToken = this.generateUploadToken(dto.storageKey);
        const created = await this.createAssetTransaction(dto, null);

        return { ...created, token: uploadToken };
    }

    /** @description 创建媒体资产事务 */
    private static async createAssetTransaction(
        dto: MediaAssetDTO, existingId: string | null
    ): Promise<{ assetId: string, fileId: string }> {
        return await db.transaction(async (tx) => {
            let fileId: string = existingId ?? "";
            const assetId = await MediaAssetDao.insert({
                title: dto.title,
                description: null,
                folderId: dto.folderId,
                status: dto.status,
                currentVersionId: null,
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
            }
            if (existingId && dto.status === "ready") {
                const versionId = await AssetVersionDao.insert({
                    assetId: assetId,
                    fileId: existingId,
                    version: 1
                }, tx.orm)
                await MediaAssetDao.update(assetId, { currentVersionId: versionId });
            }
            return { assetId, fileId };
        })
    }

    /** @description 创建媒体资产回调 */
    static async createAssetCallback(dto: MediaAssetCallbackDTO) {
        const asset = await MediaAssetDao.findById(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");
        if (asset.status === "ready") throw new BadRequestError("MEDIA", "Asset is already ready");
        await db.transaction(async (tx) => {
            if (dto.qiniuSuccess) {
                const versionId = await AssetVersionDao.insert({
                    assetId: dto.assetId,
                    fileId: dto.fileId,
                    version: 1
                }, tx.orm)
                await MediaAssetDao.update(dto.assetId, {
                    currentVersionId: versionId,
                    status: "ready"
                }, tx.orm);
            } else {
                await MediaAssetDao.delete(dto.assetId, tx.orm);
                await MediaFileDao.update(dto.fileId, { status: "failed" }, tx.orm);
            }
        })
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
    } | void> {
        const asset = await MediaAssetDao.findById(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset not found");
        if (dto.currentVersionId !== asset.currentVersionId)
            throw new BadRequestError("MEDIA", "Version is not the current version");

        const version = await AssetVersionDao.findById(dto.currentVersionId);
        if (!version) throw new NotFoundError("MEDIA", "Version not found");

        const existing = await MediaFileDao.findByChecksum(dto.etag);
        if (existing) {
            if (existing.id === version.fileId) return;
            if (existing.status === "ready") {
                dto.status = "ready";
                const added = await this.addAssetVersionTransaction(dto, existing.id);
                return {
                    fileId: added.fileId,
                    storageKey: existing.storageKey,
                    versionId: added.versionId,
                };
            } else if (existing.status === "failed") {
                await MediaFileDao.update(existing.id, { status: "uploading" });
                const uploadToken = this.generateUploadToken(existing.storageKey);
                await MediaFileDao.update(existing.id, {
                    updatedAt: new Date(),
                });
                return {
                    fileId: existing.id,
                    storageKey: existing.storageKey,
                    token: uploadToken,
                };
            } else if (existing.status === "uploading") {
                const qiniuStatusCode = await this.checkQiniuObject(existing.storageKey);
                if (qiniuStatusCode === 200) {
                    await MediaFileDao.update(existing.id, { status: "ready" });
                    dto.status = "ready";
                    const added = await this.addAssetVersionTransaction(dto, existing.id);
                    return {
                        fileId: added.fileId,
                        storageKey: existing.storageKey,
                        versionId: added.versionId,
                    };
                } else if (qiniuStatusCode === 404) {
                    const timeDiff = Date.now() - new Date(existing.updatedAt).getTime();
                    if (timeDiff < 10 * 1000) {
                        // 10秒内刚发过Token
                        throw new BadRequestError("MEDIA", `Pleast ${10 * 1000 - timeDiff}s later to try.`)
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
                } else {
                    throw new QiniuError("Check Qiniu Storage", "Failed to stat file");
                }
            } else {
                throw new InternalError(
                    "MEDIA",
                    `Media file ${existing.originalName} has unknown status: ${existing.status}. - id: ${existing.id}`
                );
            }
        }

        const added = await this.addAssetVersionTransaction(dto, null);
        const uploadToken = this.generateUploadToken(dto.storageKey);
        return {
            fileId: added.fileId,
            storageKey: dto.storageKey,
            token: uploadToken,
        };
    }

    /** @description 添加媒体文件事务 */
    private static async addAssetVersionTransaction(
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
        const versionId = await db.transaction(async (tx) => {
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
    static async addAssetVersionCallback(dto: AddFilECallbackDTO) {
        const asset = await MediaAssetDao.findById(dto.assetId);
        if (!asset) throw new NotFoundError("MEDIA", "Asset is not found");
        const file = await MediaFileDao.findById(dto.fileId);
        if (!file) throw new NotFoundError("MEDIA", "Target file not found");
        if (file.status === "ready") return;

        if (!dto.qiniuSuccess) {
            await MediaFileDao.update(dto.fileId, { status: "failed" });
            return;
        }

        const versions = await AssetVersionDao.query({ assetId: dto.assetId });
        const maxVersion = versions.reduce((max, v) => Math.max(max, v.version), 0);
        await db.transaction(async (tx) => {
            await MediaFileDao.update(dto.fileId, { status: "ready" }, tx.orm);
            const versionId = await AssetVersionDao.insert({
                assetId: dto.assetId,
                fileId: dto.fileId,
                version: maxVersion + 1,
            }, tx.orm);
            await MediaAssetDao.update(dto.assetId, {
                currentVersionId: versionId,
            }, tx.orm);
        });
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
        query: MediaFolderQueryDTO = {},
        page: PaginationDTO = { pageIndex: 0, pageSize: 10 },
        order: OrderDTO<typeof mediaFolderOrderSchema> = []
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
}