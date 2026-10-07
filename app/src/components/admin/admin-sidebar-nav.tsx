"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent
 } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import {
    DynamicIcon,
    iconNames,
    type IconName
} from "lucide-react/dynamic";
import type { SystemRouterNavItemVO } from "@/type/system-router.type";
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type Props = {
    items: SystemRouterNavItemVO[];
};

function toIconName(value: string): IconName | null {
    const kebab = value
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
    return (iconNames as IconName[]).includes(kebab as IconName)
        ? (kebab as IconName)
        : null;
}

function NavIcon({ name }: { name: string | null }) {
    if (!name) return null;
    const iconName = toIconName(name);
    if (!iconName) return null;
    return <DynamicIcon name={iconName} />;
}

function isExactActive(pathname: string, path: string | null) {
    if (!path) return false;
    return pathname === path || pathname === `${path}/`;
}

function isBranchActive(pathname: string, item: SystemRouterNavItemVO): boolean {
    if (isExactActive(pathname, item.path)) return true;
    return (item.children ?? []).some((child) => isBranchActive(pathname, child));
}

function isGroupItem(item: SystemRouterNavItemVO) {
    return !item.path && (item.children?.length ?? 0) > 0;
}

function MenuLeaf({
    item,
    pathname,
    nested,
}: {
    item: SystemRouterNavItemVO;
    pathname: string;
    nested?: boolean;
}) {
    const href = item.path ?? "#";
    const active = isExactActive(pathname, item.path);
    const label = (
        <>
            <NavIcon name={item.icon} />
            <span>{item.name}</span>
        </>
    );

    if (nested) {
        return (
            <SidebarMenuSubItem>
                <SidebarMenuSubButton
                    isActive={active}
                    render={<Link href={href} />}
                >
                    {label}
                </SidebarMenuSubButton>
            </SidebarMenuSubItem>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={active}
                tooltip={item.name}
                render={<Link href={href} />}
            >
                {label}
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

function MenuBranch({
    item,
    pathname,
    nested,
}: {
    item: SystemRouterNavItemVO;
    pathname: string;
    nested?: boolean;
}) {
    const children = item.children ?? [];
    const open = isBranchActive(pathname, item);
    const trigger = (
        <>
            <NavIcon name={item.icon} />
            <span>{item.name}</span>
            <ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
        </>
    );

    return (
        <Collapsible defaultOpen={open} className="group/collapsible">
            {nested ? (
                <SidebarMenuSubItem>
                    <CollapsibleTrigger
                        render={<SidebarMenuSubButton />}
                    >
                        {trigger}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {children.map((child) => (
                                <MenuNode
                                    key={child.id}
                                    item={child}
                                    pathname={pathname}
                                    nested
                                />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuSubItem>
            ) : (
                <SidebarMenuItem>
                    <CollapsibleTrigger
                        render={
                            <SidebarMenuButton tooltip={item.name} />
                        }
                    >
                        {trigger}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {children.map((child) => (
                                <MenuNode
                                    key={child.id}
                                    item={child}
                                    pathname={pathname}
                                    nested
                                />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            )}
        </Collapsible>
    );
}

function MenuNode({
    item,
    pathname,
    nested,
}: {
    item: SystemRouterNavItemVO;
    pathname: string;
    nested?: boolean;
}) {
    if ((item.children?.length ?? 0) > 0) {
        return <MenuBranch item={item} pathname={pathname} nested={nested} />;
    }
    return <MenuLeaf item={item} pathname={pathname} nested={nested} />;
}

function MenuList({
    items,
    pathname,
}: {
    items: SystemRouterNavItemVO[];
    pathname: string;
}) {
    return (
        <SidebarMenu>
            {items.map((item) => (
                <MenuNode key={item.id} item={item} pathname={pathname} />
            ))}
        </SidebarMenu>
    );
}

export function AdminSidebarNav({ items }: Props) {
    const pathname = usePathname();
    const sections: { key: string; label?: string; items: SystemRouterNavItemVO[] }[] = [];
    let pending: SystemRouterNavItemVO[] = [];

    const flushPending = () => {
        if (pending.length === 0) return;
        sections.push({
            key: pending.map((item) => item.id).join(":"),
            items: pending,
        });
        pending = [];
    };

    for (const item of items) {
        if (isGroupItem(item)) {
            flushPending();
            sections.push({
                key: item.id,
                label: item.name,
                items: item.children ?? [],
            });
            continue;
        }
        pending.push(item);
    }
    flushPending();

    if (sections.length === 0) {
        return (
            <SidebarGroup>
                <SidebarGroupContent>
                    <p className="px-2 py-1.5 text-xs text-sidebar-foreground/70">
                        暂无菜单
                    </p>
                </SidebarGroupContent>
            </SidebarGroup>
        );
    }

    return (
        <>
            {sections.map((section) => (
                <SidebarGroup key={section.key}>
                    {section.label ? (
                        <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                    ) : null}
                    <SidebarGroupContent>
                        <MenuList items={section.items} pathname={pathname} />
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
