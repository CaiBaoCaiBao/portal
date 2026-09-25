import "server-only";
import { z } from "zod";
import { BadRequestError } from "@/lib/utils/errors/app-error";

/** 对已有数据跑 schema；失败抛 ZodError → apiHandler 映射为 422。 */
export function parse<T extends z.ZodType>(
    schema: T,
    data: unknown,
): z.infer<T> {
    return schema.parse(data);
}

/** 读 JSON body 再校验；非法 JSON → 400，形状不符 → 422。 */
export async function parseBody<T extends z.ZodType>(
    req: Request,
    schema: T,
): Promise<z.infer<T>> {
    let json: unknown;
    try {
        json = await req.json();
    } catch {
        throw new BadRequestError("请求体必须是合法 JSON");
    }
    return schema.parse(json);
}

/** 校验 query string（`?page=1&q=foo`）。 */
export function parseSearchParams<T extends z.ZodType>(
    req: Request,
    schema: T,
): z.infer<T> {
    const { searchParams } = new URL(req.url);
    return schema.parse(Object.fromEntries(searchParams.entries()));
}

/**
 * 校验动态路由 params（如 `[id]`）。
 * Next 较新版本里 `context.params` 可能是 Promise。
 */
export async function parseParams<T extends z.ZodType>(
    params:
        | Promise<Record<string, string | string[] | undefined>>
        | Record<string, string | string[] | undefined>,
    schema: T,
): Promise<z.infer<T>> {
    return schema.parse(await Promise.resolve(params));
}
