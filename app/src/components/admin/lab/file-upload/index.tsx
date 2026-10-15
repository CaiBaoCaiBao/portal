"use client";
import { useFileUpload } from "@/hooks/use-file-upload";
import { FileUpload } from "@/components/file-upload";
export function FileUploadLab() {
    const [state, action] = useFileUpload();
    return (
        <div>
            <FileUpload
                getInputProps={action.getInputProps}
                className="border-2 border-dashed border-gray-300 rounded-md p-4 cursor-pointer"
                openFileDialog={action.openFileDialog}
            >
                Click to upload file
            </FileUpload>
        </div>
    );
}
