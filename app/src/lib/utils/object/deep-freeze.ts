/**
 * 深冻结对象，原地冻结并返回同一引用。
 * 会递归处理普通对象、数组、函数属性，以及 Map / Set 中的键和值。
 * @param obj 对象
 * @returns 深冻结后的对象
 */
export function deepFreeze<T>(obj: T): T {
    return freeze(obj, new WeakSet());
}

function freeze<T>(obj: T, seen: WeakSet<object>): T {
    if (obj === null || (typeof obj !== "object" && typeof obj !== "function")) {
        return obj;
    }

    const target = obj as object;
    if (seen.has(target)) {
        return obj;
    }
    seen.add(target);

    if (target instanceof Map) {
        target.forEach((value, key) => {
            freeze(key, seen);
            freeze(value, seen);
        });
    } else if (target instanceof Set) {
        target.forEach((value) => {
            freeze(value, seen);
        });
    } else {
        for (const key of Reflect.ownKeys(target)) {
            freeze((target as Record<PropertyKey, unknown>)[key], seen);
        }
    }

    return Object.freeze(obj);
}
