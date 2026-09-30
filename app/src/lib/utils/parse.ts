import "server-only";

import type { z } from "zod";
import { BadRequestError } from "./errors/app-error";
import type { SystemModule } from "./errors/codes";

type ZodSchema = z.ZodType;

function searchParamsToObject(params: URLSearchParams): Record<string, string | string[]> {
    const result: Record<string, string | string[]> = {};

    for (const key of new Set(params.keys())) {
        const values = params.getAll(key);
        result[key] = values.length <= 1 ? (values[0] ?? "") : values;
    }

    return result;
}

export function parseQuery<T extends ZodSchema>(req: Request, schema: T): z.infer<T> {
    const raw = searchParamsToObject(new URL(req.url).searchParams);
    return schema.parse(raw);
}

export async function parseBody<T extends ZodSchema>(
    req: Request,
    schema: T,
    module: SystemModule,
): Promise<z.infer<T>> {
    let raw: unknown;

    try {
        raw = await req.json();
    } catch (cause) {
        throw new BadRequestError("请求体必须是合法 JSON", module, { cause });
    }

    return schema.parse(raw);
}
