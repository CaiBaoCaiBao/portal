import "server-only";

import { serverEnvConfig } from "@/config/server-env.config";
import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './contract.d.js';
import contractJson from './contract.json' with { type: 'json' };
import type { PostgresQueryMembers } from "@prisma/orm-postgres/runtime";

export type Tx = PostgresQueryMembers<Contract>;

export const contract = contractFromJson<Contract>(contractJson);

export const db = postgres({
  contract,
  url: serverEnvConfig.dataSource.url,
});
