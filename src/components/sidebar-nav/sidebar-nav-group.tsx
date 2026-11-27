"use client";

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
} from "@/components/ui/sidebar";
import type { NavGroupConfig } from "@/config/admin-nav.config";
import { SidebarNavSubItem } from "./sidebar-nav-sub-item";
import { isNavItemActive } from "./is-nav-active";

type SidebarNavGroupProps = {
    group: NavGroupConfig;
    pathname: string;
    active: boolean;
};

export function SidebarNavGroup({ group, pathname, active }: SidebarNavGroupProps) {
    const Icon = group.icon;
    const [open, setOpen] = useState(active);

    useEffect(() => {
        if (active) {
            setOpen(true);
        }
    }, [active]);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger
                    render={<SidebarMenuButton tooltip={group.label} isActive={active} />}
                >
                    {Icon ? <Icon /> : null}
                    <span>{group.label}</span>
                    <ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {group.children.map((child) => (
                            <SidebarNavSubItem
                                key={child.id}
                                item={child}
                                active={isNavItemActive(pathname, child)}
                            />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}
