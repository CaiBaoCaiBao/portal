/**
 * 深拷贝：返回与原值结构相同、互不共享引用的副本。
 * 基于 `structuredClone`，支持 Date / Map / Set / ArrayBuffer / 循环引用等。
 * 不支持函数、DOM 节点、Symbol 作键等不可结构化克隆的值。
 */
export function deepClone<T>(value: T): T {
    return structuredClone(value);
}
