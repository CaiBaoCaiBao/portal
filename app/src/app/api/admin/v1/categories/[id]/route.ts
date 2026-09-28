import {
    categoryIdParamsSchema,
    updateCategorySchema,
} from "@/lib/schema/category.schema";
import { CategoryService } from "@/lib/service/category.service";
import { apiHandler, parseBody, parseParams } from "@/lib/utils/server";
import { toCategoryDetailVO, toDeleteCategoryVO } from "@/types/category.type";

type IdContext = { params: Promise<{ id: string }> };

/** GET /api/v1/categories/:id */
export const GET = apiHandler(async (_req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, categoryIdParamsSchema);
    const detail = await CategoryService.getById(id);
    return toCategoryDetailVO(detail);
});

/** PATCH /api/v1/categories/:id */
export const PATCH = apiHandler(async (req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, categoryIdParamsSchema);
    const body = await parseBody(req, updateCategorySchema);
    const detail = await CategoryService.update(id, body);
    return toCategoryDetailVO(detail);
});

/** DELETE /api/v1/categories/:id */
export const DELETE = apiHandler(async (_req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, categoryIdParamsSchema);
    const result = await CategoryService.delete(id);
    return toDeleteCategoryVO(result);
});
