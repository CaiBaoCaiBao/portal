const MODULE = ["MEDIA", "CONTENT"] as const;

export type Module = (typeof MODULE)[number];