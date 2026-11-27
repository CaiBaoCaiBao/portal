"use client";
import { FolderList } from "./folder-list";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MediaQuery } from "@/query/media.query";
import { ASSET_PAGE_SIZE } from "@/constant/media";

export function MediaPage() {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const { data: assetList = { list: [], total: 0 } } = useQuery(MediaQuery.paginationAsset({
        query: { folderId: selectedFolderId },
        page: { pageIndex: 0, pageSize: ASSET_PAGE_SIZE },
        order: [],
    }));
    return (
        <div className="flex h-full min-h-0 overflow-hidden">
            <FolderList
                setSelectedFolderId={setSelectedFolderId}
                selectedFolderId={selectedFolderId}
            />
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
                {assetList.list.map((asset) => (
                    <div key={asset.id}>
                        {asset.title}
                    </div>
                ))}
            </div>
        </div>
    )
}