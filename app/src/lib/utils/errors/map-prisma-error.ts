import "server-only";

import {
    SqlConnectionError,
    SqlQueryError,
    isUniqueConstraintViolation,
} from "@prisma/orm-family-sql/errors";
import { isStructuredError } from "@prisma/orm-postgres/utils";
import {
    BadRequestError,
    ConflictError,
    InternalError,
    type AppError,
} from "./app-error";
import type { SystemModule } from "./codes";

const FOREIGN_KEY_VIOLATION = "23503";

export function mapPrismaError(error: unknown, module: SystemModule): AppError | null {
    if (SqlQueryError.is(error)) {
        if (isUniqueConstraintViolation(error)) {
            return new ConflictError("资源已存在", module, {
                cause: error,
                details: {
                    constraint: error.constraint,
                    table: error.table,
                    column: error.column,
                },
            });
        }

        if (error.sqlState === FOREIGN_KEY_VIOLATION) {
            return new BadRequestError("存在关联约束，无法完成操作", module, {
                cause: error,
                details: {
                    constraint: error.constraint,
                    table: error.table,
                    column: error.column,
                },
            });
        }

        return new InternalError("数据库查询失败", module, { cause: error });
    }

    if (SqlConnectionError.is(error)) {
        return new InternalError("数据库连接失败", module, { cause: error });
    }

    if (isStructuredError(error)) {
        if (error.code.startsWith("ORM.ARGUMENT_") || error.code === "ORM.COLUMN_UNKNOWN") {
            return new BadRequestError(error.message, module, {
                cause: error,
                details: error.meta,
            });
        }

        return new InternalError("ORM 运行时错误", module, {
            cause: error,
            details: { code: error.code, meta: error.meta },
        });
    }

    return null;
}
