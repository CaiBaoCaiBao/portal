import { ErrorCode } from "./codes"

export type ClientError = {
    code: ErrorCode;
    message: string;
    details?: unknown;
    errorId?: string;
};

type SuccessResult<T> = {
    ok: true;
    data: T;
    timestamp: string;
};

export type ErrorResult = {
    ok: false;
    error: ClientError;
};

export type ApiResult<T> = SuccessResult<T> | ErrorResult;