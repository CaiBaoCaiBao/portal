import { z } from "zod";

export const uploadFileSchema = z.object({
    file: z.instanceof(File),
    credential: z.object({
        key: z.string(),
        token: z.string(),
        domain: z.string(),
    }),
});

export const createMediaSchema = z.object({
    url: z.url(),
    name: z.string().trim().min(1),
    key: z.string().regex(/^\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.[a-z0-9]+)?$/),
    mime: z.string().trim(),
    size: z.number().positive(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
});

export type UploadFileDTO = z.input<typeof uploadFileSchema>;
export type CreateMediaDTO = z.output<typeof createMediaSchema>;