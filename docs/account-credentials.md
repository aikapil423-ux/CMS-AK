# Account credentials and the user store

## Source of truth

- **Postgres `User` table** owns identity and credentials: `pno`, `fullName`, `rank`, `role`,
  `status`, `mobileNumber`, `email`, `unitId` and `passwordHash`.
- **`PoliceUnit`** owns the posting referenced by `User.unitId`. A missing unit is created
  automatically when an account is added through the admin screen.
- **`ImportedJsonDocument` (`accounts-master-store.json`)** holds *non-secret* master profile
  extensions only: designation, rank display, authorized districts/stations, zone, special
  allocations, jurisdiction type, and similar UI fields.
- No plaintext PIN is stored anywhere. A credential is always a scrypt hash in the format
  `salt:hex-hash`, verified with a constant-time comparison in `src/lib/serverSession.ts`.
- The legacy plaintext sample property has been removed from the type, the account service,
  the runtime stores and the login fallback. Do not reintroduce it in any form.

File/SQLite mode remains a local development fallback. Accounts created there keep their hash
in the JSON store because there is no Postgres `User` table in that mode; the committed seed
carries no credentials at all, and no mode ever stores a plaintext PIN.

## Login and session flow

1. `validLogin()` looks up `User` by `pno` first and verifies `passwordHash` with scrypt.
2. `baseSessionUser()` and `viewableOfficer()` also resolve from `User` first; JSON profiles
   and demo personas are only a fallback for a principal that is not in the table.
3. `accountMasterService` merges the JSON profile onto the `User` row for admin screens and
   the officer switcher. Every create, update, status change, password reset and delete writes
   to the `User` table as well as the profile store.
4. Audit snapshots strip credential fields before they are written.

Local zero-click admin login (`CMS_LOCAL_AUTO_ADMIN=true`) is gated by
`NODE_ENV !== 'production'`, demo mode and same-origin checks. It must stay unset in
operational deployments.

## Reproducible deploy seed

Credentials are not committed. Export a hash-only seed from a known-good database once, keep the
file outside git, and apply it on every fresh deployment:

```powershell
# 1. Generate the Prisma client for the target (Postgres) schema.
npm run prisma:generate

# 2. Export from the database that already has the correct accounts.
npm run accounts:seed:export
# Default output: prisma/accounts-seed.json
# Custom path:   $env:CMS_ACCOUNTS_SEED_FILE = 'C:\secure\accounts-seed.json'

# 3. On the target deployment, after migrations:
npm run prisma:generate
npm run accounts:seed
```

`POSTGRES_DATABASE_URL` is required. The script refuses to run without it, validates that every
account has a well-formed `passwordHash`, and rejects any seed containing a plaintext PIN or
password field. It upserts `PoliceUnit` rows (parents first), upserts users by `pno`, and writes
only non-secret profiles to `accounts-master-store.json`. Re-running it is idempotent: hashes
from the seed are authoritative, so keep the seed encrypted and access-controlled.

The seed is ignored by git via `*accounts-seed*.json`. If you place it elsewhere, add that exact
path to your own ignore rules or store it in a secret manager.

## Guards

- `npm run test:credentials` scans tracked source and JSON for plaintext credential fields.
- `.githooks/pre-commit` runs equivalent checks on staged content and blocks staging runtime
  stores or account seed exports.
- Run the guard test in CI alongside `npx tsc --noEmit` before build/deploy.

If a deployed database has users but no matching JSON profiles, the service derives a minimal
profile from the `User`/`PoliceUnit` rows; the app still authenticates and displays the officer.
