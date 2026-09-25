export const ERROR_CODES = [
    "Bad Request",
    "Unauthorized",
    "Forbidden",
    "Not Found",
    "Conflict",
    "Validation Error",
    "Precondition Failed",
    "Internal Server Error",
    "Bad Gateway",
    "Service Unavailable",
    "Gateway Timeout",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const ERROR_STATUS: Record<ErrorCode, number> = {
    "Bad Request": 400,
    Unauthorized: 401,
    Forbidden: 403,
    "Not Found": 404,
    Conflict: 409,
    "Precondition Failed": 412,
    "Validation Error": 422,
    "Internal Server Error": 500,
    "Bad Gateway": 502,
    "Service Unavailable": 503,
    "Gateway Timeout": 504,
};

export function statusFromErrorCode(code: ErrorCode): number {
    return ERROR_STATUS[code] ?? 500;
}
