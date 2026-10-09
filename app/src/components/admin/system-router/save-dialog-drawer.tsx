"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { type ReactNode, useId } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Model } from "@/hooks/system-router/use-page";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import {
    useCreateForm,
    CreateFromType,
} from "@/hooks/system-router/use-create-form";
import { useEditForm, EditFromType } from "@/hooks/system-router/use-edit-form";
import { CreateForm } from "./create-form";
import { EditForm } from "./edit-form";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    model: Model;
    items: SystemRouterTreeNodeVO[];
    selectedRow?: SystemRouterTreeNodeVO;
}

type SubscribableForm = {
    Subscribe: CreateFromType["Subscribe"] | EditFromType["Subscribe"];
};

function SaveShell({
    open,
    onOpenChange,
    title,
    formId,
    form,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    formId: string;
    form: SubscribableForm;
    children: ReactNode;
}) {
    const isMobile = useIsMobile();
    const actions = (
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
                <>
                    <Button
                        type="submit"
                        form={formId}
                        disabled={!canSubmit || isSubmitting}
                    >
                        {isSubmitting ? <Spinner /> : "Submit"}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                </>
            )}
        </form.Subscribe>
    );

    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent showCloseButton={false} className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    {children}
                    <DialogFooter>{actions}</DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>{title}</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto px-4">{children}</div>
                <DrawerFooter>{actions}</DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function CreateSaveShell({
    open,
    onOpenChange,
    items,
    parentId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: SystemRouterTreeNodeVO[];
    parentId: string;
}) {
    const id = useId();
    const formId = `create-form-${id}`;
    const { form } = useCreateForm({ parentId }, { onSuccess: () => onOpenChange(false) });

    return (
        <SaveShell
            open={open}
            onOpenChange={onOpenChange}
            title="新建路由"
            formId={formId}
            form={form}
        >
            <CreateForm
                formId={formId}
                items={items}
                form={form}
                parentLocked={Boolean(parentId)}
            />
        </SaveShell>
    );
}

function EditSaveShell({
    open,
    onOpenChange,
    items,
    row,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: SystemRouterTreeNodeVO[];
    row: SystemRouterTreeNodeVO;
}) {
    const id = useId();
    const formId = `edit-form-${id}`;
    const { form } = useEditForm(row, {
        onSuccess: () => onOpenChange(false),
      });

    return (
        <SaveShell
            open={open}
            onOpenChange={onOpenChange}
            title="编辑路由"
            formId={formId}
            form={form}
        >
            <EditForm formId={formId} items={items} row={row} form={form} />
        </SaveShell>
    );
}

export function SaveDialogDrawer({
    open,
    onOpenChange,
    model,
    items,
    selectedRow,
}: Props) {
    if (model === "create") {
        const parentId = selectedRow?.type === "group" ? selectedRow.id : "";
        return (
            <CreateSaveShell
                key={parentId || "root"}
                open={open}
                onOpenChange={onOpenChange}
                items={items}
                parentId={parentId}
            />
        );
    }

    if (model === "edit" && selectedRow) {
        return (
            <EditSaveShell
                key={selectedRow.id}
                open={open}
                onOpenChange={onOpenChange}
                items={items}
                row={selectedRow}
            />
        );
    }

    return null;
}
