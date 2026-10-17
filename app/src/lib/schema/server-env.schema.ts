import { z } from "zod";

const serverEnvSchema = z.object({
    Env: z.enum(["development", "production", "test"]),
    IsPro: z.boolean(),

    AccessKey: z.string(),
    SecretKey: z.string(),
    Domain: z.string(),
    Bucket: z.string(),

    DatabaseUrl: z.string(),
}).transform((data) => ({
    app: {
        isPro: data.IsPro,
        env: data.Env,
    },
    qiniu: {
        accessKey: data.AccessKey,
        secretKey: data.SecretKey,
        domain: data.Domain,
        bucket: data.Bucket,
    },
    database: {
        url: data.DatabaseUrl,
    },
}));

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv = serverEnvSchema.parse({
    Env: process.env.NODE_ENV as "development" | "production" | "test",
    IsPro: process.env.NODE_ENV === "production",
    
    AccessKey: process.env.QINIU_ACCESS_KEY,
    SecretKey: process.env.QINIU_SECRET_KEY,
    Domain: process.env.QINIU_DOMAIN,
    Bucket: process.env.QINIU_BUCKET,

    DatabaseUrl: process.env.DATABASE_URL,
});