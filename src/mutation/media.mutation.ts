import {
    MEDIA_FOLDER_MUTATION_KEY,
    MEDIA_FOLDER_QUERY_KEY
} from "@/constant/media";
import { mutationOptions } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { MediaFolderForm } from "@/schema/media";
import { createFolderAction } from "@/actions/media/media-folder.action";
import { errorMessage } from "@/lib/errors";
import { ActionError } from "@/actions/result";

export class MediaMutation {

    // =================================================================================
    // ================================ Folder Mutation ================================
    // =================================================================================

    static createFolder() {
        return mutationOptions({
            mutationKey: MEDIA_FOLDER_MUTATION_KEY.create(),
            mutationFn: async (input: MediaFolderForm) => {
                const res = await createFolderAction(input);
                if (!res.ok) throw new ActionError(res.error);
            },
            onError: (error) => {
                toast.add({
                    title: "创建文件夹失败",
                    description: errorMessage(error, "创建失败"),
                    type: "error",
                });
            },
            onSuccess: (_data, _id, _result, context) => {
                context.client.invalidateQueries({
                    queryKey: MEDIA_FOLDER_QUERY_KEY.lists(),
                });
            },
            retry: false,
        })
    }
}