import "server-only";

import { db } from "@/prisma/db";
import { mapPrismaError } from "@/lib/utils/server";
import { AppError } from "@/lib/utils";
import type { ListQuery, SystemRouterInput, SystemRouterOutput } from "@/type/system-router.type";

const MODULE = "route" as const;

type CreateRow = Pick<
    SystemRouterInput,
    | "name"
    | "type"
    | "path"
    | "parentId"
    | "scope"
    | "isActive"
    | "icon"
    | "permissionIds"
    | "sort"
>;

type UpdateRow = Partial<
    Pick<
        SystemRouterInput,
        "name" | "path" | "parentId" | "isActive" | "icon" | "permissionIds" | "sort"
    >
>;

async function run<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw mapPrismaError(error, MODULE) ?? error;
    }
}

export class SystemRouterDao {
    static findRoot(scope: "site" | "admin") {
        return run(() =>
            db.orm.public.SystemRouter.where({
                scope,
                parentId: null,
            }).first(),
        );
    }

    static findById(id: string) {
        return run(() =>
            db.orm.public.SystemRouter.where({
                id,
            }).first(),
        );
    }

    static findByParentAndPath(parentId: string | null, path: string | null) {
        return run(() =>
            db.orm.public.SystemRouter.where({
                parentId,
                path,
            }).first(),
        );
    }

    static findFirstChild(parentId: string) {
        return run(() =>
            db.orm.public.SystemRouter.where({
                parentId,
            }).first(),
        );
    }

    static listAll(query?: ListQuery): Promise<SystemRouterOutput[]> {
        return run(async () => {
            let base = db.orm.public.SystemRouter;
            if (query?.scope != null) {
                base = base.where({ scope: query.scope });
            }
            if (query?.isActive != null) {
                base = base.where({ isActive: query.isActive });
            }
            if (query?.keyword) {
                base = base.where((r) =>
                    r.name.ilike(`%${query.keyword}%`),
                );
            }
            return await base
                .orderBy([(r) => r.sort.asc(), (r) => r.createdAt.asc()])
                .all();
        });
    }

    static insert(data: CreateRow) {
        return run(() => db.orm.public.SystemRouter.create(data));
    }

    static updateById(id: string, data: UpdateRow) {
        return run(() =>
            db.orm.public.SystemRouter.where({ id }).update(data),
        );
    }

    static deleteById(id: string) {
        return run(() =>
            db.orm.public.SystemRouter.where({ id }).delete(),
        );
    }
}
