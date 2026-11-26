# PostgreSQL migration

Generated from `prisma/schema.postgresql.prisma`.

Apply with:

```
npx prisma migrate deploy --schema prisma/postgresql/schema.prisma
```

The SQLite equivalent lives in `prisma/migrations/`.

## Current CMS data import

`full/schema.prisma` matches the current SQLite models, including `GDRecord`,
and adds relational location masters. It has its own migrations and expects
`POSTGRES_DATABASE_URL`. Use an empty test database dedicated to this import.

From the repository root:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy --schema prisma/postgresql/full/schema.prisma
$importFile = Join-Path $env:TEMP ("cms-postgres-import-" + [guid]::NewGuid() + ".sql")
python scripts/export-postgresql-import.py --output $importFile
.\node_modules\.bin\prisma.cmd db execute --schema prisma/postgresql/full/schema.prisma --file $importFile
```

Create the export while application writes are paused so the SQLite and JSON
sources represent the same point in time. The SQL export contains case and
account data. Keep it in authorized local storage. The import runs in one
transaction and checks the resulting row counts.

State, Range, District, and Police Station have separate tables. Location
Master saves update those tables in the same transaction. The app stores
accounts and other migrated JSON repositories in `ImportedJsonDocument` by
relative path. Complaints and FIRs each have one row per record in
`ComplaintRecord` and `FirRecord`, respectively. For existing PostgreSQL
databases, pause application writes while applying migrations and deploying
the new app code. The migration copies existing records to the new tables
and retains the original JSON documents as a snapshot. Attachment binaries
and browser-local data are outside the SQL export.

Complaint and FIR reporting columns are generated from each record's
payload. FIR case-diary entries, saved scrutiny records, and weekly diaries
have their own tables. Their save history records the authenticated officer
and the action. Legacy weekly diary keys stay readable when the original
owner next opens the same date range and station.

TA/DA and Kalandra offer to import eligible legacy records when opened from
the original browser profile. The officer reviews the list before importing.
Kalandra imports require a supervising officer with access to the station.
Unverified items remain available in the original browser storage.

## Run the local app against PostgreSQL

Set `POSTGRES_DATABASE_URL` in the Git-ignored `.env.local` and run
`npm run dev` after importing. The dev and build scripts generate the Prisma
client for the configured provider. When the variable is set, PostgreSQL
must be reachable. The standalone Docker image still uses its SQLite
configuration.

On the local Windows test setup, if the PostgreSQL process is stopped, start
the existing cluster before starting the app:

```powershell
$pg = Join-Path $env:LOCALAPPDATA "CMS-AK-postgres-test"
& (Join-Path $pg "pgsql/bin/pg_ctl.exe") -D (Join-Path $pg "server-data") `
  -l (Join-Path $pg "postgres.log") -o "-h 127.0.0.1 -p 55432" start
```
