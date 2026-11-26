CREATE TABLE "TaDaBill" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "ownerId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
  "payload" TEXT NOT NULL
);
CREATE INDEX "TaDaBill_ownerId_updatedAt_idx" ON "TaDaBill" ("ownerId", "updatedAt");

CREATE TABLE "TaDaBillLine" (
  "billId" TEXT NOT NULL REFERENCES "TaDaBill" ("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "form" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "payload" TEXT NOT NULL,
  PRIMARY KEY ("billId", "form", "position")
);

CREATE TABLE "TaDaBillEvent" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "billId" TEXT NOT NULL REFERENCES "TaDaBill" ("id") ON UPDATE CASCADE ON DELETE RESTRICT,
  "officerId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "timestamp" TEXT NOT NULL
);
