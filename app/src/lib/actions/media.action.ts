"use server";
import { Qiniu } from "@/lib/utils/qiniu";

export async function getUploadCredential(filename: string) {
    const key = Qiniu.buildObjectKey(filename);
    const { token, domain } = await Qiniu.getUploadToken(key);
    return {
        key,
        token,
        domain,
    }
};