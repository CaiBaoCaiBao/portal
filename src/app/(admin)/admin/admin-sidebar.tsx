"use client";
import {
    Sidebar,
    SidebarContent
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/sidebar-nav";
import { adminNavCondif } from "@/config/admin-nav.config";
import { AdminSidebarHeader } from "./admin-sidebar-header";

export function AdminSidebar() {
    return (
        <Sidebar variant="floating" collapsible="icon">
            <AdminSidebarHeader />
            <SidebarContent>
                <SidebarNav appNavConfig={adminNavCondif} />
            </SidebarContent>
        </Sidebar>
    )
}