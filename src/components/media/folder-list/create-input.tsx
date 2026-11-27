"use client";

import {
    InputGroup,
    InputGroupInput
} from "@/components/ui/input-group";
import { onKeys } from "@/lib";
import { MediaMutation } from "@/mutation/media.mutation";
import { useMutation } from "@tanstack/react-query";
import {
    Field,
    FieldLabel,
    FieldError,
} from "@/components/ui/field";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mediaFolderSchema, MediaFolderForm } from "@/schema/media";

interface Props {
    setShowCreateInput: (show: boolean) => void;
}

export function CreateInput({
    setShowCreateInput,
}: Props) {
    const { mutate: createFolder, isPending } = useMutation({
        ...MediaMutation.createFolder()
    });

    const form = useForm<MediaFolderForm>({
        defaultValues: {
            name: "",
        },
        resolver: zodResolver(mediaFolderSchema)
    })

    const handleCreateFolder = (data: MediaFolderForm) => {
        createFolder(data);
        setShowCreateInput(false);
    }

    return (
        <form onSubmit={form.handleSubmit(handleCreateFolder)} className="min-h-0">
            <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                    <Field>
                        <FieldLabel htmlFor={field.name} className="sr-only">Folder Name</FieldLabel>
                        <InputGroup className="border-0 shadow-none focus-visible:ring-0">
                            <InputGroupInput
                                {...field}
                                autoFocus
                                onBlur={() => setShowCreateInput(false)}
                                placeholder="Enter folder name"
                                onKeyDown={(e) => onKeys(e, form.handleSubmit(handleCreateFolder), "Enter")}
                                id={field.name}
                                disabled={isPending}
                                aria-invalid={fieldState.invalid}
                                autoComplete="off"
                            />
                        </InputGroup>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                )}
            />
        </form>
    )
}