export type HttpOptions = Omit<RequestInit, "body"> & {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
};
