"use client";

import { useState } from "react";
import { FolderHeader } from "./folder-header";
import { CreateInput } from "./create-input";
import { useQuery } from "@tanstack/react-query";
import { MediaQuery } from "@/query/media.query";
import { FOLDER_PAGE_SIZE } from "@/constant/media";
import {
    Item,
    ItemMedia,
    ItemContent,
    ItemTitle
} from "@/components/ui/item";
import {
    FolderIcon,
    FolderOpenIcon
} from "lucide-react";

interface Props {
    setSelectedFolderId: (id: string | null) => void;
    selectedFolderId: string | null;
}

export function FolderList({
    setSelectedFolderId,
    selectedFolderId,
}: Props) {
    const [showCreateInput, setShowCreateInput] = useState(false);
    const { data: folders = { list: [], total: 0 } } = useQuery(
        MediaQuery.paginationFolder({
            query: {},
            page: { pageIndex: 0, pageSize: FOLDER_PAGE_SIZE },
            order: [],
        }),
    );
    return (
        <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r bg-muted/40">
            <FolderHeader onCreate={() => setShowCreateInput(true)} />
            <div className="min-h-0 flex-1 overflow-y-auto py-2 px-2 flex flex-col gap-1">
                {showCreateInput && (
                    <CreateInput setShowCreateInput={setShowCreateInput} />
                )}
                <Item
                    className="select-none"
                    variant={selectedFolderId === null ? "outline" : "muted"}
                    size="xs"
                    onClick={() => setSelectedFolderId(null)}
                >
                    <ItemMedia variant="icon">
                        {selectedFolderId === null ? <FolderOpenIcon /> : <FolderIcon />}
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle>Not Folder</ItemTitle>
                    </ItemContent>
                </Item>
                {folders.list.map((folder) => {
                    return (
                        <Item
                            key={folder.id}
                            className="select-none"
                            variant={selectedFolderId === folder.id ? "outline" : "muted"}
                            size="xs"
                            onClick={() => setSelectedFolderId(folder.id)}
                        >
                            <ItemMedia variant="icon">
                                {selectedFolderId === folder.id ? <FolderOpenIcon /> : <FolderIcon />}
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle>{folder.name}</ItemTitle>
                            </ItemContent>
                        </Item>
                    )
                })}
            </div>
        </aside>
    )
}