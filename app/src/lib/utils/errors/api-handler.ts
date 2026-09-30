import "server-only";

import type { AppError } from "./app-error";
import type { ErrorResult } from "./api-result";
import type { SystemModule } from "./codes";
import { toAppError } from "./to-app-error";

const INTERNAL_MESSAGE = "服务器内部错误";

function toErrorResult(error: AppError): ErrorResult {
    if (error.code === "INTERNAL") {
        return {
            ok: false,
            error: {
                code: error.code,
                message: INTERNAL_MESSAGE,
                errorId: error.errorId,
            },
        };
    }

    return {
        ok: false,
        error: {
            code: error.code,
            message: error.message,
            ...(error.details === undefined ? {} : { details: error.details }),
        },
    };
}

function logAppError(req: Request, error: AppError) {
    console.error("[api]", {
        method: req.method,
        url: req.url,
        name: error.name,
        code: error.code,
        module: error.module,
        message: error.message,
        errorId: error.errorId,
        details: error.details,
        cause: error.cause,
        stack: error.stack,
    });
}

export function apiHandler(
    module: SystemModule,
    handler: (req: Request) => Promise<Response>,
) {
    return async (req: Request) => {
        try {
            return await handler(req);
        } catch (error) {
            const appError = toAppError(error, module);
            logAppError(req, appError);
            return Response.json(toErrorResult(appError), { status: appError.statusCode });
        }
    };
}
