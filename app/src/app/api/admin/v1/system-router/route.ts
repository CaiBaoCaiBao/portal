import { apiHandler } from "@/lib/utils/server";
import { SystemRouterService } from "@/lib/service";
import {
    createSystemRouterSchema,
    updateSystemRouterSchema,
} from "@/lib/schema/system-router.schema";
import { z } from "zod";

const querySchema = z.object({
    id: z.uuid(),
})

export const POST = apiHandler({
    module: "route",
    body: createSystemRouterSchema,
    handler: async ({
        body
    }) => {
        await SystemRouterService.create(body);
    }
});

export const GET = apiHandler({
    module: "route",
    handler: async () => {
        const vo = await SystemRouterService.listTree();
        return vo;
    }
});

export const PATCH = apiHandler({
    module: "route",
    body: updateSystemRouterSchema,
    query: querySchema,
    handler: async ({
        body,
        query
    }) => {
        
        await SystemRouterService.update(query.id, body);
    }
});

export const DELETE = apiHandler({
    module: "route",
    query: querySchema,
    handler: async ({ query }) => {
        await SystemRouterService.delete(query.id);
    },
});