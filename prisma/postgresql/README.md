# PostgreSQL setup

The application uses `prisma/postgresql/full/schema.prisma` and requires
`POSTGRES_DATABASE_URL`. Configure the connection before running:

```powershell
.\node_modules\.bin\prisma.cmd migrate deploy --schema prisma/postgresql/full/schema.prisma
```

Fresh environments can restore an authorized PostgreSQL backup. Use a fresh
database for a full restore and verify the restored records before switching the app.

## Account credentials seed

Account identity and credentials live in the relational `User` table, not in the
JSON store. JSON (`accounts-master-store.json`) holds only non-secret profile
fields, and no plaintext PIN is stored anywhere.

After migrations, seed accounts into a fresh deployment with the hash-only seed:

```powershell
npm run prisma:generate
$env:CMS_ACCOUNTS_SEED_FILE = 'C:\secure\accounts-seed.json'  # optional; default prisma/accounts-seed.json
npm run accounts:seed
```

The seed file is gitignored and must be exported from an authorized database
with `npm run accounts:seed:export`. `POSTGRES_DATABASE_URL` is required; the
script validates hashes and rejects plaintext credential fields. See
`docs/account-credentials.md` for the full flow and guardrails.
The import runs in one
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
PostgreSQL client. The Docker container also requires a reachable PostgreSQL
connection via its runtime environment. It applies the full schema migrations
before starting Next.js.

On the local Windows test setup, if the PostgreSQL process is stopped, start
the existing cluster before starting the app:

```powershell
$pg = Join-Path $env:LOCALAPPDATA "CMS-AK-postgres-test"
& (Join-Path $pg "pgsql/bin/pg_ctl.exe") -D (Join-Path $pg "server-data") `
  -l (Join-Path $pg "postgres.log") -o "-h 127.0.0.1 -p 55432" start
```
