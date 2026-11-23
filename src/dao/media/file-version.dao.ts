import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import {
    type FileVersionListColumns,
    type FileVersionDetailColumns,
    fileVersionListFields,
    fileVersionDetailFields,
} from "@/types/media.type";

type FileVersionInputFields = FieldInputTypes["public"]["FileVersion"];

export type FileVersionInput = Pick<
    FileVersionInputFields,
    "assetId" | "fileId" | "version"
>;

export type FileVersionQuery = {
    readonly assetId: string | null;
}

export class FileVersionDao {

    /** @description 创建文件版本记录 */
    static async insert(
        data: FileVersionInput, orm: Tx["orm"] = db.orm
    ): Promise<string> {
        try {
            const row = await orm.public.FileVersion.create(data);
            return row.id;
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 更新文件版本记录 */
    static async update(
        id: string, data: Partial<FileVersionInput>, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.FileVersion.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 删除文件版本记录 */
    static async delete(
        id: string, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.FileVersion.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 查询资产的文件版本列表 */
    static async query(data: FileVersionQuery): Promise<FileVersionListColumns[]> {
        try {
            return await db.orm.public.FileVersion
                .where({ id: data.assetId })
                .select(...fileVersionListFields)
                .all();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    /** @description 根据ID查询文件版本记录 */
    static async findById(id:string):Promise<FileVersionDetailColumns | null> {
        try{
            return await db.orm.public.FileVersion
                .where({ id })
                .select(...fileVersionDetailFields)
                .first();
        }catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}