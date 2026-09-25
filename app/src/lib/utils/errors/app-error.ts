import { ERROR_STATUS, type ErrorCode } from "./constant";

export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        code: ErrorCode,
        message: string,
        statusCode = ERROR_STATUS[code],
        isOperational = true,
        details?: unknown,
    ) {
        super(message);
        this.name = new.target.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
}

export class BadRequestError extends AppError {
    constructor(message = "请求参数错误", details?: unknown) {
        super("Bad Request", message, 400, true, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "未登录", details?: unknown) {
        super("Unauthorized", message, 401, true, details);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "无权限", details?: unknown) {
        super("Forbidden", message, 403, true, details);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "资源不存在", details?: unknown) {
        super("Not Found", message, 404, true, details);
    }
}

export class ConflictError extends AppError {
    constructor(message = "资源冲突", details?: unknown) {
        super("Conflict", message, 409, true, details);
    }
}

export class ValidationError extends AppError {
    constructor(message = "校验失败", details?: unknown) {
        super("Validation Error", message, 422, true, details);
    }
}

export class InternalError extends AppError {
    constructor(message = "服务器内部错误", details?: unknown) {
        super("Internal Server Error", message, 500, false, details);
    }
}
