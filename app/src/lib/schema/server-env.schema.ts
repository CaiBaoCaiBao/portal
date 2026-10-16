import { z } from "zod";

const serverEnvSchema = z.object({
    Env: z.enum(["development", "production", "test"]),
    IsPro: z.boolean(),

    AccessKey: z.string(),
    Domain: z.string(),
}).transform((data) => ({
    app: {
        isPro: data.IsPro,
        env: data.Env,
    },
    qiniu: {
        accessKey: data.AccessKey,
        domain: data.Domain,
    }
}));

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv = serverEnvSchema.parse({
    Env: process.env.NODE_ENV as "development" | "production" | "test",
    IsPro: process.env.NODE_ENV === "production",
    
    AccessKey: process.env.QINIU_ACCESS_KEY,
    Domain: process.env.QINIU_DOMAIN,
});