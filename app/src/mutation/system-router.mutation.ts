import { systemRouterKeys } from "@/constants/system-router.constant";
import {
    CreateSystemRouterDTO,
    UpdateSystemRouterDTO
 } from "@/lib/schema/system-router.schema";
import { Http } from "@/lib/utils";
import { mutationOptions } from "@tanstack/react-query";

export class SystemRouterMutation {
    static create() {
        return mutationOptions({
            mutationKey: systemRouterKeys.create(),
            mutationFn: async (data: CreateSystemRouterDTO) =>
                await Http.post<void>("/api/admin/v1/system-router", data),
            retry: false,
        })
    }

    static patch(id: string, data: UpdateSystemRouterDTO) {
        return Http.patch<void>("/api/admin/v1/system-router", data, {
            query: { id: encodeURIComponent(id) },
        });
    }

    static update(id: string) {
        return mutationOptions({
            mutationKey: systemRouterKeys.update(id),
            mutationFn: async (data: UpdateSystemRouterDTO) =>
                await SystemRouterMutation.patch(id, data),
            retry: false,
        })
    }

    static delete() {
        return mutationOptions({
            mutationKey: systemRouterKeys.delete(),
            mutationFn: async (id: string) =>
                await Http.delete<void>("/api/admin/v1/system-router", {
                    query: { id: encodeURIComponent(id) },
                }),
            retry: false,
        })
    }
}