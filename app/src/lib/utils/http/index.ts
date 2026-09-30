import type { ApiResult, ClientError, ErrorResult } from "../errors/api-result";
import type { ErrorCode } from "../errors/codes";
import {
    ClientRequestError,
    type HttpOptions,
    type OutOptions,
    type OutResult,
    type UploadOptions,
} from "./type";

export type {
    HttpOptions,
    OutOptions,
    OutResult,
    UploadOptions,
    UploadProgress,
} from "./type";
export { ClientRequestError } from "./type";

const DEFAULT_TIMEOUT_MS = 15_000;

type UploadOutOptions = UploadOptions & Pick<OutOptions, "credentials" | "parse">;

export class Http {
    static get<T>(url: string, options?: HttpOptions) {
        return this.request<T>("GET", url, undefined, options);
    }

    static post<T>(url: string, body?: unknown, options?: HttpOptions) {
        return this.request<T>("POST", url, body, options);
    }

    static put<T>(url: string, body?: unknown, options?: HttpOptions) {
        return this.request<T>("PUT", url, body, options);
    }

    static patch<T>(url: string, body?: unknown, options?: HttpOptions) {
        return this.request<T>("PATCH", url, body, options);
    }

    static delete<T>(url: string, options?: HttpOptions) {
        return this.request<T>("DELETE", url, undefined, options);
    }

    static getOut<T>(url: string, options?: OutOptions) {
        return this.requestOut<T>("GET", url, undefined, options);
    }

    static postOut<T>(url: string, body?: unknown, options?: OutOptions) {
        return this.requestOut<T>("POST", url, body, options);
    }

    static putOut<T>(url: string, body?: unknown, options?: OutOptions) {
        return this.requestOut<T>("PUT", url, body, options);
    }

    static patchOut<T>(url: string, body?: unknown, options?: OutOptions) {
        return this.requestOut<T>("PATCH", url, body, options);
    }

    static deleteOut<T>(url: string, options?: OutOptions) {
        return this.requestOut<T>("DELETE", url, undefined, options);
    }

    static upload<T>(
        url: string,
        body: FormData | Blob | File,
        options?: UploadOptions,
    ): Promise<ApiResult<T>> {
        return this.requestXhr<T>("in", url, body, options);
    }

    static uploadOut<T>(
        url: string,
        body: FormData | Blob | File,
        options?: UploadOutOptions,
    ): Promise<OutResult<T>> {
        return this.requestXhr<T>("out", url, body, options);
    }

    static async unwrap<T>(result: Promise<ApiResult<T>>): Promise<T> {
        const resolved = await result;
        if (resolved.ok) {
            return resolved.data;
        }
        throw new ClientRequestError(resolved.error);
    }

    static async unwrapOut<T>(result: Promise<OutResult<T>>): Promise<T> {
        const resolved = await result;
        if (resolved.ok) {
            return resolved.data;
        }
        throw new ClientRequestError(resolved.error);
    }

    private static async request<T>(
        method: string,
        url: string,
        body?: unknown,
        options?: HttpOptions,
    ): Promise<ApiResult<T>> {
        const { signal, cleanup } = this.mergeSignal(options);
        try {
            const response = await fetch(this.buildUrl(url, options?.query), {
                method,
                credentials: "same-origin",
                headers: this.buildHeaders(body, options?.headers),
                body: this.serializeBody(body),
                signal,
            });
            return await this.toApiResult<T>(response);
        } catch (error) {
            return this.catchFetch(error, options?.signal, (clientError) => this.toErrorResult(clientError));
        } finally {
            cleanup();
        }
    }

    private static async requestOut<T>(
        method: string,
        url: string,
        body?: unknown,
        options?: OutOptions,
    ): Promise<OutResult<T>> {
        const { signal, cleanup } = this.mergeSignal(options);
        try {
            const response = await fetch(this.buildUrl(url, options?.query), {
                method,
                credentials: options?.credentials ?? "omit",
                headers: this.buildHeaders(body, options?.headers),
                body: this.serializeBody(body),
                signal,
            });
            return await this.toOutResult<T>(response, options?.parse ?? "json");
        } catch (error) {
            return this.catchFetch(error, options?.signal, (clientError) => this.toOutFailure(clientError));
        } finally {
            cleanup();
        }
    }

