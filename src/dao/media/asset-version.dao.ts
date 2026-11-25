import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import {
    type AssetVersionListColumns,
    type AssetVersionDetailColumns,
    assetVersionListFields,
    assetVersionDetailFields,
} from "@/types/media.type";

type AssetVersionInputFields = FieldInputTypes["public"]["AssetVersion"];

export type AssetVersionInput = Pick<
    AssetVersionInputFields,
    "assetId" | "fileId" | "version"
>;

export type AssetVersionQuery = {
    readonly assetId: string | null;
}

export class AssetVersionDao {

    /** @description 创建文件版本记录 */
    static async insert(
        data: AssetVersionInput, orm: Tx["orm"] = db.orm
    ): Promise<string> {
        try {
            const row = await orm.public.AssetVersion.create(data);
            return row.id;
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 更新文件版本记录 */
    static async update(
        id: string, data: Partial<AssetVersionInput>, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.AssetVersion.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除文件版本记录 */
    static async delete(
        id: string, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.AssetVersion.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 查询资产的文件版本列表 */
    static async query(data: AssetVersionQuery): Promise<AssetVersionListColumns[]> {
        try {
            return await db.orm.public.AssetVersion
                .where({ id: data.assetId })
                .select(...assetVersionListFields)
                .all();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 根据ID查询文件版本记录 */
    static async findById(id: string): Promise<AssetVersionDetailColumns | null> {
        try {
            return await db.orm.public.AssetVersion
                .where({ id })
                .select(...assetVersionDetailFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}