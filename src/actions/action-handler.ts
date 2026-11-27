import { z } from "zod";
import { ClientError, Result } from "./result";
import { serverEnvConfig } from "@/config/server-env.config";
import { Module } from "@/types/globals.type";
import { toAppError } from "@/lib/server";
import { AppError } from "@/lib";

function toClientError(error: AppError): ClientError {
    return {
        message: error.message,
        code: error.code,
        status: error.status,
        module: error.module,
        except: error.except,
        details: error.details,
        errorId: error.errorId,
        timestamp: error.timestamp,
    };
}

type HandlerConfig<Input, Output, Form> = {
    module: Module;
    schema?: z.ZodType<Input, Form>;
    handler: (input: Input) => Promise<Result<Output>>;
}

export function actionHandler<Input, Output, Form = Input>(
    config: HandlerConfig<Input, Output, Form>
): (input: Form) => Promise<Result<Output>> {
    const { module, schema, handler } = config;
    return async (input: Form) => {
        try {
            const parsed = schema ? schema.parse(input) : input as unknown as Input;
            return await handler(parsed);
        } catch (error) {
            const appError = toAppError(error, module);
            const clientError = toClientError(appError);
            if (!serverEnvConfig.node.isPro) {
                console.error(clientError);
            }
            return {
                ok: false,
                error: clientError,
                message: appError.message,
            };
        }
    }
}
