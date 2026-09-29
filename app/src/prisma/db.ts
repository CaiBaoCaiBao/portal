import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };
import { config } from "dotenv";

const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
      ? ".env"
      : ".env.development";
      
config({ path: envFile, override: true });

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
