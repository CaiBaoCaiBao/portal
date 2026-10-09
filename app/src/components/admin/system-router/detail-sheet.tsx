import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import { Button } from "@/components/ui/button";
import { Model } from "@/hooks/system-router/use-page";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data?: SystemRouterTreeNodeVO;
    handleModel: (model: Model) => void;
}

export function DetailSheet({ open, onOpenChange, data, handleModel }: Props) {
    if (!data) return null;
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent showCloseButton={false} side="right">
                <SheetHeader>
                    <SheetTitle>{data?.name ?? "详情"}</SheetTitle>
                </SheetHeader>
                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => handleModel("delete")}
                        disabled={data.children.length > 0}
                    >
                        Delete
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}