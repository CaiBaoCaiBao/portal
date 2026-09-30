import type { ErrorCode, SystemModule } from "./codes";

const STATUS_CODES = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL: 500,
} as const satisfies Record<ErrorCode, number>;

export type AppErrorOptions = {
    details?: unknown;
    cause?: unknown;
};

export class AppError extends Error {
    public readonly name: string = "AppError";
    public readonly code: ErrorCode;
    public readonly statusCode: (typeof STATUS_CODES)[ErrorCode];
    public readonly module: SystemModule;
    public readonly errorId?: string;
    public readonly details: unknown;

    constructor(
        code: ErrorCode,
        message: string,
        module: SystemModule,
        options?: AppErrorOptions
    ) {
        super(message, { cause: options?.cause });
        this.code = code;
        this.statusCode = STATUS_CODES[code];
        this.module = module;
        this.errorId = code === "INTERNAL" ? globalThis.crypto.randomUUID() : void 0;
        this.details = options?.details;
    }
}

export class BadRequestError extends AppError {
    public override readonly name = "BadRequestError";

    constructor(message: string, module: SystemModule, options?: AppErrorOptions) {
        super("BAD_REQUEST", message, module, options);
    }
}

export class UnauthorizedError extends AppError {
    public override readonly name = "UnauthorizedError";

    constructor(message: string, module: SystemModule, options?: AppErrorOptions) {
        super("UNAUTHORIZED", message, module, options);
    }
}

export class ForbiddenError extends AppError {
    public override readonly name = "ForbiddenError";

    constructor(message: string, module: SystemModule, options?: AppErrorOptions) {
        super("FORBIDDEN", message, module, options);
    }
}

export class NotFoundError extends AppError {
    public override readonly name = "NotFoundError";

    constructor(message: string, module: SystemModule, options?: AppErrorOptions) {
        super("NOT_FOUND", message, module, options);
    }
}

export class ConflictError extends AppError {
    public override readonly name = "ConflictError";

    constructor(message: string, module: SystemModule, options?: AppErrorOptions) {
        super("CONFLICT", message, module, options);
    }
}

export class InternalError extends AppError {
    public override readonly name = "InternalError";

    constructor(message: string, module: SystemModule, options?: AppErrorOptions) {
        super("INTERNAL", message, module, options);
    }
}
