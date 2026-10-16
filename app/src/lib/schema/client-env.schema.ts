import { z } from "zod";

const clientEnvSchema = z.object({
    AppName: z.string(),
    
}).transform((data) => ({
    app: {
        title: data.AppName,
    }
}));

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv = clientEnvSchema.parse({
    AppName: process.env.NEXT_PUBLIC_APP_NAME,
});