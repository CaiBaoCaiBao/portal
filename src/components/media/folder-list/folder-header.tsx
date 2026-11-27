"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon,SearchIcon } from "lucide-react";
import { stopEventBubble } from "@/lib";

interface Props {
    onCreate: () => void;
}
export function FolderHeader({
    onCreate
}: Props) {
    return (
        <div className="border-b py-2 px-2 flex items-center gap-2">
            <Button
                size="icon-sm"
                variant="ghost"
                onClick={onCreate}
                onMouseDown={(e) => stopEventBubble(e)}
            >
                <PlusIcon />
            </Button>
            <Button
                size="icon-sm"
                variant="ghost"
            >
                <SearchIcon />
            </Button>
        </div>
    )
}