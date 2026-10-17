import "server-only";
import { CreateMediaDTO } from "@/lib/schema/media.schema";
import { MediaDao } from "@/lib/dao";
export class MediaService {
    static async create(data: CreateMediaDTO) {
        console.log("create media");
        await MediaDao.create(data);
    }
}