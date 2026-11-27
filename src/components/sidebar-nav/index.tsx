"use client";

import { usePathname } from "next/navigation";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
} from "@/components/ui/sidebar";
import { AppNavConfig, isNavGroup } from "@/config/admin-nav.config";
import { SidebarNavGroup } from "./sidebar-nav-group";
import { SidebarNavItem } from "./sidebar-nav-item";
import { isNavGroupActive, isNavItemActive } from "./is-nav-active";

interface Props {
    appNavConfig: AppNavConfig[];
}

export function SidebarNav({ appNavConfig }: Props) {
    const pathname = usePathname();

    return (
        <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu>
                    {appNavConfig.map((item) => {
                        if (isNavGroup(item)) {
                            return (
                                <SidebarNavGroup
                                    key={item.id}
                                    group={item}
                                    pathname={pathname}
                                    active={isNavGroupActive(pathname, item)}
                                />
                            );
                        }
                        return (
                            <SidebarNavItem
                                key={item.id}
                                item={item}
                                active={isNavItemActive(pathname, item)}
                            />
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
