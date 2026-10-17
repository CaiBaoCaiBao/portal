"use server";
import { QiniuClient } from "@/lib/utils";
import { QiniuServer } from "@/lib/utils/server";
import { MediaService } from "@/lib/services/media.service";
import { CreateMediaDTO, createMediaSchema } from "@/lib/schema/media.schema";


export async function getUploadCredential(filename: string) {
    const key = QiniuClient.buildObjectKey(filename);
    const { token, domain } = await QiniuServer.getUploadToken(key);
    return {
        key,
        token,
        domain,
    }
};

export async function createMedia(dto: CreateMediaDTO) {
    const data = createMediaSchema.parse(dto);
    await MediaService.create(data);
}