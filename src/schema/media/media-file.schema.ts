import { z } from "zod";
import { MEDIA_FILE_STATUS } from "@/constant/media/media-file.constant";

export const checksumQuerySchema = z.string().trim().min(1, "Checksum is required");

export const addFileSchema = z.object({
    assetId: z.uuidv7(),
    etag: z.string().trim().min(1, "Asset etag is required"),
    currentVersionId: z.uuidv7(),
    status: z.enum(MEDIA_FILE_STATUS).default("uploading"),
    storageKey: z.string().trim().min(1, "Asset storage key is required"),
    originalName: z.string().trim().min(1, "File name is required"),
    type: z.string().trim().min(1, "File type is required"),
    size: z.preprocess(
        (val) => val === void 0 ? 0 : Number(val),
        z.number().min(0, "File size must be greater than 0")
    ),
    width: z.preprocess(
        (val) => val === void 0 ? 0 : Number(val),
        z.number().min(0, "File width must be greater than 0")
    ),
    height: z.preprocess(
        (val) => val === void 0 ? 0 : Number(val),
        z.number().min(0, "File height must be greater than 0")
    ),
    durationMs: z.preprocess(
        (val) => val === void 0 ? 0 : Number(val),
        z.number().min(0, "File duration must be greater than 0")
    ),
})

export const addFileCallbackSchema = z.object({
    assetId: z.uuidv7(),
    fileId: z.uuidv7(),
    currentVersionId: z.uuidv7(),
    size: z.preprocess((val) => Number(val), z.number().min(0, "Callback size must be greater than 0")),
    qiniuSuccess: z.boolean().default(false),
})

export type ChecksumQueryForm = z.input<typeof checksumQuerySchema>;
export type ChecksumQueryDTO = z.output<typeof checksumQuerySchema>;

export type AddFileFrom = z.input<typeof addFileSchema>;
export type AddFileDTO = z.output<typeof addFileSchema>;

export type AddFilECallbackFrom = z.input<typeof addFileCallbackSchema>;
export type AddFilECallbackDTO = z.output<typeof addFileCallbackSchema>;