import { SystemRouter } from "@/components/admin/system-router";
import {
    noop,
    dehydrate,
    HydrationBoundary,
} from "@tanstack/react-query";
import { getClientQuery } from "@/lib/utils/get-client-query";
import { SystemRouterQuery } from "@/query/system-router.query";

export default async function Page() {
    const queryClient = getClientQuery();
    const items =
        (await queryClient
            .query(SystemRouterQuery.listTree())
            .catch(noop)) ?? [];

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <SystemRouter items={items} />
        </HydrationBoundary>
    )
}