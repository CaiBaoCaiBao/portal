import Link from "next/link";
import {
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { NavItemConfig } from "@/config/admin-nav.config";

type SidebarNavSubItemProps = {
    item: NavItemConfig;
    active: boolean;
};

export function SidebarNavSubItem({ item, active }: SidebarNavSubItemProps) {
    const Icon = item.icon;
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton
                render={<Link href={item.href} />}
                isActive={active}
            >
                {Icon ? <Icon /> : null}
                <span>{item.label}</span>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
}
