import type {
    ApiError,
    ApiResult
} from "@/types/api-result.type";
import { isAppError } from "./app-error";

export function isApiErrorResult(value: unknown): value is ApiError {
    return (
        typeof value === "object" &&
        value !== null &&
        "success" in value &&
        (value as { success: unknown }).success === false &&
        "error" in value
    );
}

/** 给 Toast / Query 用：operational 用接口文案，其余用固定提示。 */
export function getErrorMessage(error: unknown): string {
    if (isApiErrorResult(error)) return error.error.message;
    if (isAppError(error)) {
        return error.isOperational ? error.message : "服务器内部错误";
    }
    if (error instanceof Error && error.message) return error.message;
    return "请求失败，请稍后重试";
}

export function unwrapApiResult<T>(result: ApiResult<T>): T {
    if (result.success) return result.data;
    throw result;
}
