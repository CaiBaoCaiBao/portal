"use client";

import { CategoryItemVO } from "@/types/category.type";
import { columnHelper } from "@/components/table/column";
import { treeTableFeatures } from "@/components/table/feature";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryDataActions } from "./actions";
import { Badge } from "@/components/ui/badge";

const categoryColumnHelper = columnHelper<typeof treeTableFeatures, CategoryItemVO>();

interface Props {
    openEdit: (item: CategoryItemVO) => void;
    openDetails: (item: CategoryItemVO) => void;
}

function ColumnHeader({ children, className }: { children: string; className?: string }) {
    return (
        <div className={cn("text-xs font-medium tracking-wide text-muted-foreground", className)}>
            {children}
        </div>
    );
}

export function columns({ openEdit, openDetails }: Props) {
    return categoryColumnHelper.columns([
        categoryColumnHelper.accessor("name", {
            header: () => <ColumnHeader>Name</ColumnHeader>,
            cell: ({ row }) => {
                const canExpand = row.getCanExpand();
                const isExpanded = row.getIsExpanded();
                const childCount = row.original.children.length;
                return (
                    <div
                        className="flex min-w-48 items-center gap-2"
                        style={{ paddingLeft: row.depth * 20 }}
                    >
                        {canExpand ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => row.toggleExpanded()}
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                                className={cn(
                                    "text-muted-foreground transition-transform duration-200",
                                    isExpanded && "rotate-90",
                                )}
                            >
                                <ChevronRight />
                            </Button>
                        ) : (
                            <span className="inline-block size-7 shrink-0" />
                        )}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="truncate font-medium">{row.original.name}</span>
                                {row.original.isSystem && (
                                    <Badge variant="outline">System</Badge>
                                )}
                            </div>
                            {childCount > 0 && (
                                <div className="text-xs text-muted-foreground">
                                    {childCount} {childCount === 1 ? "child" : "children"}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        }),
        categoryColumnHelper.accessor("slug", {
            header: () => <ColumnHeader>Slug</ColumnHeader>,
            cell: ({ row }) => (
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {row.original.slug}
                </code>
            )
        }),
        categoryColumnHelper.accessor("isActive", {
            header: () => <ColumnHeader>Status</ColumnHeader>,
            cell: ({ row }) => {
                const active = row.original.isActive;
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
        }),
        categoryColumnHelper.display({
            id: "actions",
            header: () => <ColumnHeader className="text-right">Actions</ColumnHeader>,
            cell: ({ row }) => (
                <div className="flex justify-end">
                    <CategoryDataActions
                        item={row.original}
                        openEdit={openEdit}
                        openDetails={openDetails}
                    />
                </div>
            )
        })
    ])
}
