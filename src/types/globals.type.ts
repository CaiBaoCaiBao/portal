const MODULE = ["MEDIA", "CONTENT"] as const;

export type Module = (typeof MODULE)[number];

export type Row<Model, Fields extends readonly (keyof Model)[]> =
    Pick<Model, Fields[number]>;

export type PaginationQuery = {
    pageIndex: number;
    pageSize: number;
}

export type OrderQuery<T> = {
    field: keyof T;
    order: "asc" | "desc";
}[]