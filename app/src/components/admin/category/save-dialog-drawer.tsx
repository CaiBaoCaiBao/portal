"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { useId } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
    DrawerClose
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SaveForm } from "./save-form";
import { SaveFormType } from "@/hooks/category/use-save-form";
import { CategoryListVO } from "@/types/category.type";
import { Spinner } from "@/components/ui/spinner";
import { useSelector } from "@tanstack/react-form-nextjs";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    form: SaveFormType;
    listTree: CategoryListVO;
    excludeIds: readonly string[];
    isPending: boolean;
    errorMessage: string | null;
}

export function SaveDialogDrawer({
    open,
    onOpenChange,
    form,
    listTree,
    excludeIds,
    isPending,
    errorMessage,
}: Props) {
    const isMobile = useIsMobile();
    const formId = `save-category-form-${useId()}`;
    const isSubmitting = useSelector(form.store, (state) => state.isSubmitting);
    const canSubmit = useSelector(form.store, (state) => state.canSubmit);
    const saving = isPending || isSubmitting;
    const saveButton = (
        <Button
            type="submit"
            form={formId}
            disabled={saving || !canSubmit}
        >
            {saving && <Spinner />}
            Save
        </Button>
    )
    const saveForm = (
        <SaveForm
            formId={formId}
            form={form}
            listTree={listTree}
            excludeIds={excludeIds}
        />
    )
    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Save Category</DialogTitle>
                    </DialogHeader>
                    {saveForm}
                    {errorMessage && (
                        <p className="text-sm text-destructive">{errorMessage}</p>
                    )}
                    <DialogFooter>
                        {saveButton}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }
    return (
        <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Save Category</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col gap-4 p-4">
                    {saveForm}
                    {errorMessage && (
                        <p className="text-sm text-destructive">{errorMessage}</p>
                    )}
                </div>
                <DrawerFooter>
                    {saveButton}
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}