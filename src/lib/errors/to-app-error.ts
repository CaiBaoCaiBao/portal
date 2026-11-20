import "server-only";
import { AppError, InternalError } from "./app-error";
import { mapPrismaError } from "./map-prisma-error";
import { mapZodError } from "./map-zod-error";
import { Module } from "@/types/globals.type";

export function toAppError(error: unknown, module: Module): AppError {
    if (error instanceof AppError) return error;

    const prismaError = mapPrismaError(error, module);
    if (prismaError) return prismaError;

    const zodError = mapZodError(error, module);
    if (zodError) return zodError;

    return new InternalError(module, "Internal Error", { cause: error });
}