    private static requestXhr<T>(
        kind: "in",
        url: string,
        body: FormData | Blob | File,
        options?: UploadOptions,
    ): Promise<ApiResult<T>>;
    private static requestXhr<T>(
        kind: "out",
        url: string,
        body: FormData | Blob | File,
        options?: UploadOutOptions,
    ): Promise<OutResult<T>>;
    private static requestXhr<T>(
        kind: "in" | "out",
        url: string,
        body: FormData | Blob | File,
        options?: UploadOutOptions,
    ): Promise<ApiResult<T> | OutResult<T>> {
        if (typeof XMLHttpRequest === "undefined") {
            const failure = this.clientError("INTERNAL", "当前环境不支持上传");
            return Promise.resolve(
                kind === "in" ? this.toErrorResult(failure) : this.toOutFailure(failure),
            );
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
            const href = this.buildUrl(url, options?.query);

            xhr.open("POST", href);
            xhr.timeout = timeoutMs;
            xhr.withCredentials = kind === "in"
                ? true
                : (options?.credentials ?? "omit") !== "omit";

            const headers = this.buildHeaders(body, options?.headers);
            headers.forEach((value, key) => {
                xhr.setRequestHeader(key, value);
            });

            const onAbort = () => xhr.abort();
            options?.signal?.addEventListener("abort", onAbort);

            const finish = (result: ApiResult<T> | OutResult<T>) => {
                options?.signal?.removeEventListener("abort", onAbort);
                resolve(result);
            };

            xhr.upload.onprogress = (event) => {
                const total = event.lengthComputable ? event.total : 0;
                options?.onProgress?.({
                    loaded: event.loaded,
                    total,
                    percent: total === 0 ? 0 : Math.round((event.loaded / total) * 100),
                });
            };

            xhr.onload = () => {
                const text = xhr.responseText;
                if (kind === "in") {
                    finish(this.parseApiBody<T>(this.parseJson(text), xhr.status));
                    return;
                }
                finish(this.parseOutBody<T>(text, xhr.status, options?.parse ?? "json", this.headersFromXhr(xhr)));
            };

            xhr.ontimeout = () => {
                finish(this.failByKind(kind, this.clientError("INTERNAL", "请求超时")));
            };

            xhr.onerror = () => {
                finish(this.failByKind(kind, this.clientError("INTERNAL", "网络异常")));
            };

            xhr.onabort = () => {
                options?.signal?.removeEventListener("abort", onAbort);
                if (options?.signal?.aborted) {
                    reject(options.signal.reason instanceof Error
                        ? options.signal.reason
                        : new DOMException("The operation was aborted.", "AbortError"));
                    return;
                }
                finish(this.failByKind(kind, this.clientError("INTERNAL", "请求超时")));
            };

            xhr.send(body);
        });
    }

    private static async toApiResult<T>(response: Response): Promise<ApiResult<T>> {
        const text = await response.text();
        return this.parseApiBody<T>(this.parseJson(text), response.status);
    }

    private static parseApiBody<T>(body: unknown, status: number): ApiResult<T> {
        if (this.isApiResult<T>(body)) {
            return body;
        }
        return this.toErrorResult(this.clientError(
            this.codeFromStatus(status),
            "响应无法解析",
        ));
    }

    private static async toOutResult<T>(
        response: Response,
        parse: NonNullable<OutOptions["parse"]>,
    ): Promise<OutResult<T>> {
        if (!response.ok) {
            return this.toOutFailure(
                this.clientError(this.codeFromStatus(response.status), "响应无法解析"),
                response.status,
            );
        }

        try {
            const data = await this.readOutBody<T>(response, parse);
            return { ok: true, status: response.status, data, headers: response.headers };
        } catch {
            return this.toOutFailure(
                this.clientError("INTERNAL", "响应无法解析"),
                response.status,
            );
        }
    }

    private static async readOutBody<T>(
        response: Response,
        parse: NonNullable<OutOptions["parse"]>,
    ): Promise<T> {
        if (parse === "text") {
            return (await response.text()) as T;
        }
        if (parse === "raw") {
            return (await response.arrayBuffer()) as T;
        }
        return (await response.json()) as T;
    }

    private static parseOutBody<T>(
        text: string,
        status: number,
        parse: NonNullable<OutOptions["parse"]>,
        headers: Headers,
    ): OutResult<T> {
        if (status < 200 || status >= 300) {
            return this.toOutFailure(
                this.clientError(this.codeFromStatus(status), "响应无法解析"),
                status,
            );
        }

        try {
            let data: T;
            if (parse === "text" || parse === "raw") {
                data = text as T;
            } else {
                data = JSON.parse(text) as T;
            }
            return { ok: true, status, data, headers };
        } catch {
            return this.toOutFailure(this.clientError("INTERNAL", "响应无法解析"), status);
        }
    }

    private static catchFetch<T>(
        error: unknown,
        userSignal: AbortSignal | undefined,
        fail: (error: ClientError) => T,
    ): T {
        if (this.isAbortError(error)) {
            if (userSignal?.aborted) {
                throw error;
            }
            return fail(this.clientError("INTERNAL", "请求超时"));
        }
        return fail(this.clientError("INTERNAL", "网络异常"));
    }

    private static mergeSignal(options?: HttpOptions) {
        const controller = new AbortController();
        const userSignal = options?.signal;
        const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

        const onUserAbort = () => {
            controller.abort(userSignal?.reason);
        };

        if (userSignal?.aborted) {
            controller.abort(userSignal.reason);
        } else {
            userSignal?.addEventListener("abort", onUserAbort);
        }

        const timer = setTimeout(() => {
            if (!controller.signal.aborted) {
                controller.abort("timeout");
            }
        }, timeoutMs);

        return {
            signal: controller.signal,
            cleanup: () => {
                clearTimeout(timer);
                userSignal?.removeEventListener("abort", onUserAbort);
            },
        };
    }

    private static buildUrl(
        path: string,
        query?: HttpOptions["query"],
    ) {
        const absolute = /^https?:\/\//i.test(path);
        const url = absolute ? new URL(path) : new URL(path, "http://local.invalid");

        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined) {
                    url.searchParams.set(key, String(value));
                }
            }
        }

        if (absolute) {
            return url.toString();
        }
        return `${url.pathname}${url.search}${url.hash}`;
    }

    private static buildHeaders(body: unknown, headers?: HeadersInit) {
        const next = new Headers(headers);
        if (!next.has("Accept")) {
            next.set("Accept", "application/json");
        }
        if (body !== undefined && this.shouldJsonBody(body) && !next.has("Content-Type")) {
            next.set("Content-Type", "application/json");
        }
        if (body instanceof FormData) {
            next.delete("Content-Type");
        }
        return next;
    }

    private static serializeBody(body: unknown): BodyInit | undefined {
        if (body === undefined) {
            return undefined;
        }
        if (this.isBodyInit(body)) {
            return body;
        }
        return JSON.stringify(body);
    }

    private static shouldJsonBody(body: unknown) {
        return !this.isBodyInit(body);
    }

    private static isBodyInit(body: unknown): body is BodyInit {
        return (
            typeof body === "string"
            || body instanceof FormData
            || body instanceof Blob
            || body instanceof URLSearchParams
            || body instanceof ArrayBuffer
            || ArrayBuffer.isView(body)
        );
    }

    private static isApiResult<T>(body: unknown): body is ApiResult<T> {
        if (typeof body !== "object" || body === null || !("ok" in body)) {
            return false;
        }
        if ((body as { ok: unknown }).ok === true) {
            return "data" in body;
        }
        if ((body as { ok: unknown }).ok === false) {
            const error = (body as { error?: unknown }).error;
            return (
                typeof error === "object"
                && error !== null
                && "code" in error
                && "message" in error
            );
        }
        return false;
    }

    private static codeFromStatus(status: number): ErrorCode {
        if (status === 401) return "UNAUTHORIZED";
        if (status === 403) return "FORBIDDEN";
        if (status === 404) return "NOT_FOUND";
        if (status === 409) return "CONFLICT";
        if (status >= 400 && status < 500) return "BAD_REQUEST";
        return "INTERNAL";
    }

    private static clientError(code: ErrorCode, message: string): ClientError {
        return { code, message };
    }

    private static toErrorResult(error: ClientError): ErrorResult {
        return { ok: false, error };
    }

    private static toOutFailure(error: ClientError, status?: number): OutResult<never> {
        return status === undefined ? { ok: false, error } : { ok: false, status, error };
    }

    private static failByKind(
        kind: "in" | "out",
        error: ClientError,
    ): ErrorResult | OutResult<never> {
        return kind === "in" ? this.toErrorResult(error) : this.toOutFailure(error);
    }

    private static parseJson(text: string): unknown {
        if (!text) {
            return undefined;
        }
        try {
            return JSON.parse(text);
        } catch {
            return undefined;
        }
    }

    private static headersFromXhr(xhr: XMLHttpRequest) {
        const headers = new Headers();
        const raw = xhr.getAllResponseHeaders();
        if (!raw) {
            return headers;
        }
        for (const line of raw.trim().split(/[\r\n]+/)) {
            const index = line.indexOf(":");
            if (index > 0) {
                headers.append(line.slice(0, index).trim(), line.slice(index + 1).trim());
            }
        }
        return headers;
    }

    private static isAbortError(error: unknown): boolean {
        return (
            (error instanceof DOMException && error.name === "AbortError")
            || (error instanceof Error && error.name === "AbortError")
        );
    }
}
