CREATE TABLE IF NOT EXISTS "FirBailDetail" (
 "id" TEXT NOT NULL PRIMARY KEY, "firId" TEXT NOT NULL, "accusedId" TEXT NOT NULL,
 "policeStation" TEXT NOT NULL, "district" TEXT NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
 "firSnapshotJson" TEXT NOT NULL, "dataJson" TEXT NOT NULL, "createdBy" TEXT NOT NULL, "updatedBy" TEXT NOT NULL,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL
);
CREATE INDEX IF NOT EXISTS "FirBailDetail_firId_accusedId_idx" ON "FirBailDetail"("firId", "accusedId");
