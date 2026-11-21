import "server-only";

import { FieldInputTypes } from "@/prisma/contract";
import { mapPrismaError } from "@/lib/server";
import { db } from "@/prisma/db";
import {
    PaginationQuery,
    OrderQuery
} from "@/types/globals.type";
import {
    mediaFolderListFields,
    MediaFolderListColumns,
    MediaFolderDetailColumns
} from "@/types/media.type";
import { orderByField } from "@prisma/orm-family-sql/orm-client";

type MediaFolderInputFields = FieldInputTypes["public"]["MediaFolder"];

type MediaFolderInput = Pick<MediaFolderInputFields, "name">;

type MediaFolderQuery = Partial<MediaFolderInput>;

type MediaFolderOrder = Pick<MediaFolderInputFields, "createdAt">;

export class MediaFolderDao {

    static async insert(data: MediaFolderInput): Promise<void> {
        try {
            await db.orm.public.MediaFolder.create(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async update(id: string, data: Partial<MediaFolderInput>): Promise<void> {
        try {
            await db.orm.public.MediaFolder.where({ id }).update(data);
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async delete(id: string): Promise<void> {
        try {
            await db.orm.public.MediaFolder.where({ id }).delete();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async query(
        query: MediaFolderQuery = {},
        page: PaginationQuery,
        order: OrderQuery<MediaFolderOrder> = []
    ): Promise<{
        rows: MediaFolderListColumns[],
        total: number,
    }> {
        const filtered = db.orm.public.MediaFolder.where((folder, { fns }) => {
            const conditions = [];
            if (query.name) {
                conditions.push(folder.name.like(`%${query.name}%`));
            }
            return conditions.length > 0 ? fns.and(...conditions) : folder.id.isNotNull();
        });
        const orderRules = order.map(({ field, order: direction }) => orderByField(
            db.orm.public.MediaFolder,
            field,
            direction.toLowerCase(),
            ["createdAt"]
        ));
        try {
            const rows = await filtered
                .orderBy([(folder) => folder.name.asc(), ...orderRules])
                .limit(page.pageSize)
                .offset(page.pageIndex * page.pageSize)
                .select(...mediaFolderListFields)
                .all();
            const { total } = await filtered.aggregate((agg) => ({ total: agg.count() }))

            return { rows, total }
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async findById(id: string): Promise<MediaFolderDetailColumns | null> {
        try {
            return await db.orm.public.MediaFolder
                .whereUnique({ id })
                .select(...mediaFolderListFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }

    static async findByName(name: string): Promise<MediaFolderDetailColumns | null> {
        try {
            return await db.orm.public.MediaFolder
                .whereUnique({ name })
                .select(...mediaFolderListFields)
                .first();
        } catch (error) {
            throw mapPrismaError(error, "MEDIA");
        }
    }
}