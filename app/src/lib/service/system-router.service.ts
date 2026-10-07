import "server-only";

import type { CreateSystemRouterDTO } from "@/lib/schema/system-router.schema";
import { SystemRouterDao } from "@/lib/dao";
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "@/lib/utils";
import {
    buildTree,
    collectReachable,
    joinAbsolutePath,
    keepWithAncestors,
    pruneEmptyGroups,
    type TreeNode,
} from "@/lib/utils/build-tree";
import type {
    ListQuery,
    SystemRouterNavItemVO,
    SystemRouterOutput,
    SystemRouterTreeNodeVO,
} from "@/type/system-router.type";

const MODULE = "route" as const;

type RouterRow = Pick<
    SystemRouterOutput,
    | "id"
    | "name"
    | "icon"
    | "isActive"
    | "parentId"
    | "path"
    | "type"
    | "sort"
    | "permissionIds"
    | "scope"
    | "createdAt"
    | "updatedAt"
>;

export class SystemRouterService {
    static async create(dto: CreateSystemRouterDTO) {
        if (dto.type === "group" && "scope" in dto) {
            const hasRoot = await SystemRouterDao.findRoot(dto.scope);
            if (hasRoot) {
                throw new ConflictError("该范围已存在根节点", MODULE);
            }

            await SystemRouterDao.insert({
                name: dto.name,
                type: dto.type,
                path: dto.path,
                parentId: null,
                scope: dto.scope,
                isActive: dto.isActive,
                icon: dto.icon ?? null,
                permissionIds: dto.permissionIds,
                sort: dto.sort,
            });
            return;
        }

        const parent = await SystemRouterDao.findById(dto.parentId);
        if (!parent) {
            throw new NotFoundError("父节点不存在", MODULE);
        }
        if (parent.type !== "group") {
            throw new BadRequestError("父节点必须是分组", MODULE);
        }

        const sibling = await SystemRouterDao.findByParentAndPath(dto.parentId, dto.path);
        if (sibling) {
            throw new ConflictError("同级路径已存在", MODULE);
        }

        if (dto.type === "page") {
            const rows = await SystemRouterDao.listAll();
            const byId = new Map(rows.map((row) => [row.id, row]));
            const ancestors = this.ancestorChain(dto.parentId, byId);
            const nextPath = joinAbsolutePath([...ancestors.map((node) => node.path), dto.path]);
            const rootId = ancestors[0]?.id;

            for (const row of rows) {
                if (row.type !== "page" || !row.parentId) continue;
                const rowAncestors = this.ancestorChain(row.parentId, byId);
                if (rowAncestors[0]?.id !== rootId) continue;
                if (joinAbsolutePath([...rowAncestors.map((node) => node.path), row.path]) === nextPath) {
                    throw new ConflictError("绝对路径已存在", MODULE);
                }
            }
        }

        await SystemRouterDao.insert({
            name: dto.name,
            type: dto.type,
            path: dto.path,
            parentId: dto.parentId,
            scope: null,
            isActive: dto.isActive,
            icon: dto.icon ?? null,
            permissionIds: dto.permissionIds,
            sort: dto.sort,
        });
    }

    /** 编辑树：两棵根、相对 path、不剪枝；keyword 会保留祖先 */
    static async listTree(query?: ListQuery): Promise<SystemRouterTreeNodeVO[]> {
        let rows: RouterRow[] = await SystemRouterDao.listAll();

        if (query?.scope) {
            const root = rows.find((row) => row.parentId === null && row.scope === query.scope);
            rows = root ? collectReachable(rows, root.id) : [];
        }
        if (query?.keyword) {
            const keyword = query.keyword.trim().toLowerCase();
            if (keyword) {
                rows = keepWithAncestors(rows, (row) => row.name.toLowerCase().includes(keyword));
            }
        }

        return buildTree(rows.map(this.toTreeNode), this.compareNodes);
    }

    /**
     * 导航树：单 scope、滤 isActive；userPerms 未传则暂不按 permissionIds 过滤。
     * 剪枝空 group，path 为绝对路径，不输出根自身。
     */
    static async navTree(
        scope: "site" | "admin" = "admin",
        userPerms?: readonly string[],
    ): Promise<SystemRouterNavItemVO[]> {
        const rows = await SystemRouterDao.listAll();
        const root = rows.find((row) => row.parentId === null && row.scope === scope);
        if (!root || !this.isNavVisible(root, userPerms)) return [];

        const visible = rows.filter((row) => this.isNavVisible(row, userPerms));
        const subtree = collectReachable(visible, root.id);
        const [tree] = pruneEmptyGroups(buildTree(subtree.map(this.toTreeNode), this.compareNodes));
        if (!tree) return [];

        const prefix = tree.path ? [tree.path] : [];
        return tree.children.map((child) => this.toNavItem(child, prefix));
    }

    static pruneForNav(
        scope: "site" | "admin" = "admin",
        userPerms?: readonly string[],
    ) {
        return this.navTree(scope, userPerms);
    }

    private static isNavVisible(row: RouterRow, userPerms?: readonly string[]) {
        if (!row.isActive) return false;
        if (userPerms === undefined) return true;
        if (row.permissionIds.length === 0) return true;
        return row.permissionIds.some((id) => userPerms.includes(id));
    }

    private static toTreeNode(row: RouterRow): SystemRouterTreeNodeVO {
        return {
            id: row.id,
            name: row.name,
            icon: row.icon ?? null,
            isActive: row.isActive,
            parentId: row.parentId,
            path: row.path,
            type: row.type,
            sort: row.sort,
            permissionIds: [...row.permissionIds],
            scope: row.scope ?? null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            children: [],
        };
    }

    private static compareNodes(a: SystemRouterTreeNodeVO, b: SystemRouterTreeNodeVO) {
        if (a.sort !== b.sort) return a.sort - b.sort;
        if (a.createdAt < b.createdAt) return -1;
        if (a.createdAt > b.createdAt) return 1;
        return 0;
    }

    private static toNavItem(
        node: TreeNode<SystemRouterTreeNodeVO>,
        prefix: string[],
    ): SystemRouterNavItemVO {
        const nextPrefix = node.path ? [...prefix, node.path] : prefix;
        const path = node.path == null ? null : joinAbsolutePath([...prefix, node.path]);
        const children = node.children.map((child) => this.toNavItem(child, nextPrefix));
        return {
            id: node.id,
            name: node.name,
            icon: node.icon,
            path,
            ...(children.length > 0 ? { children } : {}),
        };
    }

    /** @description 检查路由树是否存在环 */
    private static ancestorChain(parentId: string, byId: Map<string, SystemRouterOutput>) {
        const chain: SystemRouterOutput[] = [];
        let currentId: string | null = parentId;
        const seen = new Set<string>();

        while (currentId) {
            if (seen.has(currentId)) {
                throw new BadRequestError("路由树存在环", MODULE);
            }
            seen.add(currentId);
            const node = byId.get(currentId);
            if (!node) {
                throw new NotFoundError("父节点不存在", MODULE);
            }
            chain.unshift(node);
            currentId = node.parentId;
        }

        return chain;
    }

}
