# Smart CMS (Next.js 16 + Prisma/SQLite) — production container for the 18k band.
# Multi-stage: build the Next app, then run `next start` on Node alpine.

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL="file:./dev.db"
ENV DATABASE_URL="file:./dev.db"
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Prisma client + SQLite schema (file:./dev.db -> prisma/dev.db)
RUN npx prisma generate && npx prisma db push
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8091 DATABASE_URL="file:./dev.db"
COPY --from=build /app /app
# Keep the current schema available when Compose mounts a volume over /app/prisma.
COPY --from=build /app/prisma/schema.prisma /app/runtime-schema.prisma
EXPOSE 8091
HEALTHCHECK --interval=30s --timeout=8s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8091/ >/dev/null 2>&1 || exit 1
# Keep the schema next to the database so relative SQLite URLs resolve as usual.
# Refuse to start if Prisma cannot sync the schema without accepting data loss.
CMD ["sh", "-c", "cp /app/runtime-schema.prisma /app/prisma/.runtime-schema.prisma && ./node_modules/.bin/prisma db push --schema /app/prisma/.runtime-schema.prisma --skip-generate && exec ./node_modules/.bin/next start -p 8091"]
