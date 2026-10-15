import {
    InputHTMLAttributes,
    useCallback,
    ChangeEvent,
} from "react";
import type {
    FileUploadState,
    FileUploadAction,
    FileUploadOptions,
} from "@/components/file-upload/type";
import { useState, useRef } from "react";

export function useFileUpload(options: FileUploadOptions = {}): [FileUploadState, FileUploadAction] {
    const {
        multiple = true,
        accept = "*",
        maxFiles = Number.POSITIVE_INFINITY,
        maxSize = Number.POSITIVE_INFINITY,
    } = options;
    const inputRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<FileUploadState>({

    });

    const addFiles = useCallback((files: File[] | FileList) => {
        console.log(files);
    }, [])

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    }, [addFiles])

    const openFileDialog = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.click()
        }
    }, [])

    const getInputProps = useCallback((props: InputHTMLAttributes<HTMLInputElement> = {}) => {
        return {
            ...props,
            type: "file" as const,
            onChange: handleFileChange,
            accept: props.accept || accept,
            multiple: props.multiple !== undefined ? props.multiple : multiple,
            ref: inputRef,
        }
    }, [accept, multiple])

    return [state, {
        getInputProps,
        handleFileChange,
        openFileDialog
    }];
}