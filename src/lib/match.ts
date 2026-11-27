import type { MatchModule } from "@/types/globals.type";

const REGEX_LITERAL = /^\/([\s\S]+)\/([a-z]*)$/;

function toRegExp(pattern: string): RegExp | null {
    const literal = REGEX_LITERAL.exec(pattern);
    try {
        if (literal) {
            return new RegExp(literal[1], literal[2]);
        }
        return new RegExp(pattern);
    } catch {
        return null;
    }
}

/**
 * @description 按指定方式检查内容是否匹配目标。
 * @param content 待检查的内容。
 * @param pattern 匹配目标。regex 支持 `/pattern/flags` 或原始正则。
 * @param match 匹配方式。
 * @returns 是否匹配。
 */
export function isMatch(content: string, pattern: string, match: MatchModule = "exact"): boolean {
    switch (match) {
        case "prefix":
            return content.startsWith(pattern);
        case "exact":
            return content === pattern;
        case "suffix":
            return content.endsWith(pattern);
        case "contains":
            return content.includes(pattern);
        case "regex":
            return toRegExp(pattern)?.test(content) ?? false;
        default: {
            const _exhaustive: never = match;
            return _exhaustive;
        }
    }
}
