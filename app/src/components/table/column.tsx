import {
    createColumnHelper,
    type ColumnDef,
    type RowData,
    type TableFeatures,
} from "@tanstack/react-table";

export const columnHelper = <TFeatures extends TableFeatures, TData extends RowData>() =>
    createColumnHelper<TFeatures, TData>();

export type Column<TFeatures extends TableFeatures, TData extends RowData> =
    ColumnDef<TFeatures, TData>;
