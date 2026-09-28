import {
    CategoryListVO,
    CategoryItemVO
} from "@/types/category.type";
import { useState } from "react";

type PageState = {
    operate: null | "save" | "delete" | "details";
    selectedRow: CategoryItemVO | null;
    detailsItem: CategoryItemVO | null;
}

type PageAction = {
    openSave: (row: CategoryItemVO | null) => void;
    openDetails: (row: CategoryItemVO) => void;
    close: () => void;
}

type PageOptions = {
    listTree: CategoryListVO;
}
export function usePage(options: PageOptions): [PageState, PageAction] {
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
        close,
    }];
}
