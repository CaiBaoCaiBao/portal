import {
    SqlConnectionError,
    SqlQueryError,
    isUniqueConstraintViolation,
} from "@prisma/orm-family-sql/errors";
import { isStructuredError } from "@prisma/orm-postgres/utils/structured-error";
import {
    AppError,
    BadRequestError,
    ConflictError,
    InternalError,
    NotFoundError,
} from "./app-error";

const NOT_FOUND_CODES = new Set([
    "RUNTIME.NO_ROWS",
    "ORM.MUTATION_ROW_MISSING",
    "ORM.RELATION_ROW_MISSING",
]);

const CONFLICT_CODES = new Set(["ORM.RELATION_LINK_DUPLICATE"]);

const CONNECTION_CODES = new Set([
    "DRIVER.CONNECTION_FAILED",
    "DRIVER.NOT_CONNECTED",
]);

const FK_VIOLATION_SQLSTATE = "23503";
const NOT_NULL_VIOLATION_SQLSTATE = "23502";

function structuredPayload(error: {
    code: string;
    meta?: Record<string, unknown>;
    details?: unknown;
}) {
    return {
        prismaCode: error.code,
        ...(error.meta ? { meta: error.meta } : {}),
        ...(error.details !== undefined ? { details: error.details } : {}),
    };
}

function mapStructuredPrismaError(error: unknown): AppError | null {
    if (!isStructuredError(error)) return null;

    const payload = structuredPayload({
        code: error.code,
        meta: error.meta,
        details: "details" in error ? error.details : undefined,
    });

    if (NOT_FOUND_CODES.has(error.code)) {
        return new NotFoundError("资源不存在", payload);
    }

    if (CONFLICT_CODES.has(error.code)) {
        return new ConflictError("资源已存在", payload);
    }

    if (CONNECTION_CODES.has(error.code)) {
        return new AppError("Service Unavailable", "数据库连接失败", 503, false, payload);
    }

    return null;
}

function mapSqlDriverError(error: unknown): AppError | null {
    if (isUniqueConstraintViolation(error) && SqlQueryError.is(error)) {
        return new ConflictError("资源已存在", {
            constraint: error.constraint,
            table: error.table,
            column: error.column,
            detail: error.detail,
            sqlState: error.sqlState,
        });
    }

    if (SqlQueryError.is(error)) {
        if (error.sqlState === FK_VIOLATION_SQLSTATE) {
            return new BadRequestError("关联数据不存在或无法变更", {
                constraint: error.constraint,
                table: error.table,
                column: error.column,
                detail: error.detail,
                sqlState: error.sqlState,
            });
        }

        if (error.sqlState === NOT_NULL_VIOLATION_SQLSTATE) {
            return new BadRequestError("必填字段缺失", {
                constraint: error.constraint,
                table: error.table,
                column: error.column,
                detail: error.detail,
                sqlState: error.sqlState,
            });
        }

        return null;
    }

    if (SqlConnectionError.is(error)) {
        return new InternalError("数据库连接失败", { transient: error.transient });
    }

    return null;
}

/** Prisma 8：用 isStructuredError / SqlQueryError，不要再用 P2002 / instanceof PrismaClientKnownRequestError。 */
export function mapPrismaError(error: unknown): AppError | null {
    return mapStructuredPrismaError(error) ?? mapSqlDriverError(error);
}
