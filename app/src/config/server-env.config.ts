import "server-only";

import { ServerEnv, serverEnv } from "@/lib/schema/env/server-env.schema";
import { deepClone, deepFreeze } from "@/lib/utils";

export const serverEnvConfig = deepFreeze(deepClone(serverEnv)) as ServerEnv;