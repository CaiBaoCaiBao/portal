import { CategoryPage } from "@/components/admin/category";
import {
    dehydrate,
    HydrationBoundary,
    noop,
} from '@tanstack/react-query';
import { getQueryClient } from "@/lib/utils";
import { categoryQueryKey } from "@/query/category.query";
import { CategoryService } from "@/lib/service";
export default async function Page() {
    const queryClient = getQueryClient();

    const listTree = await queryClient.query({
        queryKey: categoryQueryKey.list(),
        queryFn: () => CategoryService.listTree(),
    }).catch(noop);

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CategoryPage listTree={listTree ?? []} />
        </HydrationBoundary>
    )
}