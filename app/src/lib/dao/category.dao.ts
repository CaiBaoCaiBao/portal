import "server-only";

import { db } from "@/prisma/db";
import type {
    CategoryDAO,
    CreateCategoryPO,
    UpdateCategoryPO,
} from "@/types/category.type";

export type CategoryTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type CategoryRead = {
    orm: CategoryTx["orm"];
};

const categoryRowSpec = {
    id: "pg/text@1",
    name: "pg/text@1",
    slug: "pg/text@1",
    description: { codecId: "pg/text@1", nullable: true },
    isActive: "pg/bool@1",
    isSystem: "pg/bool@1",
    parentId: { codecId: "pg/text@1", nullable: true },
    createdAt: "pg/timestamptz-string@1",
    updatedAt: "pg/timestamptz-string@1",
    deletedAt: { codecId: "pg/timestamptz-string@1", nullable: true },
} as const;

export class CategoryDao {
    static async findById(client: CategoryRead, id: string): Promise<CategoryDAO | null> {
        return client.orm.public.Category
            .where({ id })
            .where((category) => category.deletedAt.isNull())
            .first();
    }

    static async findBySlug(client: CategoryRead, slug: string): Promise<CategoryDAO | null> {
        return client.orm.public.Category
            .where({ slug })
            .where((category) => category.deletedAt.isNull())
            .first();
    }

    static async findByName(client: CategoryRead, name: string): Promise<CategoryDAO | null> {
        return client.orm.public.Category
            .where({ name })
            .where((category) => category.deletedAt.isNull())
            .first();
    }

    static async findSystem(client: CategoryRead): Promise<CategoryDAO[]> {
        return client.orm.public.Category
            .where({ isSystem: true })
            .where((category) => category.deletedAt.isNull())
            .all();
    }

    static async listAll(client: CategoryRead): Promise<CategoryDAO[]> {
        return client.orm.public.Category
            .where((category) => category.deletedAt.isNull())
            .orderBy([
                (category) => category.createdAt.asc(),
                (category) => category.name.asc(),
            ])
            .all();
    }

    static async countChildren(client: CategoryRead, id: string): Promise<number> {
        const result = await client.orm.public.Category
            .where({ parentId: id })
            .where((category) => category.deletedAt.isNull())
            .aggregate((aggregate) => ({ total: aggregate.count() }));
        return result.total;
    }

    static async countPostsByCategory(client: CategoryRead): Promise<Map<string, number>> {
        const rows = await client.orm.public.Post
            .groupBy("categoryId")
            .aggregate((aggregate) => ({ total: aggregate.count() }));
        return new Map(rows.map((row) => [row.categoryId, row.total]));
    }

    static async countTagsByCategory(client: CategoryRead): Promise<Map<string, number>> {
        const rows = await client.orm.public.Tag
            .where((tag) => tag.deletedAt.isNull())
            .groupBy("categoryId")
            .aggregate((aggregate) => ({ total: aggregate.count() }));
        return new Map(rows.map((row) => [row.categoryId, row.total]));
    }

    static async insertSystem(client: CategoryRead): Promise<CategoryDAO> {
        return client.orm.public.Category.create({
            name: "未分类",
            slug: "uncategorized",
            description: null,
            parentId: null,
            isActive: true,
            isSystem: true,
        });
    }

    static async insert(tx: CategoryTx, po: CreateCategoryPO): Promise<CategoryDAO> {
        return tx.orm.public.Category.create({
            name: po.name,
            slug: po.slug,
            description: po.description,
            parentId: po.parentId,
            isActive: po.isActive,
            isSystem: false,
        });
    }

    static async update(tx: CategoryTx, id: string, po: UpdateCategoryPO): Promise<void> {
        await tx.orm.public.Category.where({ id }).update(po);
    }

    static async delete(tx: CategoryTx, id: string): Promise<void> {
        await tx.orm.public.Category.where({ id }).delete();
    }

    static async migratePosts(tx: CategoryTx, fromId: string, toId: string): Promise<number> {
        const plan = db.raw.sql`
            UPDATE posts
            SET category_id = ${toId}
            WHERE category_id = ${fromId}
        `.affectedCount().build();
        const { affectedRows } = await tx.execute(plan);
        return affectedRows;
    }

    static async lockById(tx: CategoryTx, id: string): Promise<CategoryDAO | null> {
        const plan = db.raw.sql`
            SELECT
                id,
                name,
                slug,
                description,
                is_active AS "isActive",
                is_system AS "isSystem",
                parent_id AS "parentId",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                deleted_at AS "deletedAt"
            FROM categories
            WHERE id = ${id}
            FOR UPDATE
        `.returnsRow(categoryRowSpec).build();
        const rows = await tx.query(plan);
        return rows[0] ?? null;
    }

    static async lockSystem(tx: CategoryTx): Promise<CategoryDAO[]> {
        const plan = db.raw.sql`
            SELECT
                id,
                name,
                slug,
                description,
                is_active AS "isActive",
                is_system AS "isSystem",
                parent_id AS "parentId",
                created_at AS "createdAt",
                updated_at AS "updatedAt",
                deleted_at AS "deletedAt"
            FROM categories
            WHERE is_system = true AND deleted_at IS NULL
            FOR UPDATE
        `.returnsRow(categoryRowSpec).build();
        return tx.query(plan);
    }
}
