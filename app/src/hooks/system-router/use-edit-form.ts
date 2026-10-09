import {
    useForm,
    revalidateLogic
} from "@tanstack/react-form-nextjs";
import {
    updateSystemRouterSchema,
    UpdateSystemRouterForm,
    UpdateSystemRouterDTO
} from "@/lib/schema/system-router.schema";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import {
    useQueryClient,
    useMutation,
} from "@tanstack/react-query";
import { systemRouterKeys } from "@/constants/system-router.constant";
import { SystemRouterMutation } from "@/mutation/system-router.mutation";
function toEditValues(row: SystemRouterTreeNodeVO): UpdateSystemRouterForm {
    return {
        parentId: row.parentId,
        name: row.name,
        path: row.path,
        icon: row.icon,
        isActive: row.isActive,
        permissionIds: row.permissionIds,
        sort: row.sort,
    };
}

function toUpdateInput(value: UpdateSystemRouterForm): UpdateSystemRouterDTO {
    const icon = value.icon?.trim();
    return {
        parentId: value.parentId,
        name: value.name,
        path: value.path,
        icon: icon === undefined ? value.icon : icon === "" ? null : icon,
        isActive: value.isActive,
        permissionIds: value.permissionIds,
        sort: value.sort,
    };
}

type EditFormOptions = {
    onSuccess?: () => void;
}

export function useEditForm(
    row: SystemRouterTreeNodeVO,
    options?: EditFormOptions
) {
    const queryClient = useQueryClient();
    const { mutateAsync } = useMutation({
        ...SystemRouterMutation.update(row.id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: systemRouterKeys.all });
            options?.onSuccess?.();
        },
    });
    const form = useForm({
        defaultValues: toEditValues(row),
        validationLogic: revalidateLogic(),
        validators: {
            onSubmit: updateSystemRouterSchema,
            onChange: updateSystemRouterSchema,
        },
        onSubmit: async ({ value }) => {
            const parsed = updateSystemRouterSchema.safeParse(toUpdateInput(value));
            if (!parsed.success) return;
            await mutateAsync(parsed.data);
        }
    })
    return { form };
};

export type EditFromType = ReturnType<typeof useEditForm>["form"];