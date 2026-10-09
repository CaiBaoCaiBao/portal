import "server-only";

import type {
    CreateSystemRouterDTO,
    UpdateSystemRouterDTO,
} from "@/lib/schema/system-router.schema";
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

    static async update(id: string, dto: UpdateSystemRouterDTO) {
        const existing = await SystemRouterDao.findById(id);
        if (!existing) {
            throw new NotFoundError("路由不存在", MODULE);
        }

        const nextParentId =
            dto.parentId !== undefined ? dto.parentId : existing.parentId;
        const nextPath = dto.path !== undefined ? dto.path : existing.path;
        const parentChanged = dto.parentId !== undefined && dto.parentId !== existing.parentId;
        const pathChanged = dto.path !== undefined && dto.path !== existing.path;
        const isRoot = nextParentId === null;

        if (isRoot) {
            if (existing.type !== "group") {
                throw new BadRequestError("仅分组可为根节点", MODULE);
            }
            if (existing.parentId !== null) {
                throw new BadRequestError("非根不可变成根", MODULE);
            }
        }

        if (dto.parentId !== undefined) {
            if (dto.parentId === id) {
                throw new BadRequestError("不能迁到自身", MODULE);
            }
            if (existing.parentId === null && dto.parentId !== null) {
                throw new BadRequestError("根节点不能移动", MODULE);
            }
            if (dto.parentId !== null) {
                const parent = await SystemRouterDao.findById(dto.parentId);
                if (!parent) {
                    throw new NotFoundError("父节点不存在", MODULE);
                }
                if (parent.type !== "group") {
                    throw new BadRequestError("父节点必须是分组", MODULE);
                }
                const rows = await SystemRouterDao.listAll();
                const descendants = collectReachable(rows, id);
                if (descendants.some((row) => row.id === dto.parentId)) {
                    throw new BadRequestError("不能迁到子孙节点", MODULE);
                }
            }
        }

        this.assertPathForNode({
            type: existing.type,
            isRoot,
            scope: existing.scope,
            path: nextPath,
        });

        if (parentChanged || pathChanged) {
            const sibling = await SystemRouterDao.findByParentAndPath(
                nextParentId,
                nextPath,
            );
            if (sibling && sibling.id !== id) {
                throw new ConflictError("同级路径已存在", MODULE);
            }

            const rows = await SystemRouterDao.listAll();
            const nextRows = rows.map((row) =>
                row.id === id
                    ? { ...row, parentId: nextParentId, path: nextPath }
                    : row,
            );
            this.assertUniqueAbsolutePaths(nextRows);
        }

        await SystemRouterDao.updateById(id, {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
            ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
            ...(dto.permissionIds !== undefined
                ? { permissionIds: dto.permissionIds }
                : {}),
            ...(dto.sort !== undefined ? { sort: dto.sort } : {}),
            ...(dto.path !== undefined ? { path: dto.path } : {}),
            ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
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

    static async delete(id: string) {
        const existing = await SystemRouterDao.findById(id);
        if (!existing) {
            throw new NotFoundError("路由不存在", MODULE);
        }
        const child = await SystemRouterDao.findFirstChild(id);
        if (child) {
            throw new BadRequestError("仍有子节点，无法删除", MODULE);
        }
        await SystemRouterDao.deleteById(id);
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

    private static assertPathForNode(node: {
        type: RouterRow["type"];
        isRoot: boolean;
        scope: RouterRow["scope"];
        path: string | null;
    }) {
        if (node.isRoot) {
            if (node.scope === "site" && node.path !== null) {
                throw new BadRequestError("站点根路径必须为空", MODULE);
            }
            if (node.scope === "admin" && node.path !== "admin") {
                throw new BadRequestError("后台根路径必须为 admin", MODULE);
            }
            return;
        }
        if (node.type === "page") {
            if (node.path == null) {
                throw new BadRequestError("页面路径不能为空", MODULE);
            }
            return;
        }
        if (node.path === "") {
            throw new BadRequestError("空路径仅页面可用", MODULE);
        }
    }

    private static assertUniqueAbsolutePaths(rows: RouterRow[]) {
        const byId = new Map(rows.map((row) => [row.id, row]));
        const seen = new Map<string, string>();

        for (const row of rows) {
            if (row.path == null) continue;
            const parentId = row.parentId;
            if (!parentId && row.type !== "group") continue;
            const ancestors = parentId ? this.ancestorChain(parentId, byId) : [];
            const absolute = joinAbsolutePath([
                ...ancestors.map((node) => node.path),
                row.path,
            ]);
            const rootId = ancestors[0]?.id ?? row.id;
            const key = `${rootId}:${absolute}`;
            const other = seen.get(key);
            if (other && other !== row.id) {
                throw new ConflictError("绝对路径已存在", MODULE);
            }
            seen.set(key, row.id);
        }
    }

}
