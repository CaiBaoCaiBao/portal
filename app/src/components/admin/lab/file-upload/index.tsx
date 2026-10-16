"use client";
import { useFileUpload } from "@/hooks/use-file-upload";
import { FileUpload } from "@/components/file-upload";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getUploadCredential } from "@/lib/actions/media.action";
import { MediaService } from "@/lib/services/media.service";
export function FileUploadLab() {
    const [state, action] = useFileUpload({
        maxSize: 2 * 1024 * 1024,
        multiple: true,
        async onFilesAdded(files) {
            for (const item of files) {
                if (!(item.file instanceof File)) continue;
                const credential = await getUploadCredential(item.file.name);
                const res = await MediaService.uploadToQiniu(item.file, credential);
                action.updateFilePreview(item.id, res.url);
            }
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
                            <div>{file.preview}</div>
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
