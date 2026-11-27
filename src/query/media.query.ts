import { PaginationFolderForm } from "@/schema/media";
import { queryOptions } from "@tanstack/react-query";
import { MEDIA_FOLDER_QUERY_KEY } from "@/constant/media";
import { paginationFolderAction } from "@/actions/media/media-folder.action";
import { ActionError } from "@/actions/result";

export class MediaQuery {
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