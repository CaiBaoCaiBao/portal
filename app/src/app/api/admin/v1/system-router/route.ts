import { apiHandler } from "@/lib/utils/server";
import { SystemRouterService } from "@/lib/service";
import { createSystemRouterSchema } from "@/lib/schema/system-router.schema";

export const POST = apiHandler({
    module: "route",
    body: createSystemRouterSchema,
    handler: async ({
        body
    }) => {
        await SystemRouterService.create(body);
    }
})

export const GET = apiHandler({
    module: "route",
    handler: async () => {
        const vo = await SystemRouterService.listTree();
        return vo;
    }
})