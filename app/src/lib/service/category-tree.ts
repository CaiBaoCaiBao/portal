import type { CategoryDAO, CategoryItemBO } from "@/types/category.type";

export function buildCategoryTree(
    rows: CategoryDAO[],
    postCounts: ReadonlyMap<string, number>,
    tagCounts: ReadonlyMap<string, number>,
): CategoryItemBO[] {
    const nodes = new Map<string, CategoryItemBO>();
    for (const row of rows) {
        nodes.set(row.id, {
            id: row.id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            parentId: row.parentId,
            isActive: row.isActive,
            isSystem: row.isSystem,
            postCount: postCounts.get(row.id) ?? 0,
            tagCount: tagCounts.get(row.id) ?? 0,
            children: [],
        });
    }

    const roots: CategoryItemBO[] = [];
    for (const row of rows) {
        const node = nodes.get(row.id);
        if (!node) continue;
        const parent = row.parentId ? nodes.get(row.parentId) : undefined;
        if (parent) parent.children.push(node);
        else roots.push(node);
    }
    return roots;
}

export function pruneInactiveCategories(nodes: CategoryItemBO[]): CategoryItemBO[] {
    return nodes
        .filter((node) => node.isActive)
        .map((node) => ({
            ...node,
            children: pruneInactiveCategories(node.children),
        }));
}

export function parentCreatesCycle(
    parentById: ReadonlyMap<string, string | null>,
    selfId: string,
    parentId: string,
): boolean {
    let cursor: string | null = parentId;
    const seen = new Set<string>();
    while (cursor) {
        if (cursor === selfId || seen.has(cursor)) return true;
        seen.add(cursor);
        cursor = parentById.get(cursor) ?? null;
    }
    return false;
}

export function systemFieldsChanged(
    current: Pick<CategoryDAO, "name" | "slug" | "parentId" | "isActive">,
    patch: {
        name?: string;
        slug?: string;
        parentId?: string | null;
        isActive?: boolean;
    },
): boolean {
    if (patch.name !== undefined && patch.name !== current.name) return true;
    if (patch.slug !== undefined && patch.slug !== current.slug) return true;
    if (patch.parentId !== undefined && patch.parentId !== current.parentId) return true;
    if (patch.isActive !== undefined && patch.isActive !== current.isActive) return true;
    return false;
}
