import { AppHeaderFrame } from "@/components/app-header";
import {
    SidebarProvider,
    SidebarInset
} from "@/components/ui/sidebar";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar"

export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider className="h-svh overflow-hidden">
            <AdminSidebar />
            <SidebarInset className="min-h-0 overflow-hidden">
                <AppHeaderFrame>
                    <AdminHeader />
                    {children}
                </AppHeaderFrame>
            </SidebarInset>
        </SidebarProvider>
    )
}
