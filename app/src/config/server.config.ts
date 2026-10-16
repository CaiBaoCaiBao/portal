import "server-only";

import { serverEnv, ServerEnv } from "@/lib/schema/server-env.schema";
import { deepFreeze, deepClone } from "@/lib/utils";

export const serverConfig: ServerEnv = deepClone(deepFreeze(serverEnv));