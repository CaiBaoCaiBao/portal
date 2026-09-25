import type { ErrorCode } from "@/lib/utils/errors/constant";
export type ApiSuccess<T> = {
    success: true;
    data: T;
    timestamp: string;
};

export type ApiError = {
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        details?: unknown;
    };
    timestamp: string;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;