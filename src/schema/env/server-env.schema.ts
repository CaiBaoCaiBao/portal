import { z } from "zod";

export const serverEnvSchema = z.object({
    DATABASE_URL: z.url().min(1),
    ENV: z.enum(["development", "production", "test"]),
    QINIU_ACCESS_KEY: z.string().min(1),
    QINIU_SECRET_KEY: z.string().min(1),
    QINIU_DOMAIN: z.string().min(1),
    QINIU_BUCKET: z.string().min(1),
}).transform((val) => {
    return {
        node: {
            env: val.ENV,
            isPro: val.ENV === "production",
        },
        dataSource: {
            url: val.DATABASE_URL,
        },
        qiniu: {
            accessKey: val.QINIU_ACCESS_KEY,
            secretKey: val.QINIU_SECRET_KEY,
            domain: val.QINIU_DOMAIN,
            bucket: val.QINIU_BUCKET,
        },
    };
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;