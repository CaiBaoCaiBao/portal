import { CategoryItemVO, CategoryListVO } from "@/types/category.type";

export type ParentCategoryOption = {
    id: string;
    name: string;
    depth: number;
};

export function collectSubtreeIds(node: CategoryItemVO): string[] {
    const ids = [node.id];
    for (const child of node.children ?? []) {
        ids.push(...collectSubtreeIds(child));
    }
    return ids;
}

export function parentCategoryOptions(
    nodes: CategoryListVO,
    excludeIds: ReadonlySet<string>,
): ParentCategoryOption[] {
    const options: ParentCategoryOption[] = [];

    const walk = (items: readonly CategoryItemVO[] | null | undefined, depth: number) => {
        if (!items) return;
        for (const node of items) {
            if (excludeIds.has(node.id)) continue;
            const children = node.children ?? [];
            if (node.isSystem) {
                walk(children, depth);
                continue;
            }
            options.push({ id: node.id, name: node.name, depth });
            walk(children, depth + 1);
        }
    };

    walk(Array.isArray(nodes) ? nodes : [], 0);
    return options;
}

export function findCategoryName(
    nodes: readonly CategoryItemVO[] | null | undefined,
    id: string,
): string | null {
    if (!nodes) return null;
    for (const node of nodes) {
        if (node.id === id) return node.name;
        const found = findCategoryName(node.children, id);
        if (found) return found;
    }
    return null;
}
