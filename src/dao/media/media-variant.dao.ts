import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import {
    mediaVariantListFields,
    type MediaVariantListColumns,
} from "@/types/media.type";

type MediaVariantInputFields = FieldInputTypes["public"]["MediaVariant"];

type MediaVariantInput = Pick<
    MediaVariantInputFields,
    "fileId" | "purpose" | "storageKey" | "url" | "mime" | "size" | "width" | "height"
>;

type MediaVariantPatch = Partial<Pick<
    MediaVariantInput,
    "storageKey" | "url" | "mime" | "size" | "width" | "height"
>>;

export class MediaVariantDao {

    /** 
     * @description 生成完成媒体文件后插入媒体衍生文件
     * @returns `id` 插入行的ID
     *  */
    static async insert(
        data: MediaVariantInput, orm: Tx["orm"] = db.orm,
    ): Promise<string> {
        try {
            const row = await orm.public.MediaVariant.create(data);
            return row.id;
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 修改媒体衍生文件存储结果 */
    static async update(
        id: string, data: MediaVariantPatch, orm: Tx["orm"] = db.orm,
    ): Promise<void> {
        try {
            await orm.public.MediaVariant.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除 `fileId` 对应的全部媒体衍生文件 */
    static async deleteByFileId(fileId: string, orm: Tx["orm"] = db.orm): Promise<void> {
        try {
            await orm.public.MediaVariant.where({ fileId }).deleteAll();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除单个媒体衍生文件 */
    static async delete(id: string, orm: Tx["orm"] = db.orm): Promise<void> {
        try {
            await orm.public.MediaVariant.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 返回 `fileId` 全部衍生行 */
    static async listByFileId(fileId: string): Promise<MediaVariantListColumns[]> {
        try {
            return await db.orm.public.MediaVariant
                .where({ fileId })
                .orderBy((variant) => variant.purpose.asc())
                .select(...mediaVariantListFields)
                .all();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 返回 `fileId` 和 `purpose` 对应的衍生行 */
    static async findByFileAndPurpose(
        fileId: string,purpose: string,
    ): Promise<MediaVariantListColumns | null> {
        try {
            return await db.orm.public.MediaVariant
                .where((variant, { fns }) => fns.and(
                    variant.fileId.eq(fileId),
                    variant.purpose.eq(purpose),
                ))
                .select(...mediaVariantListFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}