// ===============
// 构建树工具
// ===============

export type TreeItem = {
    id: string;
    parentId: string | null;
};

export type TreeNode<T> = T & { children: TreeNode<T>[] };

export function buildTree<T extends TreeItem>(
    items: T[],
    compare?: (a: TreeNode<T>, b: TreeNode<T>) => number,
): TreeNode<T>[] {
    const nodes = new Map<string, TreeNode<T>>();
    for (const item of items) {
        nodes.set(item.id, { ...item, children: [] });
    }

    const roots: TreeNode<T>[] = [];
    for (const node of nodes.values()) {
        const parent = node.parentId ? nodes.get(node.parentId) : undefined;
        if (parent) {
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    const sortDeep = (list: TreeNode<T>[]) => {
        if (compare) list.sort(compare);
        for (const node of list) sortDeep(node.children);
    };
    sortDeep(roots);
    return roots;
}

/** 保留命中节点及其祖先，避免 keyword 过滤后树断掉 */
export function keepWithAncestors<T extends TreeItem>(
    items: T[],
    predicate: (item: T) => boolean,
): T[] {
    const byId = new Map(items.map((item) => [item.id, item]));
    const keep = new Set<string>();

    for (const item of items) {
        if (!predicate(item)) continue;
        let current: T | undefined = item;
        while (current && !keep.has(current.id)) {
            keep.add(current.id);
            current = current.parentId ? byId.get(current.parentId) : undefined;
        }
    }

    return items.filter((item) => keep.has(item.id));
}

/** 从 rootId 沿 parentId 向下收集仍在集合内的节点 */
export function collectReachable<T extends TreeItem>(items: T[], rootId: string): T[] {
    const byParent = new Map<string | null, T[]>();
    for (const item of items) {
        const siblings = byParent.get(item.parentId) ?? [];
        siblings.push(item);
        byParent.set(item.parentId, siblings);
    }

    const kept: T[] = [];
    const queue = items.filter((item) => item.id === rootId);
    const seen = new Set<string>();

    while (queue.length > 0) {
        const node = queue.shift();
        if (!node || seen.has(node.id)) continue;
        seen.add(node.id);
        kept.push(node);
        const children = byParent.get(node.id) ?? [];
        queue.push(...children);
    }

    return kept;
}

/**
 * 导航剪枝：空子 group 去掉；page 按自身是否还在树里；根 group 始终保留。
 */
export function pruneEmptyGroups<T extends TreeItem & { type: string }>(
    nodes: TreeNode<T>[],
): TreeNode<T>[] {
    return nodes.flatMap((node) => {
        const children = pruneEmptyGroups(node.children);
        if (node.type === "group" && children.length === 0 && node.parentId !== null) {
            return [];
        }
        return [{ ...node, children }];
    });
}

/** 非空 path 段拼接为绝对路径；空段不追加。无段时为 `/` */
export function joinAbsolutePath(segments: Array<string | null | undefined>) {
    const parts = segments.filter((segment): segment is string => segment != null && segment !== "");
    return `/${parts.join("/")}`;
}
