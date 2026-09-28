"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryItemVO } from "@/types/category.type";
import {
    MoreHorizontal,
    Pencil,
    Trash2,
    Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    item: CategoryItemVO;
    openEdit: (item: CategoryItemVO) => void;
    openDetails: (item: CategoryItemVO) => void;
}

export function CategoryDataActions({ item, openEdit, openDetails }: Props) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                    </Button>
                }
            />
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEdit(item)}>
                    <Pencil />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openDetails(item)}>
                    <Info />
                    Details
                </DropdownMenuItem>
                <DropdownMenuItem
                    variant="destructive"
                    onClick={() => openEdit(item)}
                >
                    <Trash2 />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )

}