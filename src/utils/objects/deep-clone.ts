/**
 * @description Deep clone an object or array.
 * @param value - The value to clone.
 * @param seen - The seen set to avoid circular references.
 * @returns The cloned value.
 */
export function deepClone<T>(value: T, seen = new WeakMap()): T {
    if (value === null || typeof value !== "object") return value;

    if (seen.has(value as object)) {
        return seen.get(value as object);
    }

    if (value instanceof Date) return new Date(value) as T;
    if (value instanceof RegExp) return new RegExp(value) as T;
    if (value instanceof Map) {
        const map = new Map();
        seen.set(value, map);
        value.forEach((v, k) => map.set(deepClone(k, seen), deepClone(v, seen)));
        return map as T;
    }
    if (value instanceof Set) {
        const set = new Set();
        seen.set(value, set);
        value.forEach((v) => set.add(deepClone(v, seen)));
        return set as T;
    }
    if (Array.isArray(value)) {
        const arr: unknown[] = [];
        seen.set(value, arr);
        value.forEach((item, i) => {
            arr[i] = deepClone(item, seen);
        });
        return arr as T;
    }

    const result: Record<string, unknown> = {};
    seen.set(value as object, result);
    for (const key of Reflect.ownKeys(value as object)) {
        result[key as string] = deepClone(
            (value as Record<PropertyKey, unknown>)[key],
            seen
        );
    }
    return result as T;
}