import { isMatch } from "@/lib";
import type {
    NavGroupConfig,
    NavItemConfig
} from "@/config/admin-nav.config";

export function isNavItemActive(pathname: string, item: Pick<NavItemConfig, "href" | "match">): boolean {
    return isMatch(pathname, item.href, item.match);
}

export function isNavGroupActive(pathname: string, group: NavGroupConfig): boolean {
    const selfActive = group.href ? isMatch(pathname, group.href, group.match) : false;
    return selfActive || group.children.some((child) => isNavItemActive(pathname, child));
}
