import {
    SidebarProvider,
    SidebarInset
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
export default function Layout({ children }: LayoutProps<"/admin">) {
    return (
        <div className="[--header-height:calc(--spacing(14))]">
            <SidebarProvider className="flex flex-col">
                <AdminHeader />
                <div className="flex flex-1">
                    <AdminSidebar />
                    <SidebarInset className="py-2 px-4">
                        {children}
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    )
}