/**
 * 深拷贝对象
 * @param obj 对象
 * @returns 深拷贝后的对象
 */
export function deepClone<T>(obj: T): T {
    return structuredClone(obj);
}