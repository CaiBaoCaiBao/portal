"use client";
import {
    Sidebar,
    SidebarHeader,
    SidebarTrigger,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    ChevronRight,
    FlaskConical
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminSidebar() {
    const pathname = usePathname();
    const isActive = (path: string) => pathname === path;
    return (
        <Sidebar
            variant="floating"
            collapsible="icon"
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarTrigger />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                isActive={isActive("/admin")}
                                render={<Link href="/admin" />}
                            >
                                <LayoutDashboard />
                                <span>Dashboard</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                    <Collapsible>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton>
                                    <FlaskConical />
                                    <span>功能性实验</span>
                                </SidebarMenuButton>
                                <CollapsibleTrigger render={<SidebarMenuAction />}>
                                    <ChevronRight />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem>
                                            <SidebarMenuSubButton
                                                isActive={isActive("/admin/lab/file-upload")}
                                                render={<Link href="/admin/lab/file-upload" />}
                                            >
                                                <span className="truncate">File Upload</span>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </Collapsible>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}