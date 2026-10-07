import { SystemRouterService } from "@/lib/service";
import { queryOptions } from "@tanstack/react-query";

export const systemRouterKeys = {
    all: ['system-router'] as const,
    navTree: () => [...systemRouterKeys.all, 'nav-tree'] as const,
}

export class SystemRouterQuery {
    static treeForNav() {
        return queryOptions({
            queryKey: systemRouterKeys.navTree(),
            queryFn: async () => await SystemRouterService.navTree("admin")
        })
    }
}