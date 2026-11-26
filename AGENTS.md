<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Repository Guidelines
- **Primary Git Repository**: `https://github.com/haryana-police/smart-CMS.git` (`upstream/main`).
- Always pull from and push to `upstream/main` (`https://github.com/haryana-police/smart-CMS.git`). Local branch `main` tracks `upstream/main`.

# Database Policy (PostgreSQL Only)
- **PostgreSQL Only — NO SQLite:** This project strictly uses **PostgreSQL** (`prisma/postgresql/full/schema.prisma` and `prisma/schema.prisma` with `provider = "postgresql"`).
- **NEVER** use SQLite, `provider = "sqlite"`, `prisma/dev.db`, `file:` datasource URLs, or local JSON file fallbacks in `runtimeJsonStore.ts`.
- Always require `POSTGRES_DATABASE_URL` (`postgresql://...`) in `.env` / `.env.local` for runtime, migrations, and Prisma Client generation.

