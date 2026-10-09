"use client";

import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GroupOption } from "./parent-options";

const ROOT_VALUE = "__root__";

interface Props {
    id: string;
    name: string;
    value: string;
    options: GroupOption[];
    allowRoot: boolean;
    disabled?: boolean;
    description?: string;
    invalid: boolean;
    errors: Array<{ message?: string } | undefined>;
    onBlur: () => void;
    onChange: (value: string) => void;
}

export function ParentSelect({
    id,
    name,
    value,
    options,
    allowRoot,
    disabled,
    description,
    invalid,
    errors,
    onBlur,
    onChange,
}: Props) {
    const items = [
        ...(allowRoot
            ? [{ label: "无（根节点）", value: ROOT_VALUE }]
            : []),
        ...options.map((option) => ({
            label: option.label,
            value: option.id,
        })),
    ];
    const selectValue =
        value === "" ? (allowRoot ? ROOT_VALUE : null) : value;

    return (
        <Field data-invalid={invalid}>
            <FieldLabel htmlFor={id}>父节点</FieldLabel>
            <Select
                items={items}
                id={id}
                name={name}
                value={selectValue}
                disabled={disabled}
                onValueChange={(next) => {
                    if (next == null || next === ROOT_VALUE) {
                        onChange("");
                        return;
                    }
                    onChange(next);
                }}
            >
                <SelectTrigger
                    className="w-full min-w-0"
                    aria-invalid={invalid}
                    onBlur={onBlur}
                >
                    <SelectValue placeholder="请选择分组" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start">
                    <SelectGroup>
                        {items.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <FieldDescription>
                {description ??
                    (disabled
                        ? "根节点不能移动到其他分组下。"
                        : allowRoot
                          ? "页面必须挂在分组下。分组选「无」时创建该范围的根节点。"
                          : "只能选择分组作为父节点。")}
            </FieldDescription>
            {invalid && <FieldError errors={errors} />}
        </Field>
    );
}
