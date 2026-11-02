# Authorized local data snapshot — 2026-11-02

The user explicitly authorized publishing case data to the public `main` branches of `haryana-police/smart-CMS` and `aikapil423-ux/CMS-AK` after both repository visibilities were verified.

`prisma/local-data-manifest.json` inventories the disk/backend snapshot with file sizes and SHA-256 checksums. It includes 8 complaint records, 3 FIR records, 38 processed-evidence records, the telecom store, 51 uploaded/compressed evidence files, 2 saved case analyses, the GD seed export and a consistent SQLite snapshot. The current SQLite database has 8 GD records and no user/login rows. Environment files, API keys and login credentials are excluded.

Browser-only localStorage and IndexedDB records are **not** part of this snapshot. They need a separate browser export if present. This publication does not delete local files.

## On the hosted server

Git publication is not a completed server-data migration. Before changing live data, back up its current database, JSON stores, uploads and analysis folder.

1. Fetch/review the data commit and compare the manifest with the running app's actual working directory and persistent volumes. A deployment may keep runtime data outside the Git checkout.
2. Compare local/server IDs, station/year numbering and persistence versions. Merge server-only records and investigate conflicting records. Do not force-replace live stores, reset the database or use `git reset --hard` to discard runtime data.
3. The app reads complaints/FIR/evidence/telecom from their `prisma/*-store.json` files and originals from `prisma/storage/`. Saved graph/contradiction output is in `prisma/case-analysis/`.
4. `prisma/local-data.snapshot.sqlite` is a snapshot artifact, **not** the live `prisma/dev.db`. Do not blindly rename it over the server database. `prisma/seed-data.json` contains the SQLite-backed GD records; use the normal reviewed seed/import process after checking conflicts and preserving server credentials.
5. Restart using the deployment's existing process configuration if needed. Sign in with the same officer/station scope and verify complaint, FIR, evidence and GD counts through the protected application APIs.

No hosted database, live JSON file or server login setting was modified by this snapshot publication.
