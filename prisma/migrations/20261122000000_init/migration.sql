-- CreateTable
CREATE TABLE "PoliceUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "contactPhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PoliceUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PoliceUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pno" TEXT NOT NULL,
    "beltNumber" TEXT,
    "fullName" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PoliceUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaintNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'WALK_IN_STATION',
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "incidentDate" DATETIME,
    "incidentPlace" TEXT NOT NULL,
    "incidentLandmark" TEXT,
    "incidentDetails" TEXT NOT NULL,
    "complainantName" TEXT NOT NULL,
    "complainantFatherSpouse" TEXT,
    "complainantGender" TEXT NOT NULL,
    "complainantAge" INTEGER,
    "complainantMobile" TEXT NOT NULL,
    "complainantAltPhone" TEXT,
    "complainantAadhaar" TEXT,
    "complainantAddress" TEXT NOT NULL,
    "complainantCity" TEXT NOT NULL,
    "complainantDistrict" TEXT NOT NULL,
    "complainantState" TEXT NOT NULL DEFAULT 'Haryana',
    "accusedDetails" TEXT,
    "policeStationId" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "assignedEoId" TEXT,
    "assignedById" TEXT,
    "assignedAt" DATETIME,
    "targetResolutionDate" DATETIME,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "isFIRRecommended" BOOLEAN NOT NULL DEFAULT false,
    "recommendedFIRNumber" TEXT,
    "directSendToFir" BOOLEAN NOT NULL DEFAULT false,
    "shoDecision" TEXT,
    "rejectionReason" TEXT,
    "rejectionAt" DATETIME,
    "rejectionBy" TEXT,
    "rejectionCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Complaint_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Complaint_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Complaint_assignedEoId_fkey" FOREIGN KEY ("assignedEoId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Complaint_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintAssignmentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaintId" TEXT NOT NULL,
    "previousEoId" TEXT,
    "newEoId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignmentReason" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplaintAssignmentHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnquiryActionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaintId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationVisited" TEXT,
    "personsExamined" TEXT,
    "summaryOfAction" TEXT NOT NULL,
    "nextActionPlan" TEXT,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnquiryActionLog_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EnquiryActionLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaintId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedPlace" TEXT,
    "description" TEXT,
    "chainOfCustody" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplaintEvidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnquiryReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaintId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "briefFacts" TEXT NOT NULL,
    "enquiryConductSummary" TEXT NOT NULL,
    "keyFindings" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "proposedLegalSections" TEXT,
    "detailedRemarks" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnquiryReport_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EnquiryReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "officialRemarks" TEXT NOT NULL,
    "decisionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalHistory_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "EnquiryReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ApprovalHistory_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneralDiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gdNumber" TEXT NOT NULL,
    "sequencePerDay" INTEGER NOT NULL,
    "gdDate" DATETIME NOT NULL,
    "entryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "policeStationId" TEXT NOT NULL,
    "loggedById" TEXT NOT NULL,
    "relatedComplaintId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "isAddendum" BOOLEAN NOT NULL DEFAULT false,
    "parentGdEntryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneralDiaryEntry_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneralDiaryEntry_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneralDiaryEntry_relatedComplaintId_fkey" FOREIGN KEY ("relatedComplaintId") REFERENCES "Complaint" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GeneralDiaryEntry_parentGdEntryId_fkey" FOREIGN KEY ("parentGdEntryId") REFERENCES "GeneralDiaryEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userPno" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuilderTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "documentStructure" TEXT,
    "customFields" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdByRank" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BuilderDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "documentStructure" TEXT,
    "customFields" TEXT,
    "caseId" TEXT,
    "complaintNumber" TEXT,
    "templateId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdByRank" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuilderDraft_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "BuilderTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GDRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gdNumber" TEXT NOT NULL,
    "sequencePerDay" INTEGER NOT NULL,
    "gdDate" DATETIME NOT NULL,
    "entryDateTime" DATETIME NOT NULL,
    "policeStation" TEXT NOT NULL DEFAULT 'PS City Thanesar',
    "district" TEXT NOT NULL DEFAULT 'Kurukshetra',
    "typeCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "typeDisplay" TEXT NOT NULL,
    "typeDisplayHi" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "entryForOfficerJson" TEXT NOT NULL,
    "actualAuthorJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "source" TEXT NOT NULL DEFAULT 'MANUAL_ENTRY',
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "relatedRecordsJson" TEXT,
    "auditTrailJson" TEXT,
    "verificationAuditId" TEXT,
    "verifiedByJson" TEXT,
    "verificationTimestamp" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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

-- CreateTable
CREATE TABLE "FirBailDetail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firId" TEXT NOT NULL,
    "accusedId" TEXT NOT NULL,
    "policeStation" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "firSnapshotJson" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PoliceUnit_code_key" ON "PoliceUnit"("code");

-- CreateIndex
CREATE INDEX "PoliceUnit_district_idx" ON "PoliceUnit"("district");

-- CreateIndex
CREATE INDEX "PoliceUnit_type_idx" ON "PoliceUnit"("type");

-- CreateIndex
CREATE UNIQUE INDEX "User_pno_key" ON "User"("pno");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNumber_key" ON "User"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_unitId_idx" ON "User"("unitId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_complaintNumber_key" ON "Complaint"("complaintNumber");

-- CreateIndex
CREATE INDEX "Complaint_policeStationId_idx" ON "Complaint"("policeStationId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_assignedEoId_idx" ON "Complaint"("assignedEoId");

-- CreateIndex
CREATE INDEX "Complaint_complaintNumber_idx" ON "Complaint"("complaintNumber");

-- CreateIndex
CREATE INDEX "ComplaintAssignmentHistory_complaintId_idx" ON "ComplaintAssignmentHistory"("complaintId");

-- CreateIndex
CREATE INDEX "EnquiryActionLog_complaintId_idx" ON "EnquiryActionLog"("complaintId");

-- CreateIndex
CREATE INDEX "EnquiryActionLog_officerId_idx" ON "EnquiryActionLog"("officerId");

-- CreateIndex
CREATE INDEX "ComplaintEvidence_complaintId_idx" ON "ComplaintEvidence"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintEvidence_sha256Hash_idx" ON "ComplaintEvidence"("sha256Hash");

-- CreateIndex
CREATE INDEX "EnquiryReport_complaintId_idx" ON "EnquiryReport"("complaintId");

-- CreateIndex
CREATE INDEX "ApprovalHistory_complaintId_idx" ON "ApprovalHistory"("complaintId");

-- CreateIndex
CREATE INDEX "ApprovalHistory_reportId_idx" ON "ApprovalHistory"("reportId");

-- CreateIndex
CREATE INDEX "GeneralDiaryEntry_policeStationId_gdDate_idx" ON "GeneralDiaryEntry"("policeStationId", "gdDate");

-- CreateIndex
CREATE INDEX "GeneralDiaryEntry_entryType_idx" ON "GeneralDiaryEntry"("entryType");

-- CreateIndex
CREATE UNIQUE INDEX "GeneralDiaryEntry_policeStationId_gdDate_sequencePerDay_key" ON "GeneralDiaryEntry"("policeStationId", "gdDate", "sequencePerDay");

-- CreateIndex
CREATE INDEX "AuditLog_entityName_entityId_idx" ON "AuditLog"("entityName", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "BuilderTemplate_createdBy_idx" ON "BuilderTemplate"("createdBy");

-- CreateIndex
CREATE INDEX "BuilderTemplate_status_idx" ON "BuilderTemplate"("status");

-- CreateIndex
CREATE INDEX "BuilderDraft_createdBy_idx" ON "BuilderDraft"("createdBy");

-- CreateIndex
CREATE INDEX "BuilderDraft_caseId_idx" ON "BuilderDraft"("caseId");

-- CreateIndex
CREATE INDEX "BuilderDraft_templateId_idx" ON "BuilderDraft"("templateId");

-- CreateIndex
CREATE INDEX "BuilderDraft_status_idx" ON "BuilderDraft"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GDRecord_gdNumber_key" ON "GDRecord"("gdNumber");

-- CreateIndex
CREATE INDEX "GDRecord_gdDate_idx" ON "GDRecord"("gdDate");

-- CreateIndex
CREATE INDEX "GDRecord_typeCode_idx" ON "GDRecord"("typeCode");

-- CreateIndex
CREATE INDEX "GDRecord_status_idx" ON "GDRecord"("status");

-- CreateIndex
CREATE INDEX "GDRecord_isDraft_idx" ON "GDRecord"("isDraft");

-- CreateIndex
CREATE INDEX "GDRecord_subject_idx" ON "GDRecord"("subject");

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

-- CreateIndex
CREATE INDEX "FirBailDetail_firId_accusedId_idx" ON "FirBailDetail"("firId", "accusedId");

