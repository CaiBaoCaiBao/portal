import {
    SidebarProvider,
    SidebarInset
} from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
export function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
};