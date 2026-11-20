import { ERROR_STATUS } from "./constant";
import { Module } from "@/types/globals.type";

type ErrorCode = keyof typeof ERROR_STATUS;
type ErrorStatus = typeof ERROR_STATUS[ErrorCode];

type AppErrorOptions = {
    details?: unknown;
    cause?: unknown;
}

export class AppError extends Error {
    public readonly status: ErrorStatus;
    public readonly code: ErrorCode;
    public readonly module: Module;
    public readonly except: boolean;
    public readonly details?: unknown;
    public readonly errorId?: string;
    public readonly timestamp: string;

    constructor(
        module: Module,
        code: ErrorCode,
        message: string,
        options?: AppErrorOptions
    ) {
        super(message, { cause: options?.cause });
        this.status = ERROR_STATUS[code];
        this.code = code;
        this.module = module;
        this.except = this.status < 500;
        this.details = options?.details;
        this.errorId = this.except ? undefined : globalThis.crypto.randomUUID();
        this.timestamp = new Date().toISOString();
    }
}

/** 
 * @description 400 Bad Request - The request was invalid.
 * @description 400 错误请求 - 请求的参数不符合要求。
 *  */
export class BadRequestError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "BAD_REQUEST", message, options)
    }
}

/** 
 * @description 404 Not Found - The requested resource was not found.
 * @description 404 未找到 - 请求的资源不存在。
 *  */
export class NotFoundError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "NOT_FOUND", message, options)
    }
}

/** 
 * @description 409 Conflict - The request could not be completed due to a conflict with the current state of the resource.
 * @description 409 冲突 - 请求的资源与当前状态冲突。
 *  */
export class ConflictError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "CONFLICT", message, options)
    }
}

/** 
 * @description 405 Method Not Allowed - The request method is not allowed for the resource.
 * @description 405 方法不允许 - 请求的方法不允许用于资源。
 *  */
export class MethodNotAllowedError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "METHOD_NOT_ALLOWED", message, options)
    }
}

/** 
 * @description 401 Unauthorized - The request requires user authentication.
 * @description 401 未授权 - 请求需要用户认证。
 *  */
export class UnauthorizedError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "UNAUTHORIZED", message, options)
    }
}

/** 
 * @description 403 Forbidden - The request was forbidden by the server.
 * @description 403 禁止 - 请求被服务器拒绝。
 *  */
export class ForbiddenError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "FORBIDDEN", message, options)
    }
}

/** 
 * @description 503 Service Unavailable - The server is currently unavailable.
 * @description 503 服务不可用 - 服务器当前不可用。
 *  */
export class ServiceUnavailableError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "SERVICE_UNAVAILABLE", message, options)
    }
}

/** 
 * @description 504 Gateway Timeout - The gateway server timed out.
 * @description 504 网关超时 - 网关服务器超时。
 *  */
export class GatewayTimeoutError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "GATEWAY_TIMEOUT", message, options)
    }
}

/** 
 * @description 502 Bad Gateway - The gateway server received an invalid response from the upstream server.
 * @description 502 错误网关 - 网关服务器收到上游服务器的无效响应。
 *  */
export class BadGatewayError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "BAD_GATEWAY", message, options)
    }
}

/** 
 * @description 500 Internal Server Error - The server encountered an unexpected condition that prevented it from fulfilling the request.
 * @description 500 内部服务器错误 - 服务器遇到意外条件，无法完成请求。
 *  */
export class InternalError extends AppError {
    constructor(module: Module, message: string, options?: AppErrorOptions) {
        super(module, "INTERNAL_SERVER_ERROR", message, options)
    }
}