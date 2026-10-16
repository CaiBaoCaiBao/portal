"use client";
import { useFileUpload } from "@/hooks/use-file-upload";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
export function FileUploadLab() {
    const [state, action] = useFileUpload({
        maxSize: 2 * 1024 * 1024,
        multiple: true,
        onFilesAdded(files) {
            console.log("onFilesAdded", files);
        },
        onFilesChange(files) {
            console.log("onFilesChange", files);
        },
    });
    return (
        <div>
            <FileUpload
                getInputProps={action.getInputProps}
                handleDragOver={action.handleDragOver}
                handleDragLeave={action.handleDragLeave}
                handleDragEnter={action.handleDragEnter}
                handleDrop={action.handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer"
                openFileDialog={action.openFileDialog}
            >
                Click to upload file
                <div>
                    {state.errors.map((error, errorIndex) => {
                        return (
                            <div key={errorIndex} className="text-red-500">{error}</div>
                        )
                    })}
                </div>
            </FileUpload>
            <div>
                {state.files.map((file) => {
                    return (
                        <div key={file.id} className="relative">
                            <div>{file.file.name}</div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2"
                                onClick={() => action.removeFile(file.id)}
                            >
                                <X />
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
