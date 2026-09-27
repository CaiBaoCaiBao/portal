"use client";

import { useTable, type RowData, type TableOptions } from "@tanstack/react-table";
import { Column } from "./column";
import { treeTableFeatures } from "./feature";
import { TableView } from "./table-view";

type TreeTableProps<T extends RowData> = {
    data: T[];
    columns: Column<typeof treeTableFeatures, T>[];
    getSubRows: NonNullable<TableOptions<typeof treeTableFeatures, T>["getSubRows"]>;
    getRowId?: TableOptions<typeof treeTableFeatures, T>["getRowId"];
};

export function TreeTable<T extends RowData>({
    data,
    columns,
    getSubRows,
    getRowId,
}: TreeTableProps<T>) {
    const table = useTable({
        features: treeTableFeatures,
        data,
        columns,
        getSubRows,
        getRowId,
    });

    return <TableView table={table} />;
}
