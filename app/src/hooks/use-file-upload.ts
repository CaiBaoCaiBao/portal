import {
    InputHTMLAttributes,
    useCallback,
    ChangeEvent,
    DragEvent,
} from "react";
import type {
    FileUploadState,
    FileUploadAction,
    FileUploadOptions,
    FileWithPreview,
    FileMetadata,
} from "@/components/file-upload/type";
import {
    useState,
    useRef
} from "react";
import {
    formatBytes,
    generateUUID
} from "@/lib/utils";

export function useFileUpload(options: FileUploadOptions = {}): [FileUploadState, FileUploadAction] {
    const {
        multiple = true,
        accept = "*",
        maxFiles = Number.POSITIVE_INFINITY,
        maxSize = Number.POSITIVE_INFINITY,
        initialFiles = [],
        onError,
        onFilesChange,
        onFilesAdded,
    } = options;
    const inputRef = useRef<HTMLInputElement>(null);
    const [state, setState] = useState<FileUploadState>({
        files: initialFiles.map(file => ({
            id: file.id,
            file,
            preview: file.url,
            state: "idle",
        })),
        isDragging: false,
        errors: [],
    });

    /** @description 创建文件预览 */
    const createPreview = useCallback((file: File | FileMetadata): string | undefined => {
        if (file instanceof File) {
            return URL.createObjectURL(file);
        }
        return file.url;
    }, []);

    /** @description 生成唯一ID */
    const generateUniqueId = useCallback((file: File | FileMetadata): string => {
        if (file instanceof File) return generateUUID();
        return file.id;
    }, [generateUUID]);

    /** @description 文件校验 */
    const validateFile = useCallback(
        (file: File | FileMetadata): string | null => {
            if (file instanceof File) {
                if (file.size > maxSize) {
                    return `文件 "${file.name}" 超过最大大小 ${formatBytes(maxSize)}.`
                }
            } else {
                if (file.size > maxSize) {
                    return `文件 "${file.name}" 超过最大大小 ${formatBytes(maxSize)}.`
                }
            }

            if (accept !== "*") {
                const acceptedTypes = accept.split(",").map((type) => type.trim())
                const fileType = file instanceof File ? file.type || "" : file.mime
                const fileExtension = `.${file instanceof File ? file.name.split(".").pop() : file.name.split(".").pop()}`

                const isAccepted = acceptedTypes.some((type) => {
                    if (type.startsWith(".")) {
                        return fileExtension.toLowerCase() === type.toLowerCase()
                    }
                    if (type.endsWith("/*")) {
                        const baseType = type.split("/")[0]
                        return fileType.startsWith(`${baseType}/`)
                    }
                    return fileType === type
                })

                if (!isAccepted) {
                    return `文件 "${file instanceof File ? file.name : file.name}" 不是接受的文件类型.`
                }
            }

            return null
        },
        [accept, maxSize]
    );

    /** @description 清空文件列表 */
    const clearFiles = useCallback(() => {
        setState((prev) => {
            for (const file of prev.files) {
                if (file.preview &&
                    file.file instanceof File &&
                    file.file.type.startsWith("image/")
                ) {
                    URL.revokeObjectURL(file.preview);
                }
            };
            if (inputRef.current) {
                inputRef.current.value = "";
            }
            return {
                ...prev,
                files: [],
                errors: [],
            }
        })
    }, []);

    /** @description 将文件添加到列表中 */
    const addFiles = useCallback((newFiles: File[] | FileList) => {
        if (!newFiles || newFiles.length === 0) return;

        const newFilesArray = Array.from(newFiles);
        const errors: string[] = [];
        setState(prev => ({ ...prev, errors }));

        if (!multiple) {
            clearFiles();
        }

        if (multiple &&
            maxFiles !== Number.POSITIVE_INFINITY &&
            state.files.length + newFilesArray.length > maxFiles
        ) {
            errors.push(`最多上传 ${maxFiles} 个文件`);
            onError?.(errors);
            setState(prev => ({ ...prev, errors }));
            return;
        }

        const validFiles: FileWithPreview[] = [];
        for (const file of newFilesArray) {
            if (multiple) {
                const isDuplicate = state.files.some(
                    (existing) =>
                        existing.file.name === file.name &&
                        existing.file.size === file.size
                );
                if (isDuplicate) return;
            }

            if (file.size > maxSize) {
                errors.push(multiple ?
                    `文件队列存在文件超过 ${formatBytes(maxSize)} 的限制` :
                    `文件超过 ${formatBytes(maxSize)} 的限制`
                );
                continue;
            }

            const error = validateFile(file);
            if (error) {
                errors.push(error);
            } else {
                validFiles.push({
                    file,
                    id: generateUniqueId(file),
                    preview: createPreview(file)
                });
            }

            if (validFiles.length > 0) {
                onFilesAdded?.(validFiles);
                setState((prev) => {
                    const newFiles = !multiple ?
                        [...prev.files, ...validFiles] :
                        [...validFiles];
                    onFilesChange?.(newFiles);
                    return {
                        ...prev,
                        files: newFiles,
                        errors,
                    }
                })
            } else if (errors.length > 0) {
                onError?.(errors);
                setState(prev => ({ ...prev, errors }));
            }

            if (inputRef.current) {
                inputRef.current.value = "";
            }
        }
    }, [
        state.files,
        maxFiles,
        multiple,
        maxSize,
        validateFile,
        createPreview,
        generateUniqueId,
        clearFiles,
        onFilesChange,
        onFilesAdded,
    ]);

    /** @description 将文件从列表中移除 */
    const removeFile = useCallback(
        (id: string) => {
            setState((prev) => {
                const fileToRemove = prev.files.find((file) => file.id === id)
                if (
                    fileToRemove &&
                    fileToRemove.preview &&
                    fileToRemove.file instanceof File &&
                    fileToRemove.file.type.startsWith("image/")
                ) {
                    URL.revokeObjectURL(fileToRemove.preview)
                }

                const newFiles = prev.files.filter((file) => file.id !== id)
                onFilesChange?.(newFiles)

                return {
                    ...prev,
                    files: newFiles,
                    errors: [],
                }
            })
        },
        [onFilesChange]
    );

    /** @description 处理文件变化 */
    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    }, [addFiles]);

    /** @description 打开文件对话框 */
    const openFileDialog = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.click()
        }
    }, []);

    /** @description 获取输入框的props */
    const getInputProps = useCallback((props: InputHTMLAttributes<HTMLInputElement> = {}) => {
        return {
            ...props,
            type: "file" as const,
            onChange: handleFileChange,
            accept: props.accept || accept,
            multiple: props.multiple !== undefined ? props.multiple : multiple,
            ref: inputRef,
        }
    }, [accept, multiple]);

    /** @description 清空错误信息 */
    const clearErrors = useCallback(() => {
        setState((prev) => ({ ...prev, errors: [] }));
    }, []);

    /** @description 处理拖拽事件 */
    const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    /** @description 处理拖拽离开事件 */
    const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }
        setState((prev) => ({ ...prev, isDragging: false }));
    }, []);

    /** @description 处理拖拽进入事件 */
    const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => ({ ...prev, isDragging: true }));
    }, []);

    /** @description 处理拖拽放下事件 */
    const handleDrop = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setState((prev) => ({ ...prev, isDragging: false }));

        if (inputRef.current?.disabled) {
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            if (!multiple) {
                const file = e.dataTransfer.files[0];
                addFiles([file]);
            } else {
                addFiles(e.dataTransfer.files);
            }
        }
    }, [multiple, addFiles]);

    return [state, {
        addFiles,
        clearFiles,
        getInputProps,
        handleFileChange,
        openFileDialog,
        removeFile,
        handleDragOver,
        handleDragLeave,
        handleDragEnter,
        handleDrop,
        clearErrors,
    }];
}