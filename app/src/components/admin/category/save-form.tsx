"use client";
import { SaveFormType } from "@/hooks/category/use-save-form";
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryListVO } from "@/types/category.type";
import {
    findCategoryName,
    parentCategoryOptions,
} from "./parent-options";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface Props {
    formId: string;
    form: SaveFormType;
    listTree: CategoryListVO;
    excludeIds: readonly string[];
}

function shouldShowFieldError(field: {
    state: {
        meta: {
            isTouched: boolean;
            isValid: boolean;
            errorMap: Record<string, unknown>;
        };
    };
}, submissionAttempts: number) {
    if (field.state.meta.isValid) return false;
    return field.state.meta.isTouched
        || submissionAttempts > 0
        || field.state.meta.errorMap.onSubmit != null;
}

export function SaveForm({ formId, form, listTree, excludeIds }: Props) {
    const parentOptions = parentCategoryOptions(listTree, new Set(excludeIds));

    return (
        <form id={formId}
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
        >
            <form.Subscribe
                selector={(state) => state.submissionAttempts}
                children={(submissionAttempts) => (
                    <FieldGroup>
                        <form.Field
                            name="name"
                            children={(field) => {
                                const isInvalid = shouldShowFieldError(field, submissionAttempts)
                                return (
                                    <Field aria-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Category Name
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value ?? ""}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                autoComplete="off"
                                                placeholder="Enter category name"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </FieldContent>
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="slug"
                            children={(field) => {
                                const isInvalid = shouldShowFieldError(field, submissionAttempts)
                                return (
                                    <Field aria-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Category Slug
                                        </FieldLabel>
                                        <FieldContent>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value ?? ""}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                autoComplete="off"
                                                placeholder="Enter category slug"
                                            />
                                            {isInvalid && (
                                                <FieldError errors={field.state.meta.errors} />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="description"
                            children={(field) => {
                                const isInvalid = shouldShowFieldError(field, submissionAttempts)
                                return (
                                    <Field aria-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            Description (Optional)
                                        </FieldLabel>
                                        <FieldContent>
                                            <Textarea
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value ?? ""}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="Enter category description"
                                                minRows={2}
                                            />
                                            {isInvalid && (
                                                <FieldError errors={field.state.meta.errors} />
                                            )}
                                        </FieldContent>
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="parentId"
                            children={(field) => {
                                const isInvalid = shouldShowFieldError(field, submissionAttempts)
                                const selectedId = typeof field.state.value === "string"
                                    ? field.state.value
                                    : undefined
                                const selected = parentOptions.find((option) => option.id === selectedId)
                                const selectedName = selected?.name
                                    ?? (selectedId ? findCategoryName(listTree, selectedId) : null)
                                return (
                                    <Field aria-invalid={isInvalid}>
                                        <FieldLabel id={`${field.name}-label`}>
                                            Parent Category
                                        </FieldLabel>
                                        <FieldContent>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    className="w-full"
                                                    render={
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full justify-between font-normal"
                                                            aria-invalid={isInvalid}
                                                            aria-labelledby={`${field.name}-label`}
                                                        />
                                                    }
                                                    onBlur={field.handleBlur}
                                                >
                                                    <span className={cn("truncate", !selectedName && "text-muted-foreground")}>
                                                        {selectedName ?? "No parent"}
                                                    </span>
                                                    <ChevronDown />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuRadioGroup
                                                        value={selectedId ?? ""}
                                                        onValueChange={(value) => {
                                                            field.handleChange(value ? String(value) : undefined)
                                                        }}
                                                    >
                                                        <DropdownMenuRadioItem value="">
                                                            No parent
                                                        </DropdownMenuRadioItem>
                                                        {parentOptions.map((option) => (
                                                            <DropdownMenuRadioItem
                                                                key={option.id}
                                                                value={option.id}
                                                            >
                                                                <span style={{ paddingLeft: option.depth * 12 }}>
                                                                    {option.name}
                                                                </span>
                                                            </DropdownMenuRadioItem>
                                                        ))}
                                                    </DropdownMenuRadioGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </FieldContent>
                                    </Field>
                                )
                            }}
                        />
                        <form.Field
                            name="isActive"
                            children={(field) => {
                                return (
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id={field.name}
                                            name={field.name}
                                            checked={field.state.value ?? false}
                                            onCheckedChange={(checked) => field.handleChange(checked === true)}
                                        />
                                        <FieldLabel htmlFor={field.name}>
                                            {field.state.value ? "Active" : "Inactive"}
                                        </FieldLabel>
                                    </Field>
                                )
                            }}
                        />
                    </FieldGroup>
                )}
            />
        </form>
    )
}