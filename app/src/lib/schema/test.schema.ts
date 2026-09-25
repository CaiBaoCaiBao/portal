import { z } from "zod";

/** 动态路由 `/api/v1/[id]` */
export const testIdParamsSchema = z.object({
    id: z.string().min(1).max(64),
});

/** GET `/api/v1` 的 query（query 全是字符串，数字需 coerce） */
export const testListQuerySchema = z.object({
    name: z.string().min(1).optional(),
    minAge: z.coerce.number().int().min(0).optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const testCreateBodySchema = z.object({
    name: z.string().trim().min(1).max(50),
    age: z.number().int().min(18).max(150),
});

export const testReplaceBodySchema = testCreateBodySchema;

export const testPatchBodySchema = testCreateBodySchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    { message: "至少更新一个字段" },
);

export type TestIdParams = z.infer<typeof testIdParamsSchema>;
export type TestListQuery = z.infer<typeof testListQuerySchema>;
export type TestCreateBody = z.infer<typeof testCreateBodySchema>;
export type TestReplaceBody = z.infer<typeof testReplaceBodySchema>;
export type TestPatchBody = z.infer<typeof testPatchBodySchema>;
