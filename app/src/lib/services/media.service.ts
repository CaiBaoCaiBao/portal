
export class MediaService {
    static readonly uploadHost = "upload-z2.qiniup.com";
    static async uploadToQiniu(
        file: File,
        credential: { key: string, token: string, domain: string }
    ) {
        const { key, token, domain } = credential;
        const form = new FormData();
        form.append("token", token);
        form.append("key", key);
        form.append("file", file);
        const res = await fetch(`https://${this.uploadHost}`, {
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