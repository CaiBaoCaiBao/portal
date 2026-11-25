import { z } from "zod";
import { MEDIA_ASSET_STATUS } from "@/constant/media/media-asset.constant";

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

export type MediaAssetForm = z.input<typeof mediaAssetSchema>;
export type MediaAssetDTO = z.output<typeof mediaAssetSchema>;