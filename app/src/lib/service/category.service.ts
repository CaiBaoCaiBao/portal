import "server-only";

import { revalidatePath } from "next/cache";
import { CategoryDao, type CategoryTx } from "@/lib/dao/category.dao";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "@/lib/schema/category.schema";
import {
    buildCategoryTree,
    exceedsMaxCategoryLevel,
    parentCreatesCycle,
    pruneInactiveCategories,
    systemFieldsChanged,
} from "@/lib/utils/category-tree";
import { db } from "@/prisma/db";
import type {
    CategoryDAO,
    CategoryDetailBO,
    CategoryListBO,
    DeleteCategoryBO,
    UpdateCategoryPO,
} from "@/types/category.type";
import {
    BadRequestError,
    ConflictError,
    InternalError,
    NotFoundError,
} from "@/lib/utils/errors/app-error";

function toDetail(
    row: CategoryDAO,
    postCount: number,
    tagCount: number,
): CategoryDetailBO {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        parentId: row.parentId,
        isActive: row.isActive,
        isSystem: row.isSystem,
        postCount,
        tagCount,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

function toUpdatePO(dto: UpdateCategoryDTO): UpdateCategoryPO {
    const po: UpdateCategoryPO = {};
    if (dto.name !== undefined) po.name = dto.name;
    if (dto.slug !== undefined) po.slug = dto.slug;
    if (dto.description !== undefined) po.description = dto.description;
    if (dto.parentId !== undefined) po.parentId = dto.parentId;
    if (dto.isActive !== undefined) po.isActive = dto.isActive;
    return po;
}

function revalidateCategorySlugs(slugs: Array<string | null | undefined>) {
    const unique = new Set(slugs.filter((slug): slug is string => Boolean(slug)));
    for (const slug of unique) {
        revalidatePath(`/categories/${slug}`);
    }
}

export class CategoryService {
    static async seedSystemCategory(): Promise<CategoryDetailBO> {
        const existing = await CategoryDao.findSystem(db);
        if (existing.length > 1) throw new InternalError("系统分类不存在");
        const row = existing[0] ?? await CategoryDao.insertSystem(db);
        return this.detailOf(row);
    }

    static async listTree(): Promise<CategoryListBO> {
        const [rows, postCounts, tagCounts] = await Promise.all([
            CategoryDao.listAll(db),
            CategoryDao.countPostsByCategory(db),
            CategoryDao.countTagsByCategory(db),
        ]);
        return buildCategoryTree(rows, postCounts, tagCounts);
    }

    static async listActiveTree(): Promise<CategoryListBO> {
        return pruneInactiveCategories(await this.listTree());
    }

    static async getById(id: string): Promise<CategoryDetailBO> {
        const row = await CategoryDao.findById(db, id);
        if (!row) throw new NotFoundError("分类不存在");
        return this.detailOf(row);
    }

    static async getBySlug(slug: string): Promise<CategoryDetailBO> {
        const row = await CategoryDao.findBySlug(db, slug);
        if (!row || !row.isActive) throw new NotFoundError("分类不存在");
        return this.detailOf(row);
    }

    static async create(dto: CreateCategoryDTO): Promise<CategoryDetailBO> {
        const row = await db.transaction(async (tx) => {
            await this.assertUnique(tx, { name: dto.name, slug: dto.slug });
            if (dto.parentId) await this.assertParent(tx, dto.parentId);
            return CategoryDao.insert(tx, {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                parentId: dto.parentId ?? null,
                isActive: dto.isActive,
            });
        });
        revalidateCategorySlugs([row.slug]);
        return this.detailOf(row);
    }

    static async update(id: string, dto: UpdateCategoryDTO): Promise<CategoryDetailBO> {
        const { row, previousSlug } = await db.transaction(async (tx) => {
            const current = await CategoryDao.lockById(tx, id);
            if (!current || current.deletedAt) throw new NotFoundError("分类不存在");
            if (current.isSystem && systemFieldsChanged(current, dto)) {
                throw new ConflictError("系统分类不可修改名称、slug、层级或启用状态");
            }
            await this.assertUnique(tx, {
                name: dto.name,
                slug: dto.slug,
                exceptId: id,
            });
            if (dto.parentId !== undefined && dto.parentId !== current.parentId && dto.parentId !== null) {
                await this.assertParent(tx, dto.parentId, id);
            }
            const po = toUpdatePO(dto);
            if (Object.keys(po).length > 0) {
                await CategoryDao.update(tx, id, po);
            }
            const next = await CategoryDao.findById(tx, id);
            if (!next) throw new NotFoundError("分类不存在");
            return { row: next, previousSlug: current.slug };
        });
        revalidateCategorySlugs([previousSlug, row.slug]);
        return this.detailOf(row);
    }

    static async delete(id: string): Promise<DeleteCategoryBO> {
        const result = await db.transaction(async (tx) => {
            const current = await CategoryDao.lockById(tx, id);
            if (!current || current.deletedAt) throw new NotFoundError("分类不存在");
            if (current.isSystem) throw new ConflictError("系统分类不可删除");
            const childCount = await CategoryDao.countChildren(tx, id);
            if (childCount > 0) throw new ConflictError("请先删除子分类");
            const systems = await CategoryDao.lockSystem(tx);
            if (systems.length !== 1) throw new InternalError("系统分类不存在");
            const system = systems[0];
            if (!system) throw new InternalError("系统分类不存在");
            const migratedPostCount = await CategoryDao.migratePosts(tx, id, system.id);
            await CategoryDao.delete(tx, id);
            return { id: current.id, slug: current.slug, migratedPostCount };
        });
        revalidateCategorySlugs([result.slug]);
        return { id: result.id, migratedPostCount: result.migratedPostCount };
    }

    private static async detailOf(row: CategoryDAO): Promise<CategoryDetailBO> {
        const [postCounts, tagCounts] = await Promise.all([
            CategoryDao.countPostsByCategory(db),
            CategoryDao.countTagsByCategory(db),
        ]);
        return toDetail(row, postCounts.get(row.id) ?? 0, tagCounts.get(row.id) ?? 0);
    }

    private static async assertUnique(
        tx: CategoryTx,
        input: { name?: string; slug?: string; exceptId?: string },
    ) {
        if (input.name !== undefined) {
            const existing = await CategoryDao.findByName(tx, input.name);
            if (existing && existing.id !== input.exceptId) {
                throw new ConflictError("分类名称已存在");
            }
        }
        if (input.slug !== undefined) {
            const existing = await CategoryDao.findBySlug(tx, input.slug);
            if (existing && existing.id !== input.exceptId) {
                throw new ConflictError("分类 slug 已存在");
            }
        }
    }

    private static async assertParent(tx: CategoryTx, parentId: string, selfId?: string) {
        const parent = await CategoryDao.findById(tx, parentId);
        if (!parent) throw new NotFoundError("父分类不存在");
        if (parent.isSystem) throw new BadRequestError("不能在系统分类下创建子分类");
        const rows = await CategoryDao.listAll(tx);
        const parentById = new Map(rows.map((row) => [row.id, row.parentId]));
        if (selfId && parentCreatesCycle(parentById, selfId, parentId)) {
            throw new BadRequestError("不能把分类移到自身或其子分类下");
        }
        if (exceedsMaxCategoryLevel(parentById, parentId, selfId)) {
            throw new BadRequestError("分类最多三层");
        }
    }
}
