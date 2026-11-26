BEGIN;

ALTER TABLE "ComplaintRecord"
  ADD COLUMN "district" TEXT GENERATED ALWAYS AS (payload->>'district') STORED,
  ADD COLUMN "policeStation" TEXT GENERATED ALWAYS AS (payload->>'policeStation') STORED,
  ADD COLUMN "registrationNumber" TEXT GENERATED ALWAYS AS (payload->>'complaintNumber') STORED,
  ADD COLUMN "registrationDate" TEXT GENERATED ALWAYS AS (LEFT(payload->>'createdAt', 10)) STORED,
  ADD COLUMN "registrationYear" TEXT GENERATED ALWAYS AS (LEFT(payload->>'createdAt', 4)) STORED,
  ADD COLUMN "status" TEXT GENERATED ALWAYS AS (payload->>'status') STORED;

CREATE INDEX "ComplaintRecord_district_policeStation_registrationDate_idx"
  ON "ComplaintRecord" ("district", "policeStation", "registrationDate");
CREATE INDEX "ComplaintRecord_status_idx" ON "ComplaintRecord" ("status");
CREATE UNIQUE INDEX "ComplaintRecord_registration_identity_key"
  ON "ComplaintRecord" ("district", "policeStation", "registrationYear", "registrationNumber");

ALTER TABLE "FirRecord"
  ADD COLUMN "district" TEXT GENERATED ALWAYS AS (payload->>'district') STORED,
  ADD COLUMN "policeStation" TEXT GENERATED ALWAYS AS (payload->>'policeStation') STORED,
  ADD COLUMN "registrationNumber" TEXT GENERATED ALWAYS AS (payload->>'firNumber') STORED,
  ADD COLUMN "registrationDate" TEXT GENERATED ALWAYS AS (LEFT(payload->>'firDate', 10)) STORED,
  ADD COLUMN "registrationYear" TEXT GENERATED ALWAYS AS (LEFT(payload->>'firDate', 4)) STORED,
  ADD COLUMN "status" TEXT GENERATED ALWAYS AS (payload->>'status') STORED;

CREATE INDEX "FirRecord_district_policeStation_registrationDate_idx"
  ON "FirRecord" ("district", "policeStation", "registrationDate");
CREATE INDEX "FirRecord_status_idx" ON "FirRecord" ("status");
CREATE UNIQUE INDEX "FirRecord_registration_identity_key"
  ON "FirRecord" ("district", "policeStation", "registrationYear", "registrationNumber");

COMMIT;
