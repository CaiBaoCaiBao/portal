import {
    ConflictError,
    NotFoundError,
} from "@/lib/utils/errors/app-error";
import type {
    TestCreateBody,
    TestListQuery,
    TestPatchBody,
    TestReplaceBody,
} from "@/lib/schema/test.schema";

export type TestItem = {
    id: string;
    name: string;
    age: number;
};

const items = new Map<string, TestItem>([
    ["demo", { id: "demo", name: "Alice", age: 20 }],
]);

let seq = 1;

function assertNameUnique(name: string, exceptId?: string) {
    for (const item of items.values()) {
        if (item.name === name && item.id !== exceptId) {
            throw new ConflictError("name 已存在");
        }
    }
}

export function listTestItems(query: TestListQuery) {
    let list = [...items.values()];
    if (query.name) {
        const keyword = query.name.toLowerCase();
        list = list.filter((item) => item.name.toLowerCase().includes(keyword));
    }
    if (query.minAge !== undefined) {
        list = list.filter((item) => item.age >= query.minAge!);
    }

    const total = list.length;
    const start = (query.page - 1) * query.pageSize;
    return {
        items: list.slice(start, start + query.pageSize),
        page: query.page,
        pageSize: query.pageSize,
        total,
    };
}

export function getTestItem(id: string): TestItem {
    const item = items.get(id);
    if (!item) throw new NotFoundError("测试项不存在");
    return item;
}

export function createTestItem(input: TestCreateBody): TestItem {
    assertNameUnique(input.name);
    const item: TestItem = {
        id: `t_${seq++}`,
        name: input.name,
        age: input.age,
    };
    items.set(item.id, item);
    return item;
}

export function replaceTestItem(id: string, input: TestReplaceBody): TestItem {
    getTestItem(id);
    assertNameUnique(input.name, id);
    const item: TestItem = { id, ...input };
    items.set(id, item);
    return item;
}

export function patchTestItem(id: string, input: TestPatchBody): TestItem {
    const current = getTestItem(id);
    if (input.name !== undefined) assertNameUnique(input.name, id);
    const item: TestItem = { ...current, ...input };
    items.set(id, item);
    return item;
}

export function deleteTestItem(id: string): TestItem {
    const item = getTestItem(id);
    items.delete(id);
    return item;
}
