import {
    QueryClient,
    environmentManager
} from "@tanstack/react-query";

function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

export function getClientQuery() {
    if (environmentManager.isServer()) {
        return createQueryClient();
    }

    browserQueryClient ??= createQueryClient();
    return browserQueryClient;
}
