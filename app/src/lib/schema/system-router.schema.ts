import { z } from "zod";

const nameSchema = z.string().trim().min(1, "名称不能为空").max(64, "名称过长");

/** 非空路径段；`""` 仅 page 可用，不要并进本 schema */
const pathSegmentSchema = z
    .string()
    .trim()
    .min(1, "路径不能为空")
    .max(64, "路径过长")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "路径不合法");

const iconSchema = z
    .string()
    .trim()
    .min(1, "图标不合法")
    .max(64, "图标过长")
    .nullable()
    .optional();

const permissionIdsSchema = z.array(z.string().trim().min(1));

const createBaseFields = {
    name: nameSchema,
    isActive: z.boolean().default(true),
    icon: iconSchema,
    permissionIds: permissionIdsSchema.default([]),
    sort: z.number().int().default(0),
};

/** 根 group：无父；scope 必填；site path=null，admin path="admin" */
const createRootGroupSchema = z.discriminatedUnion("scope", [
    z
        .object({
            type: z.literal("group"),
            parentId: z.null().optional().default(null),
            scope: z.literal("site"),
            path: z.null().optional().default(null),
            ...createBaseFields,
        })
        .strict(),
    z
        .object({
            type: z.literal("group"),
            parentId: z.null().optional().default(null),
            scope: z.literal("admin"),
            path: z.literal("admin"),
            ...createBaseFields,
        })
        .strict(),
]);

/** 子 group：必有父；禁止 scope；path 为段或 null（菜单分组） */
const createChildGroupSchema = z
    .object({
        type: z.literal("group"),
        parentId: z.uuid("父节点不合法"),
        path: pathSegmentSchema.nullable().optional().default(null),
        ...createBaseFields,
    })
    .strict();

/** page：必有父；禁止 scope；path 为段或 ""（索引页） */
const createPageSchema = z
    .object({
        type: z.literal("page"),
        parentId: z.uuid("父节点不合法"),
        path: z.union([pathSegmentSchema, z.literal("")]),
        ...createBaseFields,
    })
    .strict();

export const createSystemRouterSchema = z.union([
    createRootGroupSchema,
    createChildGroupSchema,
    createPageSchema,
]);

/**
 * PATCH：禁止改 type / scope（.strict() 多传即失败）。
 * path / parentId 是否符合当前节点（根/子 group/page），由 service 按 §3.1 校验。
 */
export const updateSystemRouterSchema = z
    .object({
        name: nameSchema.optional(),
        isActive: z.boolean().optional(),
        icon: iconSchema,
        permissionIds: permissionIdsSchema.optional(),
        sort: z.number().int().optional(),
        /** 子 group：段或 null；page：段或 ""；根 site：null；根 admin："admin" */
        path: z.union([pathSegmentSchema, z.literal(""), z.null()]).optional(),
        /** 传入表示移动；null 仅根 group 可由 service 放行 */
        parentId: z.uuid("父节点不合法").nullable().optional(),
    })
    .strict()
    .refine(
        (value) => Object.values(value).some((item) => item !== undefined),
        { message: "至少更新一个字段" },
    );

export const querySystemRouterSchema = z
    .object({
        id: z.uuid("id 不合法"),
    })
    .strict();

export type CreateSystemRouterForm = z.input<typeof createSystemRouterSchema>;
export type CreateSystemRouterDTO = z.output<typeof createSystemRouterSchema>;
export type UpdateSystemRouterForm = z.input<typeof updateSystemRouterSchema>;
export type UpdateSystemRouterDTO = z.output<typeof updateSystemRouterSchema>;
export type QuerySystemRouterDTO = z.output<typeof querySystemRouterSchema>;