import Link from "next/link";
import {
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItemConfig } from "@/config/admin-nav.config";

type SidebarNavItemProps = {
    item: NavItemConfig;
    active: boolean;
};

export function SidebarNavItem({ item, active }: SidebarNavItemProps) {
    const Icon = item.icon;
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                render={<Link href={item.href} />}
                isActive={active}
                tooltip={item.label}
            >
                {Icon ? <Icon /> : null}
                <span>{item.label}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
