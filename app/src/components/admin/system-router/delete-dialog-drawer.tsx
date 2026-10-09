"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import { Spinner } from "@/components/ui/spinner";
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "cn";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data?: SystemRouterTreeNodeVO;
    handleDelete: (id: string) => void;
    isDeleting: boolean;
}

export function DeleteDialogDrawer({
    open,
    onOpenChange,
    data,
    handleDelete,
    isDeleting,
}: Props) {
    const isMobile = useIsMobile();
    if (!data) return null;
    const body = (
        <div className={cn(isMobile && "p-4")}>
            {data.permissionIds.length > 0 ? (
                <section>
                    The route is assigned to {data.permissionIds.length} permissions.
                </section>
            ) : (
                <span className="text-muted-foreground">
                    The route is not assigned to any permissions.
                </span>
            )}
        </div>
    )
    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Deleting {data.name}</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this route?(cannot be undone)
                        </DialogDescription>
                    </DialogHeader>
                    {body}
                    <DialogFooter>
                        <Button variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={isDeleting || (data.children?.length ?? 0) > 0}
                            onClick={() => handleDelete(data.id)}
                        >
                            {isDeleting ? <Spinner /> : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }
    return (
        <Drawer
            open={open}
            onOpenChange={onOpenChange}
            showSwipeHandle={isMobile}
        >
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Deleting {data.name}</DrawerTitle>
                </DrawerHeader>
                {body}
                <DrawerFooter>
                    <Button variant="outline" disabled={isDeleting} onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        disabled={isDeleting || (data.children?.length ?? 0) > 0}
                        onClick={() => handleDelete(data.id)}
                    >
                        {isDeleting ? <Spinner /> : "Delete"}
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}