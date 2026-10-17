import "server-only";
import qiniu from "qiniu";
import { serverConfig } from "@/config/server.config";

export class QiniuServer {
    static readonly as = serverConfig.qiniu.accessKey;
    static readonly sk = serverConfig.qiniu.secretKey;
    static readonly bucket = serverConfig.qiniu.bucket;
    static readonly mac = new qiniu.auth.digest.Mac(this.as, this.sk);

    /** @description 获取上传凭证 */
    static async getUploadToken(key:string = "tmp"): Promise<{
        token: string, domain: string
    }> {
        const options = {
            scope: `${this.bucket}:${key}`,
            expires: 3600,
            returnBody: '{"key":"$(key)","hash":"$(etag)","size":$(fsize)}',
        };
        const putPolicy = new qiniu.rs.PutPolicy(options);
        const uploadToken = putPolicy.uploadToken(this.mac);
        return {
            token: uploadToken,
            domain: serverConfig.qiniu.domain,
        };
    };
}