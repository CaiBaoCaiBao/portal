import { createCategorySchema } from "@/lib/schema/category.schema";
import { CategoryService } from "@/lib/service/category.service";
import { apiHandler, parseBody } from "@/lib/utils/server";
import { toCategoryDetailVO, toCategoryListVO } from "@/types/category.type";

/** GET /api/v1/categories */
export const GET = apiHandler(async () => {
    const list = await CategoryService.listTree();
    return toCategoryListVO(list);
});

/** POST /api/v1/categories */
export const POST = apiHandler(async (req) => {
    const body = await parseBody(req, createCategorySchema);
    const detail = await CategoryService.create(body);
    return toCategoryDetailVO(detail);
});
