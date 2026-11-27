"use server";

import { paginationAssetSchema } from "@/schema/media";
import { actionHandler } from "../action-handler";
import { MediaService } from "@/services";

export const paginationAssetAction = actionHandler({
    module: "MEDIA",
    schema: paginationAssetSchema,
    handler: async ({ query, page, order }) => {
        const data = await MediaService.queryAsset(query, page, order);
        return { ok: true, data };
    }
})