import { ERROR_STATUS } from "@/lib";
import { Module } from "@/types/globals.type";

export class ActionError extends Error {
    readonly error: ClientError;

    constructor(error: ClientError) {
        super(error.message);
        this.name = "ActionError";
        this.error = error;
    }
}

/** @description 返回给浏览器的错误。只保留可序列化字段，不包含服务端的 cause。 */
export type ClientError = {
    message: string;
    code: keyof typeof ERROR_STATUS;
    status: (typeof ERROR_STATUS)[keyof typeof ERROR_STATUS];
    module: Module;
    except: boolean;
    details?: unknown;
    errorId?: string;
    timestamp: string;
}

export type SuccessResult<T> = {
    ok: true,
    data?: T,
    message?: string,
}

export type ErrorResult = {
    ok: false,
    error: ClientError,
    message?: string,
}

export type Result<T> = SuccessResult<T> | ErrorResult;