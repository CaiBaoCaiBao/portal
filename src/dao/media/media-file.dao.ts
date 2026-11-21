import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db, type Tx } from "@/prisma/db";
import { PaginationQuery } from "@/types/globals.type";
import {
    mediaFileListFiles,
    MediaFileListColumns,
    mediaFileDetailFields,
    MediaFileDetailColumns
} from "@/types/media.type";

type MediaFileInputFields = FieldInputTypes["public"]["MediaFile"];
type MediaFileInput = Pick<
    MediaFileInputFields,
    "originalName" | "checksum" | "size" | "assetId" | "durationMs" | "height"
    | "status" | "storageKey" | "url" | "version" | "width"
>;


export class MediaFileDao {
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

    static async update(
        id: string, data: Partial<MediaFileInput>, orm: Tx["orm"] = db.orm
    ): Promise<void> {
        try {
            await orm.public.MediaFile.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA")
        }
    }

    static async delete(id: string, orm: Tx["orm"] = db.orm): Promise<void> {
        try {
            await orm.public.MediaFile.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async query(page: PaginationQuery): Promise<{
        rows: MediaFileListColumns[],
        total: number
    }> {
        const filtered = db.orm.public.MediaFile;
        try {
            const rows = await filtered
                .orderBy([(file) => file.version.desc()])
                .offset(page.pageSize * page.pageIndex)
                .limit(page.pageSize)
                .select(...mediaFileListFiles)
                .all();
            const { total } = await filtered.aggregate((agg) => ({ total: agg.count() }));
            return {
                rows,
                total
            }
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async checkSum(etag: string): Promise<MediaFileDetailColumns | null> {
        try {
            return await db.orm.public.MediaFile.where(((file, { fns }) => fns.and(
                file.checksum.eq(etag),
                file.status.neq("failed"),
            ))).select(...mediaFileDetailFields).first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async findById(id: string): Promise<MediaFileDetailColumns | null> {
        try {
            return await db.orm.public.MediaFile.where(((file, { fns }) => fns.and(
                file.id.eq(id),
            ))).select(...mediaFileDetailFields).first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}