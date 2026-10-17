import { FieldInputTypes } from "@/prisma/contract";

export type MediaInput = FieldInputTypes["public"]["Media"];

export type MediaInsert = Omit<MediaInput,
    | "id"
    | "createdAt"
>;