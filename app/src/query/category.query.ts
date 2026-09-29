import {
    queryOptions,
    mutationOptions,
} from "@tanstack/react-query";
import { Http } from "@/lib/utils";
import { CategoryDetailVO, CategoryListVO, DeleteCategoryVO } from "@/types/category.type";
import type {
    CreateCategoryBody,
    UpdateCategoryBody,
} from "@/lib/schema/category.schema";

export type SaveCategoryVariables =
    | { id?: undefined; body: CreateCategoryBody }
    | { id: string; body: UpdateCategoryBody };

export const categoryQueryKey = {
    all: ["categories"] as const,
    list: () => [...categoryQueryKey.all] as const,
    detail: (id: string) => [...categoryQueryKey.all, id] as const,
};

export class CategoryQuery {
    static list() {
        return queryOptions({
            queryKey: categoryQueryKey.list(),
            queryFn: () => Http.get<CategoryListVO>("/api/admin/v1/categories"),
        })
    }
    static save() {
        return mutationOptions({
            mutationFn: ({ id, body }: SaveCategoryVariables) => {
                if (id) {
                    return Http.patch<CategoryDetailVO>(
                        `/api/admin/v1/categories/${id}`,
                        body,
                    );
                }
                return Http.post<CategoryDetailVO>("/api/admin/v1/categories", body);
            },
        });
    }
    static delete() {
        return mutationOptions({
            mutationFn: (id: string) => {
                return Http.delete<DeleteCategoryVO>(
                    `/api/admin/v1/categories/${id}`,
                );
            },
        })
    }
}