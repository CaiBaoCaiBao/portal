export type CategoryDAO = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isActive: boolean;
    isSystem: boolean;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
};

export type CreateCategoryPO = {
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    isActive: boolean;
};

export type UpdateCategoryPO = {
    name?: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
    isActive?: boolean;
};

export type CategoryItemBO = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    isActive: boolean;
    isSystem: boolean;
    postCount: number;
    tagCount: number;
    children: CategoryItemBO[];
};

export type CategoryListBO = CategoryItemBO[];

export type CategoryDetailBO = Omit<CategoryItemBO, "children"> & {
    createdAt: string;
    updatedAt: string;
};

export type DeleteCategoryBO = {
    id: string;
    migratedPostCount: number;
};

export type CategoryItemVO = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    isActive: boolean;
    isSystem: boolean;
    postCount: number;
    tagCount: number;
    children: CategoryItemVO[];
};

export type CategoryListVO = CategoryItemVO[];

export type CategoryDetailVO = Omit<CategoryItemVO, "children"> & {
    createdAt: string;
    updatedAt: string;
};

export type DeleteCategoryVO = {
    id: string;
    migratedPostCount: number;
};

export function toCategoryItemVO(item: CategoryItemBO): CategoryItemVO {
    return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        description: item.description,
        parentId: item.parentId,
        isActive: item.isActive,
        isSystem: item.isSystem,
        postCount: item.postCount,
        tagCount: item.tagCount,
        children: item.children.map(toCategoryItemVO),
    };
}

export function toCategoryListVO(list: CategoryListBO): CategoryListVO {
    return list.map(toCategoryItemVO);
}

export function toCategoryDetailVO(detail: CategoryDetailBO): CategoryDetailVO {
    return {
        id: detail.id,
        name: detail.name,
        slug: detail.slug,
        description: detail.description,
        parentId: detail.parentId,
        isActive: detail.isActive,
        isSystem: detail.isSystem,
        postCount: detail.postCount,
        tagCount: detail.tagCount,
        createdAt: detail.createdAt,
        updatedAt: detail.updatedAt,
    };
}

export function toDeleteCategoryVO(result: DeleteCategoryBO): DeleteCategoryVO {
    return {
        id: result.id,
        migratedPostCount: result.migratedPostCount,
    };
}
