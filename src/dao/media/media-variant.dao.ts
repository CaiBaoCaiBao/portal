import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import {
    type MediaVariantListColumns,
    variantListFields
} from "@/types/media.type";

type MediaVariantInputFields = FieldInputTypes["public"]["MediaVariant"];

export type MediaVariantInput = Pick<
    MediaVariantInputFields,
    "fileId" | "height" | "width" | "purpose" | "mime" | "size" | "status" | "storageKey" | "url"
>

export class MediaVariantDao {

    /** @description 插入媒体变体记录 */
    static async insert(
        data: MediaVariantInput, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaVariant.create(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 更新媒体变体记录 */
    static async update(
        id: string, data: MediaVariantInput, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaVariant.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除媒体变体记录 */
    static async delete(
        id: string, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaVariant.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 根据文件 ID 查询媒体变体记录 */
    static async findByFileId(fileId: string): Promise<MediaVariantListColumns[]> {
        try {
            return await db.orm.public.MediaVariant
                .where({ fileId })
                .select(...variantListFields)
                .all();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 按文件编号和用途批量查询衍生文件 */
    static async findByFileIds(
        fileIds: string[],
        purpose: string,
    ): Promise<{ fileId: string, url: string }[]> {
        if (fileIds.length === 0) return [];
        try {
            return await db.orm.public.MediaVariant
                .where((variant, { fns }) => fns.and(
                    variant.fileId.in(fileIds),
                    variant.purpose.eq(purpose),
                ))
                .select("fileId", "url")
                .all();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}