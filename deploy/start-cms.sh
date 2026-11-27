#!/bin/sh
set -eu

: "${POSTGRES_DATABASE_URL:?Set POSTGRES_DATABASE_URL before starting CMS}"
./node_modules/.bin/prisma migrate deploy --schema /app/runtime-postgresql/schema.prisma

seed_file=${CMS_ACCOUNTS_SEED_FILE:-/run/cms-bootstrap/accounts-seed.json}
if [ -f "$seed_file" ] || [ -n "${CMS_ACCOUNTS_SEED_FILE:-}" ]; then
  CMS_ACCOUNTS_SEED_FILE="$seed_file" node scripts/seed-accounts.mjs --bootstrap
fi

exec ./node_modules/.bin/next start -p 8091
