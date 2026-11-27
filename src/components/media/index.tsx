"use client";
import { FolderList } from "./folder-list";
import { useState } from "react";
export function MediaPage() {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    return (
        <div className="flex h-full min-h-0 overflow-hidden">
            <FolderList
                setSelectedFolderId={setSelectedFolderId}
                selectedFolderId={selectedFolderId}
            />
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
                <div className="h-[200vh]">
                    Media Page
                </div>
            </div>
        </div>
    )
}