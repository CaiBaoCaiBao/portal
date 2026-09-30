import "server-only";

import type { z } from "zod";
import type { AppError } from "./app-error";
import type { ErrorResult } from "./api-result";
import type { SystemModule } from "./codes";
import { toAppError } from "./to-app-error";
import { parseBody, parseQuery } from "../parse";

const INTERNAL_MESSAGE = "服务器内部错误";

type ZodSchema = z.ZodType;

type InferSchema<T> = T extends ZodSchema ? z.infer<T> : undefined;

export type ApiHandlerContext<TQuery = undefined, TBody = undefined> = {
    req: Request;
    query: TQuery;
    body: TBody;
};

export type ApiHandlerConfig<
    TQuery extends ZodSchema | undefined = undefined,
    TBody extends ZodSchema | undefined = undefined,
> = {
    module: SystemModule;
    query?: TQuery;
    body?: TBody;
    handler: (
        ctx: ApiHandlerContext<InferSchema<TQuery>, InferSchema<TBody>>,
    ) => Promise<Response>;
};

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

export function apiHandler<
    TQuery extends ZodSchema | undefined = undefined,
    TBody extends ZodSchema | undefined = undefined,
>(config: ApiHandlerConfig<TQuery, TBody>) {
    const { module, query: querySchema, body: bodySchema, handler } = config;

    return async (req: Request) => {
        try {
            const query = querySchema
                ? parseQuery(req, querySchema)
                : undefined;
            const body = bodySchema
                ? await parseBody(req, bodySchema, module)
                : undefined;

            return await handler({
                req,
                query: query as InferSchema<TQuery>,
                body: body as InferSchema<TBody>,
            });
        } catch (error) {
            const appError = toAppError(error, module);
            logAppError(req, appError);
            return Response.json(toErrorResult(appError), { status: appError.statusCode });
        }
    };
}
