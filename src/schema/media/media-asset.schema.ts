import { z } from "zod";
import { MEDIA_ASSET_STATUS } from "@/constant/media/media-asset.constant";
import { MEDIA_FILE_STATUS } from "@/constant/media/media-file.constant";
import { orderQuerySchema, paginationQuerySchema } from "../globals.schema";

export const mediaAssetSchema = z.object({
    title: z.string().trim().min(1, "Asset title is required"),
    description: z.string().trim().min(1, "Asset description is required").nullable().default(null),
    folderId: z.uuidv7().nullable().default(null),
    status: z.enum(MEDIA_ASSET_STATUS).default("pending"),
    etag: z.string().trim().min(1, "Asset etag is required"),
    size: z.preprocess((val) => Number(val), z.number().min(0, "Asset size must be greater than 0")),
    width: z.preprocess(
        (val) => (val == null || val === "" ? null : Number(val)),
        z.number().int().gt(0, "Asset width must be greater than 0").nullable(),
    ),
    height: z.preprocess(
        (val) => (val == null || val === "" ? null : Number(val)),
        z.number().int().gt(0, "Asset width must be greater than 0").nullable(),
    ),
    durationMs: z.preprocess(
        (val) => (val == null || val === "" ? null : Number(val)),
        z.number().int().gt(0, "Asset width must be greater than 0").nullable(),
    ),
    storageKey: z.string().trim().min(1, "Asset storage key is required"),
    type: z.string().trim().min(1, "Asset type is required"),
});

export const mediaAssetCallbackSchema = z.object({
    assetId: z.uuidv7(),
    fileId: z.uuidv7(),
    size: z.preprocess((val) => Number(val), z.number().min(0, "Callback size must be greater than 0")),
    qiniuSuccess: z.boolean(),
});

export const mediaAssetAddVersionSchema = z.object({
    assetId: z.uuidv7(),
    etag: z.string().trim().min(1, "Asset etag is required"),
    currentVersionId: z.uuidv7(),
    status: z.enum(MEDIA_FILE_STATUS).default("uploading"),
    storageKey: z.string().trim().min(1, "Asset storage key is required"),
});

export const mediaAssetUpdateSchema = z.object({
    title: z.string().trim().min(1, "Asset title is required").optional(),
    description: z.string().trim().min(1, "Asset description is required").nullable().default(null).optional(),
    status: z.enum(MEDIA_ASSET_STATUS).optional(),
    folderId: z.uuidv7().nullable().optional()
});

export const mediaAssetQuerySchema = z.object({
    folderId: z.uuidv7().nullable(),
    title: z.string().trim().min(1).optional(),
    status: z.enum(MEDIA_ASSET_STATUS).optional(),
    kind: z.string().trim().min(1).optional(),
    createdFrom: z.iso.datetime({ offset: true }).optional(),
    createdTo: z.iso.datetime({ offset: true }).optional(),
});

export const mediaAssetOrderSchema = z.object({
    createdAt: z.iso.datetime({ offset: true }).optional(),
});

export const paginationAssetSchema = z.object({
    query: mediaAssetQuerySchema,
    page: paginationQuerySchema,
    order: orderQuerySchema(mediaAssetOrderSchema)
})

export type MediaAssetForm = z.input<typeof mediaAssetSchema>;
export type MediaAssetDTO = z.output<typeof mediaAssetSchema>;

export type MediaAssetUpdateForm = z.input<typeof mediaAssetUpdateSchema>;
export type MediaAssetUpdateDTO = z.output<typeof mediaAssetUpdateSchema>;

export type MediaAssetCallbackForm = z.input<typeof mediaAssetCallbackSchema>;
export type MediaAssetCallbackDTO = z.output<typeof mediaAssetCallbackSchema>;

export type MediaAssetAddVersionForm = z.input<typeof mediaAssetAddVersionSchema>;
export type MediaAssetAddVersionDTO = z.output<typeof mediaAssetAddVersionSchema>;

export type MediaAssetQueryForm = z.input<typeof mediaAssetQuerySchema>;
export type MediaAssetQueryDTO = z.output<typeof mediaAssetQuerySchema>;

export type MediaAssetOrderForm = z.input<typeof mediaAssetOrderSchema>;
export type MediaAssetOrderDTO = z.output<typeof mediaAssetOrderSchema>;

export type PaginationAssetForm = z.input<typeof paginationAssetSchema>;
export type PaginationAssetDTO = z.output<typeof paginationAssetSchema>;