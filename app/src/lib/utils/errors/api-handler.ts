import "server-only";
import { serverEnvConfig } from "@/config/env/server-env.config";
import {
    fail,
    isApiResult,
    ok,
    statusFromResult
} from "./result";
import { logError } from "./log-error";
import { mapKnownError } from "./map-known-error";
import { isNextControlFlowError } from "./next-control-flow";

type ApiRouteHandler<TContext> = (
    req: Request,
    context: TContext,
) => unknown | Promise<unknown>;

/**
 * 包装 Route Handler：业务层抛 AppError / Zod / Prisma，此处统一成 ApiResult。
 */
export function apiHandler<TContext = unknown>(
    handler: ApiRouteHandler<TContext>,
) {
    return async (req: Request, context: TContext) => {
        try {
            const result = await handler(req, context);
            if (result instanceof Response) return result;
            if (isApiResult(result)) {
                return Response.json(result, { status: statusFromResult(result) });
            }
            return Response.json(ok(result));
        } catch (error) {
            if (isNextControlFlowError(error)) throw error;

            const appError = mapKnownError(error);
            logError(appError, { path: req.url });

            const isDev = serverEnvConfig.app.env === "development";
            return Response.json(fail(appError, { isDev }), {
                status: appError.statusCode,
            });
        }
    };
}
