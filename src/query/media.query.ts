import {
    PaginationAssetForm,
    PaginationFolderForm
} from "@/schema/media";
import { queryOptions } from "@tanstack/react-query";
import {
    MEDIA_ASSET_QUERY_KEY,
    MEDIA_FOLDER_QUERY_KEY
} from "@/constant/media";
import {
    paginationFolderAction,
    paginationAssetAction
 } from "@/actions/media";
import { ActionError } from "@/actions/result";

export class MediaQuery {
    // ==============================================================================
    // ================================ Folder Query ================================
    // ==============================================================================

    static paginationAsset(query:PaginationAssetForm) {
        return queryOptions({
            queryKey: MEDIA_ASSET_QUERY_KEY.pagination(query),
            queryFn: async () => {
                const res = await paginationAssetAction(query);
                if (!res.ok) throw new ActionError(res.error);
                if (!res.data) throw new Error("Asset page is missing");
                return res.data;
            }
        })
    }

    // ==============================================================================
    // ================================ Folder Query ================================
    // ==============================================================================

    static paginationFolder(query: PaginationFolderForm) {
        return queryOptions({
            queryKey: MEDIA_FOLDER_QUERY_KEY.pagination(query),
            queryFn: async () => {
                const res = await paginationFolderAction(query);
                if (!res.ok) throw new ActionError(res.error);
                if (!res.data) throw new Error("Folder page is missing");
                return res.data;
            },
        });
    }
}