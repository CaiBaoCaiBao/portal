import { z } from "zod";

export const idQuerySchema = z.preprocess(
    (val) => (val === void 0 ? void 0 : String(val)),
    z.uuidv7("Invalid ID")
);

export const paginationQuerySchema = z.object({
    pageIndex: z.preprocess(
        (val) => (val === void 0 ? void 0 : Number(val)),
        z.number().min(0).default(0)
    ),
    pageSize: z.preprocess(
        (val) => (val === void 0 ? void 0 : Number(val)),
        z.number().min(1).default(10)
    ),
});

export const orderQuerySchema = <T extends z.ZodObject>(schema: T) =>
    z.array(z.object({
        field: z.keyof(schema),
        order: z.enum(["asc", "desc"]).default("asc"),
    })).default([]);


// ============================================================================
// ================================= TYPES ====================================
// ============================================================================

export type IdQueryForm = z.input<typeof idQuerySchema>;
export type IdQueryDTO = z.output<typeof idQuerySchema>;

export type PaginationForm = z.input<typeof paginationQuerySchema>;
export type PaginationDTO = z.output<typeof paginationQuerySchema>;

export type OrderForm<T extends z.ZodObject> =
    z.input<ReturnType<typeof orderQuerySchema<T>>>;
export type OrderDTO<T extends z.ZodObject> =
    z.output<ReturnType<typeof orderQuerySchema<T>>>;