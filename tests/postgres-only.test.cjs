const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

test("Prisma schemas and migration lock strictly enforce PostgreSQL only", () => {
  const mainSchema = fs.readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
  const pgFullSchema = fs.readFileSync(path.join(root, "prisma", "postgresql", "full", "schema.prisma"), "utf8");
  const migrationLock = fs.readFileSync(path.join(root, "prisma", "migrations", "migration_lock.toml"), "utf8");
  const runtimeGenerator = fs.readFileSync(path.join(root, "scripts", "generate-runtime-prisma.mjs"), "utf8");

  assert.match(mainSchema, /provider\s*=\s*"postgresql"/);
  assert.doesNotMatch(mainSchema, /provider\s*=\s*"sqlite"/);
  assert.match(pgFullSchema, /provider\s*=\s*"postgresql"/);
  assert.match(migrationLock, /provider\s*=\s*"postgresql"/);
  assert.doesNotMatch(migrationLock, /provider\s*=\s*"sqlite"/);
  assert.doesNotMatch(runtimeGenerator, /prisma\/schema\.prisma/);
  const dockerfile = fs.readFileSync(path.join(root, "Dockerfile"), "utf8");
  const startup = fs.readFileSync(path.join(root, "deploy", "start-cms.sh"), "utf8");
  assert.match(dockerfile, /deploy\/start-cms\.sh/);
  assert.match(startup, /POSTGRES_DATABASE_URL/);
  assert.match(startup, /prisma migrate deploy[\s\S]*seed-accounts\.mjs --bootstrap[\s\S]*next start/);
  assert.doesNotMatch(dockerfile + startup, /file:\.\/dev\.db|prisma db push/);
  for (const legacyFile of ["dev.db", "local-data.snapshot.sqlite", "bail-details.sqlite.sql"]) {
    assert.equal(fs.existsSync(path.join(root, "prisma", legacyFile)), false);
  }
});
