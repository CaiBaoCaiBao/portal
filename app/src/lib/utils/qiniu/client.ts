import { generateUUID } from "@/lib/utils";
import {
    uploadFileSchema,
    UploadFileDTO
} from "@/lib/schema/media.schema";
const UPLOAD_HOST = "https://upload-z2.qiniup.com";

export class QiniuClient {
    /** @description 构建对象键 */
    static buildObjectKey(filename: string) {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dot = filename.lastIndexOf(".");
        const ext = dot >= 0 ? filename.substring(dot).toLocaleLowerCase() : "";
        return `${yyyy}/${mm}/${generateUUID()}${ext}`;
    }

    static async uploadToQiniu(dto: UploadFileDTO) {
        const { file, credential } = uploadFileSchema.parse(dto);
        const { key, token, domain } = credential;
        const form = new FormData();
        form.append("token", token);
        form.append("key", key);
        form.append("file", file);
        const res = await fetch(`${UPLOAD_HOST}`, {
            method: "POST",
            body: form,
        });
        const data = await res.json();
        const url = `${domain}/${data.key}`;
        return {
            url,
            key,
        }
    }
}