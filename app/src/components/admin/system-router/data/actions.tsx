import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    EllipsisVerticalIcon,
    Pencil,
    Info,
    Plus,
    Trash2
} from "lucide-react";
import { Model } from '@/hooks/system-router/use-page';
import { SystemRouterTreeNodeVO } from '@/type/system-router.type';

interface Props {
    row: SystemRouterTreeNodeVO;
    handleModel: (model: Model) => void;
    handleRowSelect: (row: SystemRouterTreeNodeVO) => void;
}

export function Actions({ row, handleModel, handleRowSelect }: Props) {
    const handleClick = (model: Model) => {
        handleRowSelect(row);
        handleModel(model);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={<Button
                    variant="ghost"
                    size="icon-xs"
                >
                    <EllipsisVerticalIcon />
                </Button>}
            />
            <DropdownMenuContent align="end" side="bottom" >
                <DropdownMenuGroup >
                    <DropdownMenuItem onClick={() => handleClick("edit")}>
                        <Pencil />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleClick("detail")}>
                        <Info />
                        Details
                    </DropdownMenuItem>
                    {row.type === "group" && (
                        <DropdownMenuItem onClick={() => handleClick("create")}>
                            <Plus />
                            New Child
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleClick("delete")}
                        disabled={row.children.length > 0}
                    >
                            <Trash2 />
                            Delete
                        </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}