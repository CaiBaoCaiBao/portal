"use client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    InputHTMLAttributes,
    Ref,
    DragEvent,
} from "react";
interface Props {
    children: React.ReactNode;
    getInputProps: (
        props?: InputHTMLAttributes<HTMLInputElement>
    ) => InputHTMLAttributes<HTMLInputElement> & {
        ref: Ref<HTMLInputElement>
    };
    openFileDialog: () => void;
    className?: string;
    handleDragOver?: (e: DragEvent<HTMLElement>) => void;
    handleDragLeave?: (e: DragEvent<HTMLElement>) => void;
    handleDragEnter?: (e: DragEvent<HTMLElement>) => void;
    handleDrop?: (e: DragEvent<HTMLElement>) => void;
}

export function FileUpload({
    children,
    className,
    getInputProps,
    openFileDialog,
    handleDragOver,
    handleDragLeave,
    handleDragEnter,
    handleDrop
}: Props) {
    return (
        <div
            role="button"
            onClick={openFileDialog}
            className={cn(className ? "w-full" : "w-fit")}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDragEnter={handleDragEnter}
            onDrop={handleDrop}
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