"use client";

import { CategoryItemVO } from "@/types/category.type";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemFooter,
    ItemGroup,
    ItemTitle,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryDataActions } from "./actions";

interface ItemProps {
    item: CategoryItemVO;
    openEdit: (item: CategoryItemVO) => void;
    openDetails: (item: CategoryItemVO) => void;
}

interface ListProps {
    data: CategoryItemVO[];
    openEdit: (item: CategoryItemVO) => void;
    openDetails: (item: CategoryItemVO) => void;
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

export function DataItem({ item, openEdit,openDetails }: ItemProps) {
    const childCount = item.children.length;
    const hasChildren = childCount > 0;
    const description = item.description?.trim();

    return (
        <Collapsible className="group/collapsible" disabled={!hasChildren}>
            <Item variant="outline" size="sm">
                {hasChildren ? (
                    <CollapsibleTrigger
                        render={
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Toggle children"
                                className="text-muted-foreground transition-transform duration-200 group-data-open/collapsible:rotate-90"
                            >
                                <ChevronRight />
                            </Button>
                        }
                    />
                ) : (
                    <span className="inline-block size-7 shrink-0" />
                )}
                <ItemContent>
                    <ItemTitle>
                        <span className="truncate">{item.name}</span>
                        {item.isSystem && <Badge variant="outline">System</Badge>}
                    </ItemTitle>
                </ItemContent>
                <ItemActions>
                    <CategoryDataActions item={item} openEdit={openEdit} openDetails={openDetails} />
                </ItemActions>
                <ItemFooter>
                    <code className="min-w-0 truncate rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        {item.slug}
                    </code>
                    <div className="flex shrink-0 items-center gap-2">
                        {hasChildren && (
                            <span className="text-xs text-muted-foreground">
                                {childCount} {childCount === 1 ? "child" : "children"}
                            </span>
                        )}
                        <StatusBadge active={item.isActive} />
                    </div>
                </ItemFooter>
            </Item>
            {hasChildren && (
                <CollapsibleContent>
                    <div className="mt-2 ml-4 flex flex-col gap-2 border-l pl-3">
                        {item.children.map((child) => (
                            <DataItem key={child.id} item={child} openEdit={openEdit} openDetails={openDetails} />
                        ))}
                    </div>
                </CollapsibleContent>
            )}
        </Collapsible>
    );
}

export function CategoryDataItems({ data, openEdit, openDetails }: ListProps) {
    if (data.length === 0) {
        return (
            <div className="rounded-md border px-4 py-8 text-center text-sm text-muted-foreground md:hidden">
                No results.
            </div>
        );
    }

    return (
        <ItemGroup className="md:hidden">
            {data.map((item) => (
                <DataItem key={item.id} item={item} openEdit={openEdit} openDetails={openDetails} />
            ))}
        </ItemGroup>
    );
}
