import {
    tableFeatures,
    cellSelectionFeature,
    cellSpanningFeature,
    rowSelectionFeature,
    columnVisibilityFeature,
    columnSizingFeature,
    rowPaginationFeature,
    rowExpandingFeature,
    createPaginatedRowModel,
    createExpandedRowModel,
} from "@tanstack/react-table";

const sharedFeatures = {
    cellSelectionFeature,
    cellSpanningFeature,
    rowSelectionFeature,
    columnVisibilityFeature,
    columnSizingFeature,
};

export const dataTableFeatures = tableFeatures({
    ...sharedFeatures,
    rowPaginationFeature,
    paginatedRowModel: createPaginatedRowModel(),
});

export const treeTableFeatures = tableFeatures({
    ...sharedFeatures,
    rowExpandingFeature,
    expandedRowModel: createExpandedRowModel(),
});
