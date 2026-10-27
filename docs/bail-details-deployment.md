# FIR Bail Details

The FIR profile header opens Bail Details. The form includes Bail Details, Surety Details, personal information, age information, present/permanent address, and an optional PDF/JPG/PNG attachment up to 5 MB. Choose a saved entry to view or edit it; Add New creates another application. Saving records an application, not a court bail decision, and does not change accused custody status.

Data is stored in FirBailDetail, with FIR/accused IDs, structured form JSON, document content, officer attribution, timestamps, and an optimistic version. Repeated initial submissions use the same UUID and do not duplicate the record. Conflicting edits return HTTP 409.

For an existing SQLite database, run:

```sh
npx prisma db execute --file prisma/bail-details.sqlite.sql --schema prisma/schema.prisma
npx prisma generate
```

The setup SQL only creates the bail table and index. It does not reset other tables. The local database has already received this addition. If Prisma generation reports a locked Windows engine DLL, close the app's development server before regenerating, then restart it. Runtime persistence uses parameterized Prisma SQL and also works with an already running Prisma client.

For PostgreSQL, include the FirBailDetail model from schema.postgresql.prisma in the normal schema migration process. Do not run the SQLite setup script against PostgreSQL.

The API follows the application's current demo officer identity model (x-cms-user), with FIR visibility checks. This is not a signed production login session; production authentication must replace the demo identity model across the application. FIR metadata is still supplied by the local FIR store, as in the existing FIR workflows.

Verification: node --test tests/bail-details.test.cjs; npx tsc --noEmit --incremental false.
