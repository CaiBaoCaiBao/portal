"use client";

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { CategoryItemVO } from "@/types/category.type";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemFooter,
    ItemGroup,
    ItemTitle,
} from "@/components/ui/item";
import { CategoryDataActions } from "./data/actions";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOpenChangeComplete?: (open: boolean) => void;
    item: CategoryItemVO | null;
    openEdit: (item: CategoryItemVO) => void;
    openDelete: (item: CategoryItemVO) => void;
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <Badge variant="outline" className="gap-1.5">
            <span
                className={cn(
                    "size-1.5 rounded-full",
                    active ? "bg-emerald-500" : "bg-muted-foreground/40",
                )}
            />
            {active ? "Active" : "Inactive"}
        </Badge>
    );
}

function DetailChild({
    item,
    openEdit,
    openDetails,
    openDelete,
}: {
    item: CategoryItemVO;
    openEdit: (item: CategoryItemVO) => void;
    openDetails: (item: CategoryItemVO) => void;
    openDelete: (item: CategoryItemVO) => void;
}) {
    const childCount = item.children.length;

    return (
        <Item variant="outline" size="sm">
            <ItemContent>
                <ItemTitle>
                    <span className="truncate">{item.name}</span>
                    {item.isSystem && <Badge variant="outline">System</Badge>}
                </ItemTitle>
            </ItemContent>
            <ItemActions>
                <CategoryDataActions
                    item={item}
                    openEdit={openEdit}
                    openDetails={openDetails}
                    openDelete={openDelete}
                />
            </ItemActions>
            <ItemFooter>
                <code className="min-w-0 truncate rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {item.slug}
                </code>
                <div className="flex shrink-0 items-center gap-2">
                    {childCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {childCount} {childCount === 1 ? "child" : "children"}
                        </span>
                    )}
                    <StatusBadge active={item.isActive} />
                </div>
            </ItemFooter>
        </Item>
    );
}

export function CategoryDetailsDrawer({
    open,
    onOpenChange,
    onOpenChangeComplete,
    item,
    openEdit,
    openDelete,
}: Props) {
    const isMobile = useIsMobile();
    const [nestedItem, setNestedItem] = useState<CategoryItemVO | null>(null);
    const [nestedOpen, setNestedOpen] = useState(false);

    useEffect(() => {
        setNestedItem(null);
        setNestedOpen(false);
    }, [item?.id]);

    if (!item) return null;
    const swipeDirection = isMobile ? "down" : "right";
    const description = item.description?.trim();
    const children = item.children;
    const openChildDetails = (child: CategoryItemVO) => {
        setNestedItem(child);
        setNestedOpen(true);
    };

    return (
        <Drawer
            showSwipeHandle={isMobile}
            swipeDirection={swipeDirection}
            open={open}
            onOpenChange={onOpenChange}
            onOpenChangeComplete={onOpenChangeComplete}
        >
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle className="flex items-center gap-2">
                        <span className="truncate">{item.name}</span>
                        {item.isSystem && <Badge variant="outline">System</Badge>}
                    </DrawerTitle>
                    <DrawerDescription className="flex flex-wrap items-center gap-2">
                        <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {item.slug}
                        </code>
                        <StatusBadge active={item.isActive} />
                    </DrawerDescription>
                </DrawerHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                    {description ? (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground">No description.</p>
                    )}
                    <div className="space-y-2">
                        <div className="text-xs font-medium tracking-wide text-muted-foreground">
                            Children
                        </div>
                        {children.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No children.</p>
                        ) : (
                            <ItemGroup className="gap-2">
                                {children.map((child) => (
                                    <DetailChild
                                        key={child.id}
                                        item={child}
                                        openEdit={openEdit}
                                        openDetails={openChildDetails}
                                        openDelete={openDelete}
                                    />
                                ))}
                            </ItemGroup>
                        )}
                    </div>
                </div>
                <DrawerFooter>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(item)}
                    >
                        <Pencil />
                        Edit
                    </Button>
                    {!item.isSystem && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDelete(item)}
                        >
                            <Trash2 />
                            Delete
                        </Button>
                    )}
                </DrawerFooter>
                {nestedItem && (
                    <CategoryDetailsDrawer
                        open={open && nestedOpen}
                        onOpenChange={setNestedOpen}
                        onOpenChangeComplete={(next) => {
                            if (!next) setNestedItem(null);
                        }}
                        item={nestedItem}
                        openEdit={openEdit}
                        openDelete={openDelete}
                    />
                )}
            </DrawerContent>
        </Drawer>
    );
}
