import { clientEnv, ClientEnv } from "@/lib/schema/client-env.schema";
import { deepFreeze, deepClone } from "@/lib/utils";

export const clientConfig: ClientEnv = deepClone(deepFreeze(clientEnv));