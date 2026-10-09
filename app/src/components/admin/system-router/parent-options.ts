import { SystemRouterTreeNodeVO } from "@/type/system-router.type";

export type GroupOption = {
    id: string;
    label: string;
};

export function collectDescendantIds(node: SystemRouterTreeNodeVO) {
    const ids = new Set<string>([node.id]);
    const walk = (current: SystemRouterTreeNodeVO) => {
        for (const child of current.children) {
            ids.add(child.id);
            walk(child);
        }
    };
    walk(node);
    return ids;
}

export function collectGroupOptions(
    nodes: SystemRouterTreeNodeVO[],
    excludeIds?: ReadonlySet<string>,
): GroupOption[] {
    const result: GroupOption[] = [];
    const walk = (list: SystemRouterTreeNodeVO[], depth: number) => {
        for (const node of list) {
            if (excludeIds?.has(node.id)) continue;
            if (node.type === "group") {
                result.push({
                    id: node.id,
                    label: `${"\u00A0\u00A0".repeat(depth)}${formatGroupLabel(node)}`,
                });
            }
            if (node.children.length > 0) {
                walk(node.children, node.type === "group" ? depth + 1 : depth);
            }
        }
    };
    walk(nodes, 0);
    return result;
}

function formatGroupLabel(node: SystemRouterTreeNodeVO) {
    if (node.scope === "admin") return `${node.name}（后台）`;
    if (node.scope === "site") return `${node.name}（站点）`;
    if (node.path == null) return node.name;
    if (node.path === "") return `${node.name}（索引）`;
    return `${node.name} / ${node.path}`;
}
