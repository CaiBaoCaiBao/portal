import "server-only";
import { db } from "@/prisma/db";
import { MediaInsert } from "@/types/media.type";

export class MediaDao {
    static async create(data: MediaInsert) {
        await db.orm.public.Media.create(data);
    }
}