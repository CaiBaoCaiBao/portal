import {
    flattenError,
    z
} from "zod";
import { ValidationError } from "./app-error";

export function mapZodError(error: unknown): ValidationError | null {
    if (!(error instanceof z.ZodError)) return null;

    const flattened = flattenError(error);
    return new ValidationError("校验失败", {
        formErrors: flattened.formErrors,
        fieldErrors: flattened.fieldErrors,
    });
}
