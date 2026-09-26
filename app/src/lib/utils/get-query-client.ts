import {
    QueryClient,
    defaultShouldDehydrateQuery,
    environmentManager,
} from "@tanstack/react-query";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // With SSR, avoid refetching immediately on the client
                staleTime: 60 * 1000,
                gcTime: 1000 * 60 * 60 * 24,
            },
            dehydrate: {
                shouldDehydrateQuery: (query) =>
                    defaultShouldDehydrateQuery(query) ||
                    query.state.status === "pending",
                shouldRedactErrors: () => false,
            },
        },
    });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
    if (environmentManager.isServer()) {
        return makeQueryClient();
    }
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}
