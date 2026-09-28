"use client";

import { TreeTable } from "@/components/table/tree-table";
import { Column } from "@/components/table/column";
import { treeTableFeatures } from "@/components/table/feature";
import { CategoryItemVO } from "@/types/category.type";

interface Props {
    data: CategoryItemVO[];
    columns: Column<typeof treeTableFeatures, CategoryItemVO>[];
}

function getCategorySubRows(row: CategoryItemVO) {
    return row.children;
}

function getCategoryRowId(row: CategoryItemVO) {
    return row.id;
}

export function CategoryDataTable({ data, columns }: Props) {
    return (
        <div className="hidden md:block">
            <div className="border rounded-md">
                <TreeTable
                    data={data}
                    columns={columns}
                    getSubRows={getCategorySubRows}
                    getRowId={getCategoryRowId}
                />
            </div>
        </div>
    );
}
