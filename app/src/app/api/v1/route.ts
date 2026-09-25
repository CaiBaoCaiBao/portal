import {
    testCreateBodySchema,
    testListQuerySchema,
} from "@/lib/schema/test.schema";
import {
    createTestItem,
    listTestItems,
} from "@/lib/service/test-item";
import {
    apiHandler,
    parseBody,
    parseSearchParams,
} from "@/lib/utils/server";

/** GET /api/v1?name=&minAge=&page=&pageSize= */
export const GET = apiHandler(async (req) => {
    const query = parseSearchParams(req, testListQuerySchema);
    return listTestItems(query);
});

/** POST /api/v1  body: { name, age } */
export const POST = apiHandler(async (req) => {
    const body = await parseBody(req, testCreateBodySchema);
    return createTestItem(body);
});
