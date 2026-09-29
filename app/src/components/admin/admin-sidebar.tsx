"use client";
import { useEffect } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarMenuAction,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    FlaskConical,
    Tag,
    ChevronRight,
} from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { usePathname } from "next/navigation";

export function AdminSidebar() {
    const pathname = usePathname();
    const { setOpenMobile } = useSidebar();
    const isActive = (href: string) => pathname === href;

    useEffect(() => {
        setOpenMobile(false);
    }, [pathname, setOpenMobile]);

    return (
        <Sidebar
            className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
            variant="floating"
            collapsible="offcanvas"
        >
            <SidebarContent>
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link href="/admin" />}
                                isActive={isActive("/admin")}
                            >
                                <LayoutDashboard />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link href="/admin/category" />}
                                isActive={isActive("/admin/category")}
                            >
                                <Package />
                                Category
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link href="/admin/tag" />}
                                isActive={isActive("/admin/tag")}
                            >
                                <Tag />
                                Tag
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        {/* 功能性实验 */}
                        <Collapsible className="group/collapsible">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                >
                                    <FlaskConical />
                                    Lab
                                </SidebarMenuButton>
                                <CollapsibleTrigger
                                    render={
                                        <SidebarMenuAction className="transition-transform group-data-open/collapsible:rotate-90">
                                            <ChevronRight />
                                            <span className="sr-only">Toggle</span>
                                        </SidebarMenuAction>
                                    }
                                />
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        <SidebarMenuSubItem >
                                            <SidebarMenuSubButton>
                                                Upload File （未实现）
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}