"use client";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import { usePage } from "@/hooks/system-router/use-page";
import { Columns } from "./data/column";
import { TreeTable } from "./data/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DetailSheet } from "./detail-sheet";
import { SaveDialogDrawer } from "./save-dialog-drawer";
import { DeleteDialogDrawer } from "./delete-dialog-drawer";

interface Props {
    items: SystemRouterTreeNodeVO[]
}
export function SystemRouter({ items }: Props) {

    const [state, actions] = usePage({ items });
    const columns = Columns({
        handleModel: actions.handleModel,
        handleRowSelect: actions.handleRowSelect,
        handleChangeStatus: actions.handleChangeStatus,
    });
    return (
        <div className="space-y-2">
            <div>
                <Button
                    size="sm"
                    onClick={() => {
                        actions.handleRowSelect(undefined);
                        actions.handleModel("create");
                    }}
                >
                    <Plus />
                    New Router
                </Button>
            </div>
            <div className="hidden md:block">
                <div className="border rounded-md">
                    <TreeTable
                        data={state.tree}
                        columns={columns}
                    />
                </div>
            </div>
            <DetailSheet
                open={state.model === "detail"}
                onOpenChange={(open) => actions.handleModel(open ? "detail" : "")}
                data={state.selectedRow}
                handleModel={() => actions.handleModel("delete")}
            />
            <SaveDialogDrawer
                open={state.model === "create" || state.model === "edit"}
                onOpenChange={(open) =>
                    actions.handleModel(
                        open
                            ? state.model === "edit" ? "edit" : "create"
                            : "",
                    )
                }
                model={state.model}
                items={state.tree}
                selectedRow={state.selectedRow}
            />
            <DeleteDialogDrawer
                open={state.model === "delete"}
                onOpenChange={(open) => actions.handleModel(open ? "delete" : "")}
                data={state.selectedRow}
                handleDelete={actions.handleDelete}
                isDeleting={state.isDeleting}
            />
        </div>
    )
}