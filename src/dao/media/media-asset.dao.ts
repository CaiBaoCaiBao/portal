import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import {
    PaginationQuery,
    OrderQuery
} from "@/types/globals.type";
import { orderByField } from "@prisma/orm-family-sql/orm-client";
import {
    mediaAssetListFields,
    mediaAssetDetailFields,
    type MediaAssetDetailColumns,
    type MediaAssetListColumns,
} from "@/types/media.type";

type MediaAssetInputFields = FieldInputTypes["public"]["MediaAsset"];

export type MediaAssetInput = Pick<
    MediaAssetInputFields,
    "title" | "description" | "kind" | "status" | "folderId" | "currentVersionId" | "pendingFileId"
>;

export type MediaAssetUploadState = {
    readonly id: string;
    readonly status: string;
    readonly pendingFileId: string | null;
    readonly currentVersionId: string | null;
};

export type MediaAssetQuery = {
    readonly folderId: string | null;
    readonly title: string | undefined;
    readonly status: string | undefined;
    readonly kind: string | undefined;
    readonly createdFrom: string | undefined;
    readonly createdTo: string | undefined;
};

export type MediaAssetOrder = Pick<
    MediaAssetInputFields,
    "createdAt"
>;

export class MediaAssetDao {

    /** @description 创建媒体资产记录 */
    static async insert(data: MediaAssetInput, orm: Tx["orm"] = db.orm): Promise<string> {
        try {
            const row = await orm.public.MediaAsset.create(data);
            return row.id;
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 更新媒体资产记录 */
    static async update(
        id: string, data: Partial<MediaAssetInput>, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaAsset.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除媒体资产记录 */
    static async delete(id: string, orm: Tx["orm"] = db.orm): Promise<void> {
        try {
            await orm.public.MediaAsset.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 分页动态查询媒体资产 */
    static async query(
        data: MediaAssetQuery,
        page: PaginationQuery,
        order: OrderQuery<MediaAssetOrder>
    ): Promise<{ rows: MediaAssetListColumns[], total: number }> {
        const filtered = db.orm.public.MediaAsset.where((asset, { fns }) => {
            const conditions = [];
            conditions.push(asset.folderId.eq(data.folderId));
            if (data.title) {
                conditions.push(asset.title.like(`%${data.title}%`));
            }
            if (data.kind) {
                conditions.push(asset.kind.eq(data.kind));
            }
            if (data.createdFrom) {
                conditions.push(asset.createdAt.gte(data.createdFrom));
            }
            if (data.createdTo) {
                conditions.push(asset.createdAt.lte(data.createdTo));
            }
            if (data.status) {
                conditions.push(asset.status.eq(data.status));
            }
            return conditions.length > 0 ? fns.and(...conditions) : asset.id.isNotNull();
        })
        const orderRules = order.map(({ field, order: direction }) => orderByField(
            db.orm.public.MediaAsset,
            field,
            direction.toLowerCase(),
            ["createdAt"]
        ));
        try {
            const rows = await filtered
                .orderBy([...orderRules, (asset) => asset.title.asc()])
                .limit(page.pageSize)
                .offset(page.pageIndex * page.pageSize)
                .select(...mediaAssetListFields)
                .all();
            const { total } = await filtered.aggregate((agg) => ({ total: agg.count() }))
            return { rows, total }
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 根据ID查询媒体资产 */
    static async findById(id: string): Promise<MediaAssetDetailColumns | null> {
        try {
            return await db.orm.public.MediaAsset
                .where({ id })
                .select(...mediaAssetDetailFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 查询资产的上传状态 */
    static async findUploadState(id: string): Promise<MediaAssetUploadState | null> {
        try {
            return await db.orm.public.MediaAsset
                .where({ id })
                .select("id", "status", "pendingFileId", "currentVersionId")
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 查找同一目录、同一标题下尚未完成的资产 */
    static async findPendingUpload(
        fileId: string,
        title: string,
        folderId: string | null,
    ): Promise<{ id: string } | null> {
        try {
            return await db.orm.public.MediaAsset
                .where((asset, { fns }) => fns.and(
                    asset.pendingFileId.eq(fileId),
                    asset.title.eq(title),
                    asset.folderId.eq(folderId),
                    asset.status.eq("pending"),
                ))
                .orderBy((asset) => asset.createdAt.desc())
                .select("id")
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 解除仍指向该文件的未完成资产 */
    static async releasePendingFile(fileId: string, orm: Tx["orm"] = db.orm): Promise<void> {
        try {
            const rows = await orm.public.MediaAsset
                .where((asset, { fns }) => fns.eq(asset.pendingFileId, fileId))
                .select("id", "currentVersionId")
                .all();
            for (const row of rows) {
                await orm.public.MediaAsset.where({ id: row.id }).update(row.currentVersionId
                    ? { pendingFileId: null }
                    : { pendingFileId: null, status: "archived" });
            }
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}