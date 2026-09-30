import { ZodError, type core } from "zod";
import { BadRequestError, type AppError } from "./app-error";
import type { SystemModule } from "./codes";

type ZodIssue = core.$ZodIssue;

function collectIssues(issues: readonly ZodIssue[], prefix: PropertyKey[] = []) {
    const fields: { path: string; message: string }[] = [];

    for (const issue of issues) {
        const path = [...prefix, ...issue.path];

        if (issue.code === "invalid_union" && issue.errors.length > 0) {
            for (const branch of issue.errors) {
                fields.push(...collectIssues(branch, path));
            }
            continue;
        }

        if (
            (issue.code === "invalid_key" || issue.code === "invalid_element") &&
            issue.issues.length > 0
        ) {
            fields.push(...collectIssues(issue.issues, path));
            continue;
        }

        fields.push({
            path: path.map(String).join("."),
            message: issue.message,
        });
    }

    return fields;
}

export function mapZodError(error: unknown, module: SystemModule): AppError | null {
    if (!(error instanceof ZodError)) {
        return null;
    }

    return new BadRequestError("校验失败", module, {
        cause: error,
        details: collectIssues(error.issues),
    });
}