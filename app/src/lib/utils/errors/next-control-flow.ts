/** Next.js `redirect()` / `notFound()` 通过带 digest 的特殊错误实现控制流，捕获后必须原样抛出。 */
export function isNextControlFlowError(error: unknown): boolean {
    if (typeof error !== "object" || error === null || !("digest" in error)) {
        return false;
    }

    const digest = String((error as { digest?: unknown }).digest);
    return (
        digest.startsWith("NEXT_REDIRECT") ||
        digest.startsWith("NEXT_HTTP_ERROR_FALLBACK") ||
        digest === "NEXT_NOT_FOUND"
    );
}
