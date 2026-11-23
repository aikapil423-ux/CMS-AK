#!/bin/sh
# Deploy the CMS container on the test VM.
#
#   sh scripts/deploy.sh            # sync to origin/main, rebuild, restart
#   sh scripts/deploy.sh --no-pull  # rebuild the current checkout only
#
# Why the pruning step exists: if a `docker compose up --force-recreate` is
# interrupted, compose leaves a "<hash>_18k-cms" container behind and every
# later recreate fails with `Conflict. The container name ... is already in use`.
set -e
cd "$(dirname "$0")/.."

if [ "$1" != "--no-pull" ]; then
  echo "== sync"
  git fetch origin main -q
  git reset --hard origin/main
  git log --oneline -1
fi

echo "== remove current container"
# Removing it by name is safe: all state lives in the 18k-cms-db volume. Compose's
# rename-then-create step is what produces the "<hash>_18k-cms" leftovers, so we
# clear the field before asking compose to create the new container.
sudo docker rm -f 18k-cms >/dev/null 2>&1 || true
for n in $(sudo docker ps -a --format '{{.Names}}' | grep -E '_18k-cms$' || true); do
  echo "   removing leftover $n"
  sudo docker rm -f "$n" >/dev/null
done

echo "== build"
sudo docker compose build cms 2>&1 | tail -3

echo "== restart"
sudo docker compose up -d cms 2>&1 | tail -3

echo "== wait for health"
i=0
while [ $i -lt 30 ]; do
  status=$(sudo docker inspect 18k-cms --format '{{.State.Health.Status}}' 2>/dev/null || echo missing)
  [ "$status" = "healthy" ] && break
  sleep 2
  i=$((i+1))
done

running=$(sudo docker inspect 18k-cms --format '{{.Image}}' 2>/dev/null || echo none)
latest=$(sudo docker image inspect 18k-cms:latest --format '{{.Id}}')
echo "health=$status"
echo "running_image=$running"
echo "latest_image =$latest"
[ "$running" = "$latest" ] || { echo "!! container is NOT on the freshly built image"; exit 1; }
curl -s -o /dev/null -w "app_http=%{http_code}\n" http://127.0.0.1:8091/login
echo "deploy ok"
