import { PaginationAssetForm } from "@/schema/media";

export const MEDIA_ASSET_STATUS = ["pending", "ready", "archived"] as const;
export const ASSET_PAGE_SIZE = 10;

const BASE_KEY = "media-asset" as const;

export const MEDIA_ASSET_QUERY_KEY = {
    lists: [BASE_KEY, "lists"] as const,
    pagination: ({ query, page, order }: PaginationAssetForm) =>
        [BASE_KEY, "pagination", query, page, order] as const,
};