"use client";

import {
    columnFilteringFeature,
    columnSizingFeature,
    rowSortingFeature,
    tableFeatures,
    createColumnHelper,
    rowExpandingFeature,
    createExpandedRowModel,
    columnVisibilityFeature,
    rowSelectionFeature,
    globalFilteringFeature,
    createFilteredRowModel,
    filterFn_includesString
} from '@tanstack/react-table';
import { SystemRouterTreeNodeVO } from '@/type/system-router.type';
import { ChevronRight } from 'lucide-react';
import {
    DynamicIcon,
    iconNames,
    type IconName,
} from 'lucide-react/dynamic';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Actions } from "./actions";
import { Model } from '@/hooks/system-router/use-page';
function toIconName(value: string): IconName | null {
    const kebab = value
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    return (iconNames as IconName[]).includes(kebab as IconName)
        ? (kebab as IconName)
        : null;
}

function RowIcon({ name }: { name: string | null }) {
    if (!name) return null;
    const iconName = toIconName(name);
    if (!iconName) return null;
    return <DynamicIcon name={iconName} className="mr-1 inline size-4 shrink-0" />;
}

function formatPath(path: string | null) {
    if (path == null) return "—";
    if (path === "") return "（索引）";
    return path;
}

export const features = tableFeatures({
    columnFilteringFeature,
    rowSortingFeature,
    rowExpandingFeature,
    columnVisibilityFeature,
    rowSelectionFeature,
    columnSizingFeature,
    expandedRowModel: createExpandedRowModel(),
    filteredRowModel: createFilteredRowModel(),
    globalFilteringFeature,
    filterFns: { includesString: filterFn_includesString },
});
export type DataTableFeatures = typeof features;
const columnHelper = createColumnHelper<DataTableFeatures, SystemRouterTreeNodeVO>();

interface Props {
    handleModel: (model: Model) => void
    handleRowSelect: (row: SystemRouterTreeNodeVO) => void
    handleChangeStatus: (id: string, isActive: boolean) => void
}

export function Columns({
    handleModel,
    handleRowSelect,
    handleChangeStatus
}: Props) {
    return columnHelper.columns([
        columnHelper.accessor("name", {
            header: "名称",
            size: 280,
            minSize: 180,
            cell: ({ row, getValue }) => {
                const isExpanded = row.getIsExpanded();
                const canExpand = row.getCanExpand();
                return (
                    <div
                        className="flex min-w-0 items-center gap-1"
                        style={{ paddingLeft: `${row.depth * 1.25}rem` }}
                    >
                        {canExpand ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                aria-label={isExpanded ? "折叠" : "展开"}
                                aria-expanded={isExpanded}
                                className={cn(
                                    "shrink-0 transition-transform",
                                    isExpanded && "rotate-90",
                                )}
                                onClick={row.getToggleExpandedHandler()}
                            >
                                <ChevronRight />
                            </Button>
                        ) : (
                            <span className="inline-block size-6 shrink-0" />
                        )}
                        <span className="inline-flex min-w-0 items-center truncate">
                            <RowIcon name={row.original.icon} />
                            {getValue()}
                        </span>
                    </div>
                );
            },
        }),
        columnHelper.accessor("type", {
            header: "类型",
            size: 88,
            minSize: 72,
            cell: ({ getValue }) => (
                <Badge variant="secondary">{getValue() === "group" ? "分组" : "页面"}</Badge>
            ),
        }),
        columnHelper.accessor("scope", {
            header: "范围",
            size: 88,
            minSize: 72,
            cell: ({ getValue }) => {
                const scope = getValue();
                if (scope === "admin") return <Badge variant="secondary">后台</Badge>;
                if (scope === "site") return <Badge variant="outline">站点</Badge>;
                return <span className="text-muted-foreground">—</span>;
            },
        }),
        columnHelper.accessor("path", {
            header: "路径段",
            size: 140,
            minSize: 100,
            cell: ({ getValue }) => (
                <span className="block truncate font-mono text-xs text-muted-foreground">
                    {formatPath(getValue())}
                </span>
            ),
        }),
        columnHelper.accessor("isActive", {
            header: "状态",
            size: 88,
            minSize: 72,
            cell: ({ getValue,row }) => (
                <button
                    type="button"
                    onClick={() => handleChangeStatus(row.original.id, getValue())}
                >
                    <Badge variant={getValue() ? "secondary" : "destructive"}>
                        {getValue() ? "启用" : "停用"}
                    </Badge>
                </button>
            ),
        }),
        columnHelper.accessor("sort", {
            header: "排序",
            size: 72,
            minSize: 56,
            cell: ({ getValue }) => (
                <span className="tabular-nums text-muted-foreground">{getValue()}</span>
            ),
        }),
        columnHelper.accessor("permissionIds", {
            header: "权限",
            size: 120,
            minSize: 88,
            cell: ({ getValue }) => {
                const ids = getValue();
                if (ids.length === 0) {
                    return <span className="text-muted-foreground">任意登录</span>;
                }
                return <span className="tabular-nums">{ids.length} 项</span>;
            },
        }),
        columnHelper.display({
            id: "actions",
            header: "操作",
            size: 96,
            minSize: 80,
            cell: ({ row }) => (
                <Actions
                    row={row.original}
                    handleRowSelect={handleRowSelect}
                    handleModel={handleModel}
                />
            ),
        }),
    ]);
}
