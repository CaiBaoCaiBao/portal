export {
    BadRequestError,
    BadGatewayError,
    ConflictError,
    ForbiddenError,
    GatewayTimeoutError,
    InternalError,
    MethodNotAllowedError,
    NotFoundError,
    ServiceUnavailableError,
    UnauthorizedError,
    AppError,
} from "./app-error";
export * from "./constant";

export { mapZodError } from "./map-zod-error";

export { QiniuError } from "./qiniu-error";

export function errorMessage(error: unknown, fallback: string) {
    return error instanceof Error && error.message ? error.message : fallback;
}