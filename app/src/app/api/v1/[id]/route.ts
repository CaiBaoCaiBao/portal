import {
    testIdParamsSchema,
    testPatchBodySchema,
    testReplaceBodySchema,
} from "@/lib/schema/test.schema";
import {
    deleteTestItem,
    getTestItem,
    patchTestItem,
    replaceTestItem,
} from "@/lib/service/test-item";
import {
    apiHandler,
    parseBody,
    parseParams,
} from "@/lib/utils/server";

type IdContext = { params: Promise<{ id: string }> };

/** GET /api/v1/:id */
export const GET = apiHandler(async (_req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, testIdParamsSchema);
    return getTestItem(id);
});

/** PUT /api/v1/:id  全量替换 { name, age } */
export const PUT = apiHandler(async (req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, testIdParamsSchema);
    const body = await parseBody(req, testReplaceBodySchema);
    return replaceTestItem(id, body);
});

/** PATCH /api/v1/:id  部分更新 */
export const PATCH = apiHandler(async (req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, testIdParamsSchema);
    const body = await parseBody(req, testPatchBodySchema);
    return patchTestItem(id, body);
});

/** DELETE /api/v1/:id */
export const DELETE = apiHandler(async (_req, ctx: IdContext) => {
    const { id } = await parseParams(ctx.params, testIdParamsSchema);
    return deleteTestItem(id);
});
