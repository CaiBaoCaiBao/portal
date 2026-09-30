export const ERROR_CODES = [
    "BAD_REQUEST",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "INTERNAL",
] as const;

export const SYSTEM_MODULES = [
    "route",
    "taxonomy",
    "content",
    "syslog",
    "media",
    "auth",
] as const;

export type ErrorCode = typeof ERROR_CODES[number];
export type SystemModule = typeof SYSTEM_MODULES[number];