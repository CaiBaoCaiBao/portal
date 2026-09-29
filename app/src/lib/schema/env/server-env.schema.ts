import { z } from "zod";

export const serverEnvSchema = z.object({
    appName: z.string().min(1),
    isPro: z.boolean(),
    env: z.enum(["development", "production", "test"]),
}).transform((data) => {
    return {
        app: {
            name: data.appName,
            isPro: data.isPro,
            env: data.env,
        },
    };
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const serverEnv = serverEnvSchema.parse({
    appName: process.env.APP_NAME,
    isPro: process.env.NODE_ENV === "production",
    env: process.env.NODE_ENV,
});