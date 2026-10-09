import { queryOptions } from "@tanstack/react-query";
import { SystemRouterService } from "@/lib/service";
import { systemRouterKeys } from "@/constants/system-router.constant";

export class SystemRouterQuery {
    static treeForNav() {
        return queryOptions({
            queryKey: systemRouterKeys.navTree(),
            queryFn: async () => await SystemRouterService.navTree("admin"),
        });
    }

    static listTree() {
        return queryOptions({
            queryKey: systemRouterKeys.listTree(),
            queryFn: async () => await SystemRouterService.listTree(),
        });
    }
}
