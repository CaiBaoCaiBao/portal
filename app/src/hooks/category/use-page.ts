import {
    CategoryListVO,
    CategoryItemVO,
    DeleteCategoryVO,
} from "@/types/category.type";
import { useState } from "react";
import {
    useMutation,
    useQueryClient,
 } from "@tanstack/react-query";
import {
    CategoryQuery,
    categoryQueryKey,
 } from "@/query/category.query";
import { getErrorMessage } from "@/lib/utils/errors/client";

type PageState = {
    operate: null | "save" | "delete" | "details";
    selectedRow: CategoryItemVO | null;
    detailsItem: CategoryItemVO | null;
}

type PageAction = {
    openSave: (row: CategoryItemVO | null) => void;
    openDetails: (row: CategoryItemVO) => void;
    openDelete: (row: CategoryItemVO) => void;
    close: () => void;
    delete: (id: string) => void;
    isDeleting: boolean;
    deleteError: string | null;
    deleteResult: DeleteCategoryVO | null;
    resetDelete: () => void;
}

type PageOptions = {
    listTree: CategoryListVO;
}

export function usePage(options: PageOptions): [PageState, PageAction] {
    const queryClient = useQueryClient();
    const [state, setState] = useState<PageState>({
        operate: null,
        selectedRow: null,
        detailsItem: null,
    });

    const openSave = (row: CategoryItemVO | null) => {
        setState((current) => ({
            ...current,
            operate: "save",
            selectedRow: row,
        }));
    }

    const openDetails = (row: CategoryItemVO) => {
        setState((current) => ({
            ...current,
            operate: "details",
            detailsItem: row,
        }));
    }

    const remove = useMutation({
        ...CategoryQuery.delete(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: categoryQueryKey.list() });
        },
    });

    const openDelete = (row: CategoryItemVO) => {
        remove.reset();
        setState((current) => ({
            ...current,
            operate: "delete",
            selectedRow: row,
            detailsItem: null,
        }));
    }

    const close = () => {
        setState({
            operate: null,
            selectedRow: null,
            detailsItem: null,
        });
    }

    return [state, {
        openSave,
        openDetails,
        openDelete,
        close,
        delete: (id: string) => remove.mutate(id),
        isDeleting: remove.isPending,
        deleteError: remove.isError ? getErrorMessage(remove.error) : null,
        deleteResult: remove.data ?? null,
        resetDelete: remove.reset,
    }];
}
