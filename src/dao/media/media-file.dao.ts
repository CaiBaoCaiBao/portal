import "server-only";
import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import {
    type MediaFileDetailColumns,
    mediaFileDetailFields,
} from "@/types/media.type";

type MediaFileInputFields = FieldInputTypes["public"]["MediaFile"];

export type MediaFileInput = Pick<
    MediaFileInputFields,
    "originalName" | "checksum" | "mimeType" | "size" | "status" | "storageKey"
    | "url" | "width" | "height" | "durationMs"
>;

export class MediaFileDao {

    /** @description 创建媒体文件记录 */
    static async insert(
        data: MediaFileInput, orm: Tx["orm"] = db.orm
    ): Promise<string> {
        try {
            const row = await orm.public.MediaFile.create(data);
            return row.id;
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 更新媒体文件记录 */
    static async update(
        id: string, data: Partial<MediaFileInput>, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaFile.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除媒体文件记录 */
    static async delete(
        id: string, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaFile.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 根据 id 查询媒体文件记录 */
    static async findById(id: string): Promise<MediaFileDetailColumns | null> {
        try {
            return await db.orm.public.MediaFile
                .where({ id })
                .select(...mediaFileDetailFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 根据 storageKey 查询媒体文件记录 */
    static async findByStorageKey(storageKey: string): Promise<MediaFileDetailColumns | null> {
        try {
            return await db.orm.public.MediaFile
                .where({ storageKey })
                .select(...mediaFileDetailFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
    
    /** @description 根据 checksum 查询媒体文件记录 */
    static async findByChecksum(checksum: string): Promise<MediaFileDetailColumns | null> {
        try {
            return await db.orm.public.MediaFile
                .where({ checksum })
                .select(...mediaFileDetailFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}