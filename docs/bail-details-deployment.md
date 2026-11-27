# FIR Bail Details

The FIR profile header opens Bail Details. The form includes Bail Details, Surety Details, personal information, age information, present/permanent address, and an optional PDF/JPG/PNG attachment up to 5 MB. Choose a saved entry to view or edit it; Add New creates another application. Saving records an application, not a court bail decision, and does not change accused custody status.

Data is stored in FirBailDetail, with FIR/accused IDs, structured form JSON, document content, officer attribution, timestamps, and an optimistic version. Repeated initial submissions use the same UUID and do not duplicate the record. Conflicting edits return HTTP 409.

Apply migrations for the full PostgreSQL schema before starting the app:

```sh
npx prisma migrate deploy --schema prisma/postgresql/full/schema.prisma
npx prisma generate --schema prisma/postgresql/full/schema.prisma
```

The PostgreSQL migration already includes `FirBailDetail` and its FIR/accused index.

Verification uses an isolated PostgreSQL schema. Set `POSTGRES_TEST_DATABASE_URL`
to use a separate test database, or use the configured local `POSTGRES_DATABASE_URL`.

```sh
node --test tests/bail-details.test.cjs
npx tsc --noEmit --incremental false
```
