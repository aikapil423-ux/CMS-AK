CREATE TABLE "KalandraRecord" (
  "id" TEXT PRIMARY KEY,
  "ownerId" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "policeStation" TEXT NOT NULL,
  "registrationDate" TEXT NOT NULL,
  "registrationYear" TEXT NOT NULL,
  "registrationNumber" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "archived" BOOLEAN NOT NULL DEFAULT FALSE,
  "payload" JSONB NOT NULL
);
CREATE UNIQUE INDEX "KalandraRecord_station_year_sequence_key"
  ON "KalandraRecord" ("district", "policeStation", "registrationYear", "sequence");
CREATE UNIQUE INDEX "KalandraRecord_station_number_key"
  ON "KalandraRecord" ("district", "policeStation", "registrationNumber");
CREATE INDEX "KalandraRecord_station_date_idx" ON "KalandraRecord" ("district", "policeStation", "registrationDate");
