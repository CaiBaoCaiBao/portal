"use client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { InputHTMLAttributes, Ref } from "react";
interface Props {
    children: React.ReactNode;
    getInputProps: (
        props?: InputHTMLAttributes<HTMLInputElement>
    ) => InputHTMLAttributes<HTMLInputElement> & {
        ref: Ref<HTMLInputElement>
    };
    openFileDialog: () => void;
    className?: string;
}

export function FileUpload({
    children,
    className,
    getInputProps,
    openFileDialog
}: Props) {
    return (
        <div
            role="button"
            onClick={openFileDialog}
            className={cn(className ? "w-full" : "w-fit")}
        >
            <Input
                {...getInputProps()}
                className="sr-only"
                tabIndex={-1}
            />
            <div className={cn(className)}>
                {children}
            </div>
        </div>
    )
}