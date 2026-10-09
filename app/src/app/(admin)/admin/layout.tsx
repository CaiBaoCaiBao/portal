import {
    SidebarProvider,
    SidebarInset,
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function Layout({ children }: LayoutProps<"/admin">) {
    return (
        <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex flex-col">
                <AdminHeader />
                <div className="flex flex-1">
                    <AdminSidebar />
                    <SidebarInset>
                        <div className="flex-1 p-4">{children}</div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>

    );
}
