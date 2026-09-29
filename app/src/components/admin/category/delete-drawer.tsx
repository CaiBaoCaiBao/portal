"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { CategoryItemVO, DeleteCategoryVO } from "@/types/category.type";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    item: CategoryItemVO | null;
    isPending: boolean;
    errorMessage: string | null;
    result: DeleteCategoryVO | null;
    onConfirm: () => void;
}

export function DeleteDrawer({
    open,
    onOpenChange,
    item,
    isPending,
    errorMessage,
    result,
    onConfirm,
}: Props) {
    const isMobile = useIsMobile();
    const swipeDirection = isMobile ? "down" : "right";
    const childCount = item?.children.length ?? 0;
    const blocked = childCount > 0;
    const done = Boolean(result);

    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            showSwipeHandle={isMobile}
            swipeDirection={swipeDirection}
        >
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>
                        {done ? "Category deleted" : "Delete category"}
                    </DrawerTitle>
                    {item && !done && !blocked && (
                        <DrawerDescription>
                            Posts in “{item.name}” will be moved to the system category “未分类”. Tags in this category will be deleted.
                        </DrawerDescription>
                    )}
                    {item && !done && blocked && (
                        <DrawerDescription>
                            “{item.name}” still has child categories. Delete them first.
                        </DrawerDescription>
                    )}
                    {result && (
                        <DrawerDescription>
                            {result.migratedPostCount} {result.migratedPostCount === 1 ? "post was" : "posts were"} moved to “未分类”.
                        </DrawerDescription>
                    )}
                </DrawerHeader>
                {item && !done && !blocked && (
                    <div className="flex flex-col gap-1 px-4 text-sm text-muted-foreground">
                        <p>{item.postCount} {item.postCount === 1 ? "post" : "posts"} will be moved.</p>
                        <p>{item.tagCount} {item.tagCount === 1 ? "tag" : "tags"} will be deleted.</p>
                    </div>
                )}
                {errorMessage && (
                    <p className="px-4 text-sm text-destructive">{errorMessage}</p>
                )}
                <DrawerFooter>
                    {done ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={!item || blocked || isPending}
                                onClick={onConfirm}
                            >
                                {isPending && <Spinner />}
                                Delete
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
