/**
 * 深度冻结：递归 `Object.freeze`，使对象及其嵌套属性均不可写、不可扩展。
 * 就地修改并返回同一引用；原始值直接返回。
 */
export function deepFrozen<T>(value: T): T {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
        return value;
    }

    Object.freeze(value);

    for (const key of Reflect.ownKeys(value)) {
        const child = (value as Record<PropertyKey, unknown>)[key];
        deepFrozen(child);
    }

    return value;
}
