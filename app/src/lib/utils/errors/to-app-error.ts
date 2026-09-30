import "server-only";
import { AppError, InternalError } from "./app-error";
import type { SystemModule } from "./codes";
import { mapPrismaError } from "./map-prisma-error";
import { mapZodError } from "./map-zod-error";

export function toAppError(error: unknown, module: SystemModule): AppError {
    if (error instanceof AppError) {
        return error;
    }

    const mapped = mapPrismaError(error, module);
    if (mapped) {
        return mapped;
    }

    const zodError = mapZodError(error, module);
    if (zodError) return zodError;

    if (error instanceof Error) {
        return new InternalError(error.message, module, { cause: error });
    }

    return new InternalError("Unknown error", module, { cause: error });
}
