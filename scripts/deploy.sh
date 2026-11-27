#!/bin/sh
# Deploy the CMS container on the test VM.
set -eu
cd "$(dirname "$0")/.."

if [ "${1:-}" != "--no-pull" ]; then
  echo "== sync"
  if ! git remote get-url upstream >/dev/null 2>&1; then
    git remote add upstream https://github.com/haryana-police/smart-CMS.git
  fi
  git pull --ff-only upstream main
  git log --oneline -1
fi

echo "== build"
sudo docker compose build cms

echo "== verify PostgreSQL connectivity"
sudo docker compose run --rm --no-deps -T cms sh -ec '
  : "${POSTGRES_DATABASE_URL:?Set POSTGRES_DATABASE_URL in the hosted Compose environment}"
  printf "SELECT 1;\n" | ./node_modules/.bin/prisma db execute --stdin --schema /app/runtime-postgresql/schema.prisma
'

echo "== restart"
if ! sudo docker compose up -d --wait --wait-timeout 120 cms; then
  sudo docker compose logs --tail=80 cms
  exit 1
fi

echo "== verify login endpoint"
curl --fail --silent --show-error --output /dev/null --write-out "app_http=%{http_code}\n" \
  http://127.0.0.1:8091/login
echo "deploy ok"
