import { z } from "zod";
import { paginationQuerySchema, orderQuerySchema } from "@/schema/globals.schema";

export const mediaFolderSchema = z.object({
    name: z.string().trim().min(1, "Name is required")
});

export const mediaFolderQuerySchema = z.object({
    name: z.string().trim().optional(),
});

export const mediaFolderOrderSchema = z.object({
    createdAt: z.iso.datetime({ offset: true }).optional()
});

export const paginationFolderSchema = z.object({
    query: mediaFolderQuerySchema,
    page: paginationQuerySchema,
    order: orderQuerySchema(mediaFolderOrderSchema),
});

export type MediaFolderForm = z.input<typeof mediaFolderSchema>;
export type MediaFolderDTO = z.output<typeof mediaFolderSchema>;

export type MediaFolderQueryForm = z.input<typeof mediaFolderQuerySchema>;
export type MediaFolderQueryDTO = z.output<typeof mediaFolderQuerySchema>;

export type MediaFolderOrderForm = z.input<typeof mediaFolderOrderSchema>;
export type MediaFolderOrderDTO = z.output<typeof mediaFolderOrderSchema>;

export type PaginationFolderForm = z.input<typeof paginationFolderSchema>;
export type PaginationFolderDTO = z.output<typeof paginationFolderSchema>;