# Smart CMS (Next.js 16 + PostgreSQL).
# Multi-stage: build the Next app, then run `next start` on Node alpine.

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN ./node_modules/.bin/prisma generate --schema prisma/postgresql/full/schema.prisma
RUN ./node_modules/.bin/next build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8091
COPY --from=build /app /app
# Keep the schema and migration history outside the Compose data mount.
COPY --from=build /app/prisma/postgresql/full/ /app/runtime-postgresql/
EXPOSE 8091
HEALTHCHECK --interval=30s --timeout=8s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8091/ >/dev/null 2>&1 || exit 1
CMD ["sh", "-c", "test -n \"$POSTGRES_DATABASE_URL\" && ./node_modules/.bin/prisma migrate deploy --schema /app/runtime-postgresql/schema.prisma && exec ./node_modules/.bin/next start -p 8091"]
