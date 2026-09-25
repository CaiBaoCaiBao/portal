export function buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
): string {
    if (!params) return path;

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined) continue;
        search.set(key, String(value));
    }

    const query = search.toString();
    if (!query) return path;
    return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}
