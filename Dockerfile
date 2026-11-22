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
EXPOSE 8091
HEALTHCHECK --interval=30s --timeout=8s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8091/ >/dev/null 2>&1 || exit 1
CMD ["npx", "next", "start", "-p", "8091"]
