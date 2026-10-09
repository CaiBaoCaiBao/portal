import { SystemRouterTreeNodeVO } from "@/type/system-router.type"
import { useState } from "react";
import {
    useMutation,
    useQuery,
    useQueryClient,
    queryOptions
} from "@tanstack/react-query";
import { Http } from "@/lib/utils";
import { systemRouterKeys } from "@/constants/system-router.constant";
import { SystemRouterMutation } from "@/mutation/system-router.mutation";

export type Model = "" | "detail" | "create" | "edit" | "delete";

type PageOptions = {
    items: SystemRouterTreeNodeVO[];
}

type PageState = {
    model: Model;
    selectedRow?: SystemRouterTreeNodeVO;
    tree: SystemRouterTreeNodeVO[];
    isDeleting: boolean;
    searchVal: string;
}

type PageActions = {
    handleModel: (model: Model) => void;
    handleRowSelect: (row?: SystemRouterTreeNodeVO) => void;
    handleChangeStatus: (id: string, isActive: boolean) => void;
    handleDelete: (id: string) => void;
    changeSearchVal: (val: string) => void;
}
export function usePage(options: PageOptions): [PageState, PageActions] {
    const queryClient = useQueryClient();
    const { items } = options;
    const { data: tree = items } = useQuery({
        ...queryOptions({
            queryKey: systemRouterKeys.listTree(),
            queryFn: () =>
                Http.unwrap(
                    Http.get<SystemRouterTreeNodeVO[]>(
                        "/api/admin/v1/system-router",
                    ),
                ),
        }),
        initialData: items,
    });

    const { mutateAsync: updateMutation } = useMutation({
        mutationFn: async ({ id, isActive, }: {
            id: string;
            isActive: boolean;
        }) => SystemRouterMutation.patch(id, { isActive }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: systemRouterKeys.all });
        },
    });

    const { mutateAsync: deleteMutation, isPending: isDeleting } = useMutation({
        ...SystemRouterMutation.delete(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: systemRouterKeys.all });
            handleModel("");
        },
    });

    const [state, setState] = useState<PageState>({
        model: "",
        selectedRow: void 0,
        tree,
        isDeleting,
        searchVal:"",
    });

    const handleModel = (model: Model) => {
        setState((prev) => ({
            ...prev,
            model
        }));
    }

    const handleRowSelect = (row?: SystemRouterTreeNodeVO) => {
        setState((prev) => ({
            ...prev,
            selectedRow: row
        }));
    }

    const handleChangeStatus = (id: string, isActive: boolean) => {
        void updateMutation({ id, isActive: !isActive });
    }

    const handleDelete = (id: string) => {
        void deleteMutation(id);
    }

    const changeSearchVal = (val: string) => {
        setState((prev) => ({
            ...prev,
            searchVal: val
        }));
    }

    return [{ ...state, tree, isDeleting }, {
        handleModel,
        handleRowSelect,
        handleChangeStatus,
        handleDelete,
        changeSearchVal
    }];
}