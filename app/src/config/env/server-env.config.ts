import "server-only";
import { serverEnv, ServerEnv } from "@/lib/schema/env/server-env.schema";
import { deepClone, deepFrozen } from "@/lib/utils";


export const serverEnvConfig = deepFrozen(deepClone(serverEnv)) as ServerEnv;
