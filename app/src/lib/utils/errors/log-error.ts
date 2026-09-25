import type { AppError } from "./app-error";

type ErrorLogContext = {
    path?: string;
    requestId?: string;
};

export function logError(error: AppError, context: ErrorLogContext = {}): void {
    const payload = {
        code: error.code,
        statusCode: error.statusCode,
        message: error.message,
        ...context,
    };

    if (error.isOperational) {
        console.warn("[app-error]", payload);
        return;
    }

    console.error("[app-error]", payload, error.stack);
}
