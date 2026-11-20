import { z } from "zod";

export const clientEnvSchema = z.object({
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
}).transform((val) => {
    return {
        app: {
            name: val.NEXT_PUBLIC_APP_NAME,
        },
    };
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;