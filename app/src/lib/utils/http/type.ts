import type { ClientError } from "../errors/api-result";
import type { ErrorCode } from "../errors/codes";

export class ClientRequestError extends Error {
    public override readonly name = "ClientRequestError";
    public readonly code: ErrorCode;
    public readonly details?: unknown;
    public readonly errorId?: string;

    constructor(error: ClientError) {
        super(error.message);
        this.code = error.code;
        this.details = error.details;
        this.errorId = error.errorId;
    }
}

export type HttpOptions = {
    query?: Record<string, string | number | boolean | undefined>;
    headers?: HeadersInit;
    signal?: AbortSignal;
    timeoutMs?: number;
};

export type OutOptions = HttpOptions & {
    credentials?: RequestCredentials;
    parse?: "json" | "text" | "raw";
};

export type OutResult<T> =
    | { ok: true; status: number; data: T; headers: Headers }
    | { ok: false; status?: number; error: ClientError };

export type UploadProgress = {
    loaded: number;
    total: number;
    percent: number;
};

export type UploadOptions = HttpOptions & {
    onProgress?: (progress: UploadProgress) => void;
};
