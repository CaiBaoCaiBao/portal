"use client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useTable, ColumnDef } from "@tanstack/react-table";
import { DataTableFeatures, features } from "./column";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";

interface Props {
    data: SystemRouterTreeNodeVO[];
    columns: ColumnDef<DataTableFeatures, SystemRouterTreeNodeVO>[];
}

export function TreeTable({ data, columns }: Props) {
    const table = useTable({
        features,
        data,
        columns,
        getRowId: (row) => row.id,
        getSubRows: (row) => row.children,
    });
    return (
        <Table className="table-fixed">
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            const isName = header.column.id === "name";
                            return (
                                <TableHead
                                    key={header.id}
                                    className={isName ? "w-full" : undefined}
                                    style={isName ? undefined : { width: header.getSize() }}
                                >
                                    {header.isPlaceholder ? null : (
                                        <table.FlexRender header={header} />
                                    )}
                                </TableHead>
                            );
                        })}
                    </TableRow>
                ))}
            </TableHeader>
            <TableBody>
                {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => {
                                const isName = cell.column.id === "name";
                                return (
                                    <TableCell
                                        key={cell.id}
                                        className="overflow-hidden"
                                        style={isName ? undefined : { width: cell.column.getSize() }}
                                    >
                                        <table.FlexRender cell={cell} />
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                            暂无数据
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}