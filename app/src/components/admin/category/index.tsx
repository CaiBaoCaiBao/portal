"use client";
import { useQuery } from "@tanstack/react-query";
import {
    CategoryItemVO,
    CategoryListVO
} from "@/types/category.type";
import { columns } from "./data/column";
import { Button } from "@/components/ui/button";
import { usePage } from "@/hooks/category/use-page";
import { SaveDialogDrawer } from "./save-dialog-drawer";
import { useSaveForm } from "@/hooks/category/use-save-form";
import { collectSubtreeIds } from "./parent-options";
import { CategoryQuery } from "@/query/category.query";
import { CategoryDataTable } from "./data/data-table";
import { CategoryDataItems } from "./data/data-item";
import { CategoryDetailsDrawer } from "./details-drawer";

interface Props {
    listTree: CategoryListVO;
}

export function CategoryPage({ listTree }: Props) {
    const { data: categories = listTree } = useQuery(CategoryQuery.list());
    const [state, actions] = usePage({ listTree: categories });
    const {
        form,
        isPending,
        errorMessage,
        resetSaveState,
        resetValues,
    } = useSaveForm({
        categoryId: state.selectedRow?.id,
        onSaved: actions.close,
    });
    const openEdit = (item: CategoryItemVO) => {
        resetValues(item);
        actions.openSave(item);
    };
    const column = columns({ openEdit, openDetails: actions.openDetails });
    return (
        <div className="space-y-4">
            <div>
                <Button onClick={() => {
                    resetValues(null);
                    actions.openSave(null);
                }}>
                    New Category
                </Button>
            </div>
            <CategoryDataTable data={categories} columns={column} />
            <CategoryDataItems
                data={categories}
                openEdit={openEdit}
                openDetails={actions.openDetails}
            />
            <SaveDialogDrawer
                open={state.operate === "save"}
                onOpenChange={(open) => {
                    if (open) return;
                    resetSaveState();
                    actions.close();
                }}
                form={form}
                listTree={categories}
                excludeIds={state.selectedRow ? collectSubtreeIds(state.selectedRow) : []}
                isPending={isPending}
                errorMessage={errorMessage}
            />
            <CategoryDetailsDrawer
                open={state.operate === "details"}
                onOpenChange={(open) => {
                    if (open) return;
                    actions.close();
                }}
                item={state.detailsItem}
                openEdit={openEdit}
            />
        </div>
    );
}
