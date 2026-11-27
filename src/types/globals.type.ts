export type Module = "MEDIA" | "CONTENT";

export type Row<Model, Fields extends readonly (keyof Model)[]> =
    Pick<Model, Fields[number]>;

export type PaginationQuery = {
    pageIndex: number;
    pageSize: number;
}

export type MatchModule = | "exact" | "prefix" | "regex" | "contains" | "suffix";

export type OrderQuery<T> = {
    field: keyof T;
    order: "asc" | "desc";
}[]