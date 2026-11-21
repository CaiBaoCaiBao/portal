
/**
 * @description 获取模型的列名
 * @template T 模型类型
 * @param names 列名
 * @returns 列名数组
 */
export function columns<T>() {
    return <const K extends readonly (keyof T)[]>
        (...names: K) => names;
};