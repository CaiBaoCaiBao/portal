import {
    InputHTMLAttributes,
    Ref,
    ChangeEvent
} from "react";

export type FileUploadState = {

}

export type FileUploadAction = {
    // 处理文件变化
    handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
    // 打开文件对话框
    openFileDialog: () => void
    // 获取输入框的props
    getInputProps: (
        props?: InputHTMLAttributes<HTMLInputElement>
    ) => InputHTMLAttributes<HTMLInputElement> & {
        ref: Ref<HTMLInputElement>
    }
}

export type FileUploadOptions = {
    multiple?: boolean;
    accept?: string;
    maxFiles?: number;
    maxSize?: number;
}