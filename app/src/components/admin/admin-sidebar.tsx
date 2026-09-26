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
    SidebarMenuSubItem
} from "@/components/ui/sidebar";
import Link from "next/link";
import {
    LayoutDashboard,
    Package,
    FlaskConical,
    ChevronRight,
} from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function AdminSidebar() {
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
                            >
                                <LayoutDashboard />
                                Dashboard
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                render={<Link href="/admin/category" />}
                            >
                                <Package />
                                Category
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>

                    {/* 功能性实验 */}
                    <SidebarMenu>
                        <Collapsible className="group/collapsible">
                            <SidebarMenuItem>
                                <SidebarMenuButton>
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