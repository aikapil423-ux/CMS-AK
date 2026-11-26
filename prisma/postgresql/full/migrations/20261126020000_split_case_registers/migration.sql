BEGIN;

CREATE TABLE "ComplaintRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" BIGINT NOT NULL,
    "payload" JSONB NOT NULL
);

INSERT INTO "ComplaintRecord" ("id", "position", "payload")
SELECT record->>'id', ordinal, record
FROM "ImportedJsonDocument"
CROSS JOIN LATERAL jsonb_array_elements(payload) WITH ORDINALITY AS entries(record, ordinal)
WHERE path = 'complaints-store.json';

CREATE TABLE "FirRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "position" BIGINT NOT NULL,
    "payload" JSONB NOT NULL
);

INSERT INTO "FirRecord" ("id", "position", "payload")
SELECT record->>'id', ordinal, record
FROM "ImportedJsonDocument"
CROSS JOIN LATERAL jsonb_array_elements(payload) WITH ORDINALITY AS entries(record, ordinal)
WHERE path = 'firs-store.json';

COMMIT;
