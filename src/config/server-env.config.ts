import "server-only";

import { serverEnvSchema } from "@/schema/env/server-env.schema";
import { deepClone, deepFreeze } from "@/lib";

/** @description 服务器环境变量配置 */
const serverEnv = serverEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    ENV: process.env.NODE_ENV,
    // QINIU_ACCESS_KEY: process.env.QINIU_ACCESS_KEY,
    // QINIU_SECRET_KEY: process.env.QINIU_SECRET_KEY,
    // QINIU_DOMAIN: process.env.QINIU_DOMAIN,
    // QINIU_BUCKET: process.env.QINIU_BUCKET,
});

export const serverEnvConfig = deepFreeze(deepClone(serverEnv));