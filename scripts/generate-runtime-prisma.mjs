import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import nextEnv from "@next/env";

const require = createRequire(import.meta.url);
nextEnv.loadEnvConfig(process.cwd(), process.argv.includes("--dev"));
const postgres = process.env.POSTGRES_DATABASE_URL;
const schema = postgres ? "prisma/postgresql/full/schema.prisma" : "prisma/schema.prisma";
const result = spawnSync(
  process.execPath,
  [require.resolve("prisma"), "generate", "--schema", schema],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
