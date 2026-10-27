-- CreateTable
CREATE TABLE "FirFinalReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firId" TEXT NOT NULL,
    "firNumber" TEXT NOT NULL,
    "policeStation" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "reportNumber" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "reportCategory" TEXT NOT NULL,
    "finalReportReason" TEXT NOT NULL,
    "investigationStatus" TEXT NOT NULL,
    "chargeSheetType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'SAVED',
    "formDataJson" TEXT NOT NULL,
    "firSnapshotJson" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "sentToShoAt" DATETIME,
    "sentToShoBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FirFinalReportAccused" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "accusedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,
    CONSTRAINT "FirFinalReportAccused_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FirFinalReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FirFinalReportEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "firId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FirFinalReportEvent_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FirFinalReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "FirFinalReport_firId_idx" ON "FirFinalReport"("firId");

-- CreateIndex
CREATE INDEX "FirFinalReport_reportType_chargeSheetType_idx" ON "FirFinalReport"("reportType", "chargeSheetType");

-- CreateIndex
CREATE INDEX "FirFinalReport_policeStation_state_idx" ON "FirFinalReport"("policeStation", "state");

-- CreateIndex
CREATE INDEX "FirFinalReportAccused_accusedId_action_idx" ON "FirFinalReportAccused"("accusedId", "action");

-- CreateIndex
CREATE INDEX "FirFinalReportAccused_reportId_idx" ON "FirFinalReportAccused"("reportId");

-- CreateIndex
CREATE INDEX "FirFinalReportEvent_firId_createdAt_idx" ON "FirFinalReportEvent"("firId", "createdAt");

-- CreateIndex
CREATE INDEX "FirFinalReportEvent_reportId_version_idx" ON "FirFinalReportEvent"("reportId", "version");
