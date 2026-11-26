BEGIN;
CREATE TABLE "WeeklyDiaryRecord" (
  "key" TEXT PRIMARY KEY,
  "ownerId" TEXT,
  "station" TEXT NOT NULL,
  "fromDate" TEXT NOT NULL,
  "toDate" TEXT NOT NULL,
  "revision" TEXT,
  "payload" JSONB NOT NULL
);
CREATE TABLE "ScrutinyRecord" (
  "id" TEXT PRIMARY KEY,
  "firId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "revision" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "payload" JSONB NOT NULL
);
CREATE INDEX "ScrutinyRecord_ownerId_updatedAt_idx" ON "ScrutinyRecord" ("ownerId", "updatedAt");
CREATE INDEX "ScrutinyRecord_firId_idx" ON "ScrutinyRecord" ("firId");

CREATE TABLE "CaseDocumentEvent" (
  "id" BIGSERIAL PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "officerId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CaseDocumentEvent_kind_recordId_idx" ON "CaseDocumentEvent" ("kind", "recordId");

INSERT INTO "WeeklyDiaryRecord" ("key","station","fromDate","toDate","revision","payload")
SELECT path, payload->>'station', payload->>'from', payload->>'to', payload->>'revision', payload
FROM "ImportedJsonDocument" WHERE path ~ '^weekly-diary/[a-f0-9]{64}\.json$';

INSERT INTO "ScrutinyRecord" ("id","firId","ownerId","revision","updatedAt","payload")
SELECT payload->>'id', payload->>'firId', payload->>'ownerId', payload->>'revision', payload->>'updatedAt', payload
FROM "ImportedJsonDocument" WHERE path ~ '^scrutiny-records/[a-f0-9]{64}\.json$';

ALTER TABLE "ScrutinyRecord" ADD CONSTRAINT "ScrutinyRecord_firId_fkey"
  FOREIGN KEY ("firId") REFERENCES "FirRecord" ("id") ON UPDATE CASCADE ON DELETE RESTRICT NOT VALID;
COMMIT;
