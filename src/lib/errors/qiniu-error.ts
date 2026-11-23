export class QiniuError extends Error {
    readonly status?: number;
    readonly name: string;

    constructor(name: string, message: string, options?: { status?: number; cause?: unknown }) {
        super(message, { cause: options?.cause });
        this.name = name;
        this.status = options?.status;
    }
}