import { config } from "dotenv";
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';
import { fileURLToPath } from 'node:url';

const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
      ? ".env"
      : ".env.development";

const contract = fileURLToPath(
  new URL("./src/prisma/**/*.prisma", import.meta.url),
).replaceAll("\\", "/");

config({ path: envFile });

export default definePrismaConfig({
  orm: ormConfig({
    contract,
    db: {
      connection: process.env['DATABASE_URL']!,
    },
  }),
});
