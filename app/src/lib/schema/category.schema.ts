import { z } from "zod";

const nameSchema = z.string().trim().min(1).max(64);
const slugSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const descriptionCreateSchema = z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value == null || value === "" ? null : value));

const descriptionUpdateSchema = z
    .union([z.string().trim().max(500), z.null()])
    .optional()
    .transform((value) => {
        if (value === undefined) return undefined;
        if (value === null || value === "") return null;
        return value;
    });

export const createCategorySchema = z.object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionCreateSchema,
    parentId: z.uuid().optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateCategorySchema = z
    .object({
        name: nameSchema.optional(),
        slug: slugSchema.optional(),
        description: descriptionUpdateSchema,
        parentId: z.uuid().nullable().optional(),
        isActive: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: "至少更新一个字段",
    });

export const categoryIdParamsSchema = z.object({
    id: z.uuid(),
});

/** 管理端保存表单：始终按完整字段校验，不复用 create/update 的 union。 */
export const saveCategorySchema = z.object({
    name: nameSchema,
    slug: slugSchema,
    description: descriptionCreateSchema,
    parentId: z.uuid().optional(),
    isActive: z.boolean(),
});

export type CreateCategoryDTO = z.output<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.output<typeof updateCategorySchema>;
export type CreateCategoryBody = z.input<typeof createCategorySchema>;
export type UpdateCategoryBody = z.input<typeof updateCategorySchema>;
export type SaveCategoryFormValue = z.input<typeof saveCategorySchema>;
export type CategoryIdParams = z.output<typeof categoryIdParamsSchema>;
