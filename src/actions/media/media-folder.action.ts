"use server";

import { actionHandler } from "../action-handler";
import {
    paginationFolderSchema,
    mediaFolderSchema
} from "@/schema/media";
import { MediaService } from "@/services";

export const createFolderAction = actionHandler({
    module: "MEDIA",
    schema: mediaFolderSchema,
    handler: async (input) => {
        await MediaService.createFolder(input);
        return { ok: true };
    }
});

export const paginationFolderAction = actionHandler({
    module: "MEDIA",
    schema: paginationFolderSchema,
    handler: async ({ query, page, order }) => {
        const data = await MediaService.getFolderList(query, page, order);
        return { ok: true, data };
    },
})