import type { ApiError, ApiResult } from "@/types/api-result.type";
import { unwrapApiResult } from "@/lib/utils/errors/client";
import { isApiResult } from "@/lib/utils/errors/result";
import { buildUrl } from "./build-url";
import type { HttpOptions } from "./type";

export type { HttpOptions } from "./type";

type InternalOptions = Omit<HttpOptions, "body" | "method">;

export class Http {
    static get<T>(path: string, options?: InternalOptions): Promise<T> {
        return this.request<T>(path, { ...options, method: "GET" });
    }

    static post<T>(
        path: string,
        body?: unknown,
        options?: InternalOptions,
    ): Promise<T> {
        return this.request<T>(path, { ...options, method: "POST", body });
    }

    static put<T>(
        path: string,
        body?: unknown,
        options?: InternalOptions,
    ): Promise<T> {
        return this.request<T>(path, { ...options, method: "PUT", body });
    }

    static patch<T>(
        path: string,
        body?: unknown,
        options?: InternalOptions,
    ): Promise<T> {
        return this.request<T>(path, { ...options, method: "PATCH", body });
    }

    static delete<T>(
        path: string,
        options?: InternalOptions,
    ): Promise<T> {
        return this.request<T>(path, { ...options, method: "DELETE" });
    }

    private static async request<T>(
        path: string,
        options: HttpOptions = {},
    ): Promise<T> {
        const { body, params, headers, credentials, ...rest } = options;
        const rawBody = isRawBody(body);

        let res: Response;
        try {
            res = await fetch(buildUrl(path, params), {
                ...rest,
                credentials: credentials ?? "include",
                headers: {
                    Accept: "application/json",
                    ...(body !== undefined && !rawBody
                        ? { "Content-Type": "application/json" }
                        : {}),
                    ...headersToRecord(headers),
                },
                body:
                    body === undefined
                        ? undefined
                        : rawBody
                            ? body
                            : JSON.stringify(body),
            });
        } catch (err) {
            if (isAbortError(err)) throw err;
            if (err instanceof Error) throw err;
            throw new Error("请求失败，请稍后重试");
        }

        let json: unknown;
        try {
            json = await res.json();
        } catch {
            throw protocolError("响应解析失败");
        }

        if (!isApiResult(json)) {
            throw protocolError("响应格式无效");
        }

        return unwrapApiResult(json as ApiResult<T>);
    }
}

function isRawBody(body: unknown): body is FormData | Blob {
    return (
        (typeof FormData !== "undefined" && body instanceof FormData) ||
        (typeof Blob !== "undefined" && body instanceof Blob)
    );
}

function headersToRecord(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};
    if (headers instanceof Headers) return Object.fromEntries(headers.entries());
    if (Array.isArray(headers)) return Object.fromEntries(headers);
    return { ...headers };
}

function isAbortError(err: unknown): boolean {
    return err instanceof Error && err.name === "AbortError";
}

function protocolError(message: string): ApiError {
    return {
        success: false,
        error: {
            code: "Internal Server Error",
            message,
        },
        timestamp: new Date().toISOString(),
    };
}
