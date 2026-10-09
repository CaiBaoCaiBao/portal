import {
    useForm,
    revalidateLogic
} from "@tanstack/react-form-nextjs";
import {
    useMutation,
    useQueryClient,
    mutationOptions,
} from "@tanstack/react-query";
import { createSystemRouterSchema } from "@/lib/schema/system-router.schema";
import { systemRouterKeys } from "@/constants/system-router.constant";
import { CreateSystemRouterDTO } from "@/lib/schema/system-router.schema";
import { Http } from "@/lib/utils";
import { SystemRouterMutation } from "@/mutation/system-router.mutation";
export type CreateFormValues = {
    type: "page" | "group";
    parentId: string;
    scope: "" | "site" | "admin";
    name: string;
    path: string;
    icon: string;
    isActive: boolean;
    permissionIds: string[];
    sort: number;
};

const defaultValues: CreateFormValues = {
    type: "page",
    parentId: "",
    scope: "",
    name: "",
    path: "",
    icon: "",
    isActive: true,
    permissionIds: [],
    sort: 0,
};

function toCreateInput(value: CreateFormValues) {
    const icon = value.icon.trim();
    const base = {
        name: value.name,
        isActive: value.isActive,
        icon: icon === "" ? null : icon,
        permissionIds: value.permissionIds,
        sort: value.sort,
    };
    const parentId = value.parentId.trim();

    if (value.type === "group" && parentId === "") {
        if (value.scope === "admin") {
            return {
                type: "group" as const,
                parentId: null,
                scope: "admin" as const,
                path: "admin" as const,
                ...base,
            };
        }
        if (value.scope === "site") {
            return {
                type: "group" as const,
                parentId: null,
                scope: "site" as const,
                path: null,
                ...base,
            };
        }
        return {
            type: "group" as const,
            parentId: null,
            scope: value.scope,
            path: null,
            ...base,
        };
    }

    if (value.type === "group") {
        const path = value.path.trim();
        return {
            type: "group" as const,
            parentId,
            path: path === "" ? null : path,
            ...base,
        };
    }

    return {
        type: "page" as const,
        parentId,
        path: value.path.trim(),
        ...base,
    };
}

const fieldKeys = [
    "type",
    "parentId",
    "scope",
    "name",
    "path",
    "icon",
    "isActive",
    "permissionIds",
    "sort",
] as const satisfies readonly (keyof CreateFormValues)[];

function validateCreate({ value }: { value: CreateFormValues }) {
    if (
        value.type === "group" &&
        value.parentId.trim() === "" &&
        value.scope !== "site" &&
        value.scope !== "admin"
    ) {
        return {
            fields: {
                scope: { message: "请选择范围" },
            },
        };
    }

    const result = createSystemRouterSchema.safeParse(toCreateInput(value));
    if (result.success) return undefined;

    const fields: Partial<Record<keyof CreateFormValues, { message: string }>> = {};
    let formMessage: string | undefined;
    for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && fieldKeys.includes(key as (typeof fieldKeys)[number])) {
            const field = key as keyof CreateFormValues;
            fields[field] ??= { message: issue.message };
            continue;
        }
        formMessage ??= issue.message;
    }

    if (formMessage && Object.keys(fields).length === 0) {
        return { form: { message: formMessage }, fields };
    }
    return { fields };
}

type CreateFormOptions = {
    onSuccess?: () => void;
}

export function useCreateForm(
    initial?: Partial<CreateFormValues>,
    options?: CreateFormOptions,
) {
    const queryClient = useQueryClient();
    const { mutateAsync } = useMutation({
        ...SystemRouterMutation.create(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: systemRouterKeys.all });
            options?.onSuccess?.();
        },
    });
    const form = useForm({
        defaultValues: {
            ...defaultValues,
            ...initial,
        },
        validationLogic: revalidateLogic(),
        validators: {
            onSubmit: validateCreate,
            onChange: validateCreate,
        },
        onSubmit: async ({ value }) => {
            const parsed = createSystemRouterSchema.safeParse(toCreateInput(value));
            if (!parsed.success) return;
            await mutateAsync(parsed.data);
        },
    });
    return { form };
}

export type CreateFromType = ReturnType<typeof useCreateForm>["form"];
