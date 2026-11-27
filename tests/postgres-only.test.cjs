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
  assert.match(dockerfile, /prisma migrate deploy/);
  assert.match(dockerfile, /POSTGRES_DATABASE_URL/);
  assert.doesNotMatch(dockerfile, /file:\.\/dev\.db|prisma db push/);
  for (const legacyFile of ["dev.db", "local-data.snapshot.sqlite", "bail-details.sqlite.sql"]) {
    assert.equal(fs.existsSync(path.join(root, "prisma", legacyFile)), false);
  }
});
