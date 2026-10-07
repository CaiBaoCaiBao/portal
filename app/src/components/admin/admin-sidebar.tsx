import {
    noop,
    dehydrate,
    HydrationBoundary,
} from "@tanstack/react-query";
import { getClientQuery } from "@/lib/utils/get-client-query";
import { SystemRouterQuery } from "@/query/system-router.query";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";

export async function AdminSidebar() {
    const queryClient = getClientQuery();
    const items =
        (await queryClient
            .query(SystemRouterQuery.treeForNav())
            .catch(noop)) ?? [];

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Sidebar
                variant="floating"
                collapsible="offcanvas"
                className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            >
                <SidebarContent>
                    <AdminSidebarNav items={items} />
                </SidebarContent>
                <SidebarRail />
            </Sidebar>
        </HydrationBoundary>
    );
}
