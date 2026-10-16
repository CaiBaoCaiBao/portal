import qiniu from "qiniu";
import { serverConfig } from "@/config/server.config";
import { generateUUID } from "@/lib/utils";
export class Qiniu {
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
        const huanan = qiniu.zone.Zone_z2.cdnUpHosts[0];
        const putPolicy = new qiniu.rs.PutPolicy(options);
        const uploadToken = putPolicy.uploadToken(this.mac);
        return {
            token: uploadToken,
            domain: serverConfig.qiniu.domain,
        };
    };

    static buildObjectKey(filename: string) {
        const now = new Date();
        const yyyy = String(now.getFullYear());
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dot = filename.lastIndexOf(".");
        const ext = dot >= 0 ? filename.substring(dot).toLocaleLowerCase() : "";
        return `${yyyy}/${mm}/${generateUUID()}${ext}`;
    }

    static async uploadFile(file: File) {
        
    }
}