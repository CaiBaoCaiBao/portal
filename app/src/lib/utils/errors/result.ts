import type {
    ApiError,
    ApiResult,
    ApiSuccess
} from "@/types/api-result.type";
import { AppError } from "./app-error";
import {
    statusFromErrorCode,
    type ErrorCode
} from "./constant";

export function ok<T>(data: T): ApiSuccess<T> {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}

export function fail(
    error: AppError,
    options?: { isDev?: boolean },
): ApiError {
    const exposeInternal = Boolean(options?.isDev);
    const shouldExpose = error.isOperational || exposeInternal;

    return {
        success: false,
        error: {
            code: error.code,
            message: shouldExpose ? error.message : "服务器内部错误",
            ...(shouldExpose && error.details !== undefined
                ? { details: error.details }
                : {}),
        },
        timestamp: new Date().toISOString(),
    };
}

export function isApiResult(value: unknown): value is ApiResult<unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        "success" in value &&
        typeof (value as { success: unknown }).success === "boolean" &&
        "timestamp" in value
    );
}

export function statusFromResult(result: ApiResult<unknown>): number {
    if (result.success) return 200;
    return statusFromErrorCode(result.error.code as ErrorCode);
}
