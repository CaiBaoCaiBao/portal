import {
    InputHTMLAttributes,
    Ref,
    ChangeEvent,
    DragEvent,
} from "react";

export type UploadState = "idle" | "uploading" | "success" | "error";

export type FileMetadata = {
    id: string;
    name: string;
    size: number;
    mime: string;
    url: string;
    state: UploadState;
}

export type FileWithPreview = {
    id: string;
    file: File | FileMetadata;
    preview?: string;
}

export type FileUploadState = {
    files: FileWithPreview[];
    isDragging: boolean;
    errors: string[];
}

export type FileUploadAction = {
    addFiles: (files: File[] | FileList) => void;
    clearFiles: () => void;
    removeFile: (id: string) => void;
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleDragOver: (e: DragEvent<HTMLElement>) => void;
    handleDragLeave: (e: DragEvent<HTMLElement>) => void;
    handleDragEnter: (e: DragEvent<HTMLElement>) => void;
    handleDrop: (e: DragEvent<HTMLElement>) => void;
    openFileDialog: () => void
    getInputProps: (
        props?: InputHTMLAttributes<HTMLInputElement>
    ) => InputHTMLAttributes<HTMLInputElement> & {
        ref: Ref<HTMLInputElement>
    },
    clearErrors: () => void;
    updateFilePreview: (id: string, url: string) => Promise<void>;
}

export type FileUploadOptions = {
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    maxSize?: number;
    initialFiles?: FileMetadata[];
    onError?: (errors: string[]) => void;
    onFilesChange?: (files: FileWithPreview[]) => void;
    onFilesAdded?: (files: FileWithPreview[]) => void;
}