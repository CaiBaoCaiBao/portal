import { io } from "next/cache";
import { Suspense } from "react";
import {
    HydrationBoundary,
    dehydrate,
    QueryClient
} from "@tanstack/react-query";
import { MediaQuery } from "@/query/media.query";
import {
    FOLDER_PAGE_SIZE,
    ASSET_PAGE_SIZE
} from "@/constant/media";
import { MediaPage } from "@/components/media";
import { MediaHeader } from "./header";

export default function Page() {
    return (
        <Suspense fallback={null}>
            <Prefetch />
        </Suspense>
    )
}

async function Prefetch() {
    await io();
    const queryClient = new QueryClient();
    await Promise.all([
        queryClient.query(MediaQuery.paginationFolder({
            query: {},
            page: { pageIndex: 0, pageSize: FOLDER_PAGE_SIZE },
            order: [],
        })),
        queryClient.query(MediaQuery.paginationAsset({
            query: { folderId: null },
            page: { pageIndex: 0, pageSize: ASSET_PAGE_SIZE },
            order: [],
        }))
    ])

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <MediaHeader />
            <MediaPage />
        </HydrationBoundary>
    )
}