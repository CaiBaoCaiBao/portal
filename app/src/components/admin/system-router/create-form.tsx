"use client";

import { CreateFromType } from "@/hooks/system-router/use-create-form";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    NativeSelect,
    NativeSelectOption,
} from "@/components/ui/native-select";
import { SystemRouterTreeNodeVO } from "@/type/system-router.type";
import { collectGroupOptions } from "./parent-options";
import { ParentSelect } from "./parent-select";

interface Props {
    formId: string;
    items: SystemRouterTreeNodeVO[];
    form: CreateFromType;
    parentLocked?: boolean;
}

function hasError(meta: { isValid: boolean }) {
    return !meta.isValid;
}

function permissionText(ids: string[]) {
    return ids.join(", ");
}

function parsePermissionText(raw: string) {
    return raw
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

export function CreateForm({ formId, items, form, parentLocked }: Props) {
    const groupOptions = collectGroupOptions(items);
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
                    name="type"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>类型</FieldLabel>
                                <NativeSelect
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        const type = e.target.value === "group" ? "group" : "page";
                                        field.handleChange(type);
                                        if (type === "page") {
                                            form.setFieldValue("scope", "");
                                        } else if (form.getFieldValue("parentId").trim() === "") {
                                            const scope = form.getFieldValue("scope");
                                            form.setFieldValue(
                                                "path",
                                                scope === "admin" ? "admin" : "",
                                            );
                                        }
                                    }}
                                    aria-invalid={invalid}
                                >
                                    <NativeSelectOption value="page">页面</NativeSelectOption>
                                    <NativeSelectOption value="group">分组</NativeSelectOption>
                                </NativeSelect>
                                <FieldDescription>
                                    页面是叶子节点；分组下可以再挂分组或页面。
                                </FieldDescription>
                                {invalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                        );
                    }}
                />
                <form.Subscribe selector={(state) => state.values.type}>
                    {(type) => (
                        <form.Field
                            name="parentId"
                            children={(field) => {
                                const invalid = hasError(field.state.meta);
                                const allowRoot = type === "group" && !parentLocked;
                                return (
                                    <ParentSelect
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        options={groupOptions}
                                        allowRoot={allowRoot}
                                        disabled={parentLocked}
                                        description={
                                            parentLocked
                                                ? "从当前分组新建子节点时，父节点已确定。"
                                                : undefined
                                        }
                                        invalid={invalid}
                                        errors={field.state.meta.errors}
                                        onBlur={field.handleBlur}
                                        onChange={(next) => {
                                            field.handleChange(next);
                                            if (type !== "group") return;
                                            if (next.trim() === "") {
                                                const scope = form.getFieldValue("scope");
                                                form.setFieldValue(
                                                    "path",
                                                    scope === "admin" ? "admin" : "",
                                                );
                                                return;
                                            }
                                            if (form.getFieldValue("path") === "admin") {
                                                form.setFieldValue("path", "");
                                            }
                                        }}
                                    />
                                );
                            }}
                        />
                    )}
                </form.Subscribe>
                <form.Subscribe
                    selector={(state) => {
                        const isRoot =
                            state.values.type === "group" &&
                            state.values.parentId.trim() === "";
                        if (!isRoot) return state.values.type === "page" ? "page" : "child";
                        return state.values.scope === "admin" ? "root-admin" : "root-site";
                    }}
                >
                    {(mode) => (
                        <>
                            {mode === "root-admin" || mode === "root-site" ? (
                                <form.Field
                                    key="scope"
                                    name="scope"
                                    children={(field) => {
                                        const invalid = hasError(field.state.meta);
                                        return (
                                            <Field data-invalid={invalid}>
                                                <FieldLabel htmlFor={field.name}>范围</FieldLabel>
                                                <NativeSelect
                                                    id={field.name}
                                                    name={field.name}
                                                    value={field.state.value}
                                                    onBlur={field.handleBlur}
                                                    onChange={(e) => {
                                                        const scope =
                                                            e.target.value === "site" ||
                                                            e.target.value === "admin"
                                                                ? e.target.value
                                                                : "";
                                                        field.handleChange(scope);
                                                        form.setFieldValue(
                                                            "path",
                                                            scope === "admin" ? "admin" : "",
                                                        );
                                                    }}
                                                    aria-invalid={invalid}
                                                >
                                                    <NativeSelectOption value="">
                                                        请选择
                                                    </NativeSelectOption>
                                                    <NativeSelectOption value="site">
                                                        站点
                                                    </NativeSelectOption>
                                                    <NativeSelectOption value="admin">
                                                        后台
                                                    </NativeSelectOption>
                                                </NativeSelect>
                                                <FieldDescription>
                                                    只有根分组需要范围。站点根不占路径，后台根路径为 admin。
                                                </FieldDescription>
                                                {invalid && (
                                                    <FieldError errors={field.state.meta.errors} />
                                                )}
                                            </Field>
                                        );
                                    }}
                                />
                            ) : null}
                            <form.Field
                                key="path"
                                name="path"
                                children={(field) => {
                                    const invalid = hasError(field.state.meta);
                                    const isRoot = mode === "root-admin" || mode === "root-site";
                                    return (
                                        <Field data-invalid={invalid}>
                                            <FieldLabel htmlFor={field.name}>路径段</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={invalid}
                                                disabled={isRoot}
                                                placeholder={
                                                    mode === "page"
                                                        ? "留空表示索引页"
                                                        : mode === "child"
                                                          ? "留空表示菜单分组"
                                                          : mode === "root-admin"
                                                            ? "admin"
                                                            : "站点根不占路径"
                                                }
                                                autoComplete="off"
                                            />
                                            <FieldDescription>
                                                {mode === "page"
                                                    ? "小写字母、数字和连字符。留空是当前前缀的索引页。"
                                                    : mode === "child"
                                                      ? "填写一段路径，或留空作为不占 URL 的菜单分组。"
                                                      : "根路径由范围决定，不能单独修改。"}
                                            </FieldDescription>
                                            {invalid && (
                                                <FieldError errors={field.state.meta.errors} />
                                            )}
                                        </Field>
                                    );
                                }}
                            />
                        </>
                    )}
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
                                    value={field.state.value}
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
                    name="icon"
                    children={(field) => {
                        const invalid = hasError(field.state.meta);
                        return (
                            <Field data-invalid={invalid}>
                                <FieldLabel htmlFor={field.name}>图标</FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
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
                                    value={field.state.value}
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
                                        checked={field.state.value}
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
