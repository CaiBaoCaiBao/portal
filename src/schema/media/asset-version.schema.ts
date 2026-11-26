import { z } from "zod";

export const assetVersionSchema = z.object({
    assetId: z.uuidv7(),
    targetVersionId: z.uuidv7()
});

export type AssetVersionForm = z.input<typeof assetVersionSchema>;
export type AssetVersionDTO = z.output<typeof assetVersionSchema>;