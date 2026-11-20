import { clientEnvSchema } from "@/lib/schema/env/client-env.schema";
import {
    deepClone,
    deepFreeze,
} from "@/utils";

/** @description 客户端环境变量配置 */
const clientEnv = clientEnvSchema.parse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

export const clientEnvConfig = deepFreeze(deepClone(clientEnv));