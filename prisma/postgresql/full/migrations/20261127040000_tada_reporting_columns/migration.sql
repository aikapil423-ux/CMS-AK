ALTER TABLE "TaDaBill" ADD COLUMN "policeStation" TEXT;
ALTER TABLE "TaDaBill" ADD COLUMN "district" TEXT;
ALTER TABLE "TaDaBill" ADD COLUMN "registrationNumber" TEXT;
ALTER TABLE "TaDaBill" ADD COLUMN "registrationDate" TEXT;
CREATE INDEX "TaDaBill_station_date_idx" ON "TaDaBill" ("district", "policeStation", "registrationDate");
