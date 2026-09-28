import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    useForm,
    revalidateLogic,
} from "@tanstack/react-form-nextjs";
import {
    type CreateCategoryBody,
    type SaveCategoryFormValue,
    saveCategorySchema,
    type UpdateCategoryBody,
} from "@/lib/schema/category.schema";
import { CategoryItemVO } from "@/types/category.type";
import { CategoryQuery, categoryQueryKey } from "@/query/category.query";
import { getErrorMessage } from "@/lib/utils/errors/client";

const emptySaveFormValue: SaveCategoryFormValue = {
    name: "",
    slug: "",
    description: "",
    parentId: undefined,
    isActive: true,
};

function toSaveFormValue(item: CategoryItemVO): SaveCategoryFormValue {
    return {
        name: item.name,
        slug: item.slug,
        description: item.description ?? "",
        parentId: item.parentId ?? undefined,
        isActive: item.isActive,
    };
}

function toCreateBody(value: SaveCategoryFormValue): CreateCategoryBody {
    return {
        name: value.name,
        slug: value.slug,
        description: value.description?.trim() || undefined,
        parentId: value.parentId || undefined,
        isActive: value.isActive,
    };
}

function toUpdateBody(value: SaveCategoryFormValue): UpdateCategoryBody {
    return {
        name: value.name,
        slug: value.slug,
        description: value.description?.trim() || null,
        parentId: value.parentId ?? null,
        isActive: value.isActive,
    };
}

type SaveFormOptions = {
    categoryId?: string;
    onSaved: () => void;
}

export function useSaveForm(options: SaveFormOptions) {
    const queryClient = useQueryClient();
    const categoryIdRef = useRef(options.categoryId);
    const onSavedRef = useRef(options.onSaved);
    categoryIdRef.current = options.categoryId;
    onSavedRef.current = options.onSaved;

    const save = useMutation({
        ...CategoryQuery.save(),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: categoryQueryKey.list() });
            onSavedRef.current();
        },
    });

    const form = useForm({
        defaultValues: emptySaveFormValue,
        validationLogic: revalidateLogic(),
        validators: {
            onDynamic: saveCategorySchema,
            onSubmit: saveCategorySchema,
        },
        onSubmit: ({ value }) => {
            const id = categoryIdRef.current;
            if (id) {
                save.mutate({ id, body: toUpdateBody(value) });
                return;
            }
            save.mutate({ body: toCreateBody(value) });
        },
    });

    const resetValues = (item: CategoryItemVO | null) => {
        // keepDefaultValues：避免 reset 改掉 defaultValues 后，useForm 的 update 再把值刷回空表单
        form.reset(item ? toSaveFormValue(item) : emptySaveFormValue, {
            keepDefaultValues: true,
        });
    };

    return {
        form,
        isPending: save.isPending,
        errorMessage: save.isError ? getErrorMessage(save.error) : null,
        resetSaveState: save.reset,
        resetValues,
    };
}

export type SaveFormType = ReturnType<typeof useSaveForm>["form"];
