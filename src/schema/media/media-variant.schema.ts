import { z } from "zod";
import {
    VARIANT_IMAGE_PURPOSE,
    VARIANT_AV_PURPOSE,
    VARIANT_DOC_PURPOSE,
} from "@/constant/media/media-variant.constant";

export const mediaVariantSchema = z.object({
    fileId: z.uuidv7(),
    purpose: z.enum([...VARIANT_IMAGE_PURPOSE, ...VARIANT_AV_PURPOSE, ...VARIANT_DOC_PURPOSE].flat()),
});

export type MedidVariantForm = z.input<typeof mediaVariantSchema>;
export type MediaVariantDTO = z.output<typeof mediaVariantSchema>;