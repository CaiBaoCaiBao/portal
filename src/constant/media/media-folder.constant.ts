import { PaginationFolderForm } from "@/schema/media";

const BASE_KEY = "media-folder" as const;
export const FOLDER_PAGE_SIZE = 10 as const;

export const MEDIA_FOLDER_QUERY_KEY = {
    lists: () => [BASE_KEY, "list"] as const,
    pagination: ({ query, page, order }: PaginationFolderForm) =>
        [BASE_KEY, "list", query, page, order] as const,
}

export const MEDIA_FOLDER_MUTATION_KEY = {
    create: () => [BASE_KEY, "create"] as const,
    update: (id: string) => [BASE_KEY, "update", id] as const,
    delete: (id: string) => [BASE_KEY, "delete", id] as const,
}