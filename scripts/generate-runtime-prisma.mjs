import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import nextEnv from "@next/env";

const require = createRequire(import.meta.url);
nextEnv.loadEnvConfig(process.cwd(), process.argv.includes("--dev"));

const postgresUrl = process.env.POSTGRES_DATABASE_URL || "";
if (!postgresUrl || !/^postgres(ql)?:\/\//i.test(postgresUrl)) {
  console.error(
    "[prisma] ERROR: POSTGRES_DATABASE_URL must be set to a valid PostgreSQL connection string (postgresql://...). SQLite is disabled in this project.",
  );
  process.exit(1);
}

const schema = "prisma/postgresql/full/schema.prisma";
const result = spawnSync(
  process.execPath,
  [require.resolve("prisma"), "generate", "--schema", schema],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
