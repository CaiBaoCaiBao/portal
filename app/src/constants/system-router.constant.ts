export const systemRouterKeys = {
    all: ["system-router"] as const,
    navTree: () => [...systemRouterKeys.all, "nav-tree"] as const,
    listTree: () => [...systemRouterKeys.all, "list-tree"] as const,
    create: () => [...systemRouterKeys.all, "create"] as const,
    update: (id: string) => [...systemRouterKeys.all, "update", id] as const,
    delete: () => [...systemRouterKeys.all, "delete"] as const,
};