import "server-only";
import { serverEnvConfig } from "@/config/env/server-env.config";
import type { ApiResult } from "@/types/api-result.type";
import {
    fail,
    isApiResult,
    ok
} from "./result";
import { logError } from "./log-error";
import { mapKnownError } from "./map-known-error";
import { isNextControlFlowError } from "./next-control-flow";

/**
 * 包装 Server Action：始终返回 ApiResult，避免未捕获异常冒泡到 error.tsx。
 * `redirect()` / `notFound()` 会原样抛出。
 */
export function actionHandler<TArgs extends unknown[], TData>(
    action: (...args: TArgs) => TData | Promise<TData>,
) {
    return async (...args: TArgs): Promise<ApiResult<TData>> => {
        try {
            const result = await action(...args);
            if (isApiResult(result)) {
                return result as ApiResult<TData>;
            }
            return ok(result);
        } catch (error) {
            if (isNextControlFlowError(error)) throw error;

            const appError = mapKnownError(error);
            logError(appError);
            return fail(appError, {
                isDev: serverEnvConfig.app.env === "development",
            });
        }
    };
}
