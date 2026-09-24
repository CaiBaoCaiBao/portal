import "server-only";
import { serverEnv,ServerEnv } from "@/lib/schema/env/server-env.schema";

export const serverEnvConfig = serverEnv as ServerEnv;
