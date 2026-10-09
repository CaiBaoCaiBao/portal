"use client";

import { EditFromType } from "@/hooks/system-router/use-edit-form";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import { collectDescendantIds, collectGroupOptions } from "./parent-options";
import { ParentSelect } from "./parent-select";

interface Props {
    formId: string;
    items: SystemRouterTreeNodeVO[];
    row: SystemRouterTreeNodeVO;
    form: EditFromType;
}

function hasError(meta: { isValid: boolean }) {
    return !meta.isValid;
}

function permissionText(ids: string[] | undefined) {
    return (ids ?? []).join(", ");
}

function parsePermissionText(raw: string) {
    return raw
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

export function EditForm({ formId, items, row, form }: Props) {
    const isRoot = row.type === "group" && row.parentId == null;
    const groupOptions = collectGroupOptions(
        items,
        collectDescendantIds(row),
    );

    return (
        <form
            id={formId}
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
            }}
        >
            <FieldGroup className="max-h-[60vh] overflow-y-auto pr-1">
                <form.Subscribe selector={(state) => state.errors}>
                    {(errors) => {
                        const items = errors.flatMap((error) => {
                            if (typeof error === "string") return [{ message: error }];
                            if (
                                error &&
                                typeof error === "object" &&
                                "message" in error &&
                                typeof error.message === "string"
                            ) {
                                return [{ message: error.message }];
                            }
                            return [];
                        });
                        if (items.length === 0) return null;
                        return <FieldError errors={items} />;
                    }}
                </form.Subscribe>
                <form.Field
                    name="name"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>名称</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={invalid}
                                    placeholder="导航上显示的名称"
                                    autoComplete="off"
                                />
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
                <form.Field
                    name="parentId"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <ParentSelect
                                id={field.name}
                                name={field.name}
                                value={field.state.value ?? ""}
                                options={groupOptions}
                                allowRoot={isRoot}
                                disabled={isRoot}
                                invalid={invalid}
                                errors={field.state.meta.errors}
                                onBlur={field.handleBlur}
                                onChange={(next) =>
                                    field.handleChange(next === "" ? null : next)
                                }
                            />
                        );
                    }}
                />
                <form.Field
                    name="path"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        const isNull = field.state.value == null;
                        const allowNullPath = row.type === "group" && !isRoot;
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>路径段</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={invalid}
                                    disabled={isRoot || (allowNullPath && isNull)}
                                    placeholder={
                                        isRoot
                                            ? row.scope === "admin"
                                                ? "admin"
                                                : "站点根不占路径"
                                            : row.type === "page"
                                              ? "留空表示索引页"
                                              : isNull
                                                ? "不占路径"
                                                : "留空表示菜单分组"
                                    }
                                    autoComplete="off"
                                />
                                {allowNullPath ? (
                                    <FieldLabel
                                        htmlFor={`${field.name}-null`}
                                        className="font-normal"
                                    >
                                        <input
                                            id={`${field.name}-null`}
                                            type="checkbox"
                                            checked={isNull}
                                            onChange={(e) =>
                                                field.handleChange(e.target.checked ? null : "")
                                            }
                                            className="size-4 shrink-0 accent-primary"
                                        />
                                        不占路径
                                    </FieldLabel>
                                ) : null}
                                <FieldDescription>
                                    {isRoot
                                        ? "根路径由范围决定，不能单独修改。"
                                        : row.type === "page"
                                          ? "小写字母、数字和连字符。留空是当前前缀的索引页。"
                                          : "填写一段路径，或勾选不占 URL 的菜单分组。"}
                                </FieldDescription>
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
                <form.Field
                    name="icon"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>图标</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(
                                            e.target.value === "" ? null : e.target.value,
                                        )
                                    }
                                    aria-invalid={invalid}
                                    placeholder="Lucide 图标名，例如 layout-dashboard"
                                    autoComplete="off"
                                />
                                <FieldDescription>可留空。</FieldDescription>
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
                <form.Field
                    name="sort"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>排序</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    step={1}
                                    min={0}
                                    value={field.state.value ?? 0}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        const next = e.target.valueAsNumber;
                                        field.handleChange(
                                            Number.isFinite(next) ? Math.trunc(next) : 0,
                                        );
                                    }}
                                    aria-invalid={invalid}
                                />
                                <FieldDescription>同级按从小到大排列。</FieldDescription>
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
                <form.Field
                    name="isActive"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name} className="font-normal">
                                    <input
                                        id={field.name}
                                        name={field.name}
                                        type="checkbox"
                                        checked={field.state.value ?? true}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.checked)}
                                        aria-invalid={invalid}
                                        className="size-4 shrink-0 accent-primary"
                                    />
                                    启用
                                </FieldLabel>
                                <FieldDescription>停用后不会进入导航。</FieldDescription>
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
                <form.Field
                    name="permissionIds"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>权限</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={permissionText(field.state.value)}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(parsePermissionText(e.target.value))
                                    }
                                    aria-invalid={invalid}
                                    placeholder="多个 ID 用逗号分隔"
                                    autoComplete="off"
                                />
                                <FieldDescription>留空表示任意已登录用户可见。</FieldDescription>
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
            </FieldGroup>
        </form>
    );
}
