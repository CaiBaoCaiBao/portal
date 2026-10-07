import { FieldInputTypes, FieldOutputTypes } from "@/prisma/contract";

export type SystemRouterInput = FieldInputTypes["public"]["SystemRouter"];
export type SystemRouterOutput = FieldOutputTypes["public"]["SystemRouter"];

export type ListQuery = {
    keyword?: string;
    scope?: "site" | "admin";
    isActive?: boolean;
};

export type RowQuery = {
    id: string;
    scope?: "site" | "admin";
};

/** 后台编辑树：相对 path，保留根，不剪枝 */
export type SystemRouterTreeNodeVO = {
    id: string;
    name: string;
    scope: "site" | "admin" | null;
    path: string | null;
    type: "group" | "page";
    icon: string | null;
    parentId: string | null;
    isActive: boolean;
    sort: number;
    permissionIds: string[];
    createdAt: string;
    updatedAt: string;
    children: SystemRouterTreeNodeVO[];
};

/** 导航：绝对 path；无 path 的 group 为 null；不含根 */
export type SystemRouterNavItemVO = {
    id: string;
    name: string;
    icon: string | null;
    path: string | null;
    children?: SystemRouterNavItemVO[];
};
