"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    type Cell,
    type ReactTable,
    type Row,
    type RowData,
    type TableFeatures,
} from "@tanstack/react-table";

type TableViewProps<TFeatures extends TableFeatures, TData extends RowData> = {
    table: ReactTable<TFeatures, TData>;
};

export function TableView<TFeatures extends TableFeatures, TData extends RowData>({
    table,
}: TableViewProps<TFeatures, TData>) {
    const rows = table.getRowModel().rows;
    const columnCount = leafColumnCount(table);

    return (
        <Table>
            <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            if (header.rowSpan === 0) return null;
                            return (
                                <TableHead
                                    key={header.id}
                                    colSpan={header.colSpan}
                                    rowSpan={header.rowSpan}
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
                {rows.length ? (
                    rows.map((row) => (
                        <TableRow
                            key={row.id}
                            data-state={isRowSelected(row) ? "selected" : undefined}
                        >
                            {visibleCells(row).map((cell) => {
                                const { rowSpan, colSpan } = cellSpan(cell);
                                if (rowSpan === 0 || colSpan === 0) return null;
                                return (
                                    <TableCell key={cell.id} rowSpan={rowSpan} colSpan={colSpan}>
                                        <table.FlexRender cell={cell} />
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columnCount} className="h-24 text-center">
                            No results.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

function leafColumnCount<TFeatures extends TableFeatures, TData extends RowData>(
    table: ReactTable<TFeatures, TData>,
) {
    const withVisibility = table as ReactTable<TFeatures, TData> & {
        getVisibleLeafColumns?: () => unknown[];
    };
    return withVisibility.getVisibleLeafColumns?.().length || table.getAllLeafColumns().length || 1;
}

function isRowSelected<TFeatures extends TableFeatures, TData extends RowData>(
    row: Row<TFeatures, TData>,
) {
    const withSelection = row as Row<TFeatures, TData> & {
        getIsSelected?: () => boolean;
    };
    return withSelection.getIsSelected?.() ?? false;
}

function visibleCells<TFeatures extends TableFeatures, TData extends RowData>(
    row: Row<TFeatures, TData>,
) {
    const withVisibility = row as Row<TFeatures, TData> & {
        getVisibleCells?: () => Array<Cell<TFeatures, TData, unknown>>;
    };
    return withVisibility.getVisibleCells?.() ?? row.getAllCells();
}

function cellSpan<TFeatures extends TableFeatures, TData extends RowData>(
    cell: Cell<TFeatures, TData, unknown>,
) {
    const spanning = cell as Cell<TFeatures, TData, unknown> & {
        getRowSpan?: () => number;
        getColSpan?: () => number;
    };
    return {
        rowSpan: spanning.getRowSpan?.() ?? 1,
        colSpan: spanning.getColSpan?.() ?? 1,
    };
}
