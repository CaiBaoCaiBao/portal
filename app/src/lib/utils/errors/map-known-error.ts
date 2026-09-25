import {
    AppError,
    InternalError,
    isAppError
} from "./app-error";
import { mapPrismaError } from "./map-prisma-error";
import { mapZodError } from "./map-zod-error";

export function mapKnownError(error: unknown): AppError {
    if (isAppError(error)) return error;

    const zodError = mapZodError(error);
    if (zodError) return zodError;

    const prismaError = mapPrismaError(error);
    if (prismaError) return prismaError;

    const message =
        error instanceof Error ? error.message : "服务器内部错误";
    return new InternalError(message);
}
