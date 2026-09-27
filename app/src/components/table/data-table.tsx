"use client";

import { useTable, type RowData, type TableOptions } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Column } from "./column";
import { dataTableFeatures } from "./feature";
import { TableView } from "./table-view";

type DataTableProps<T extends RowData> = {
    data: T[];
    columns: Column<typeof dataTableFeatures, T>[];
    getRowId?: TableOptions<typeof dataTableFeatures, T>["getRowId"];
};

export function DataTable<T extends RowData>({ data, columns, getRowId }: DataTableProps<T>) {
    const table = useTable({
        features: dataTableFeatures,
        data,
        columns,
        getRowId,
    });
    const pageCount = table.getPageCount();
    const pageIndex = table.state.pagination.pageIndex;

    return (
        <div className="space-y-2">
            <TableView table={table} />
            {pageCount > 1 ? (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {pageIndex + 1} / {pageCount}
                    </span>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            ) : null}
        </div>
    );
}
