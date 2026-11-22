-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('HQ', 'RANGE', 'COMMISSIONERATE', 'DISTRICT', 'SUB_DIVISION', 'POLICE_STATION', 'POLICE_POST');

-- CreateEnum
CREATE TYPE "PoliceRank" AS ENUM ('CONSTABLE', 'HEAD_CONSTABLE', 'ASSISTANT_SUB_INSPECTOR', 'SUB_INSPECTOR', 'INSPECTOR', 'DEPUTY_SP', 'ADDITIONAL_SP', 'SUPERINTENDENT_OF_POLICE', 'INSPECTOR_GENERAL', 'ADGP', 'DGP');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('SUPER_ADMIN', 'SP_DISTRICT', 'DSP_SUBDIV', 'SHO', 'MHC_GD_INCHARGE', 'DUTY_OFFICER', 'ENQUIRY_OFFICER', 'READER_TO_SHO', 'VIEWER_AUDITOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'TRANSFERRED', 'SUSPENDED', 'LEAVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ComplaintSource" AS ENUM ('WALK_IN_STATION', 'CM_WINDOW_HARYANA', 'CITIZEN_PORTAL_HARPATH', 'EMERGENCY_112', 'SP_OFFICE_REFERENCE', 'POSTAL_APPLICATION', 'WOMEN_HELPLINE', 'SENIOR_CITIZEN_DESK');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('CYBER_CRIME', 'PROPERTY_THEFT_BURGLARY', 'FINANCIAL_FRAUD_CHEATING', 'LAND_PROPERTY_DISPUTE', 'PHYSICAL_ASSAULT_AFFRAY', 'DOMESTIC_VIOLENCE_DOWRY', 'PUBLIC_NUISANCE', 'MISSING_PERSON', 'NARCOTICS_DRUGS_INFO', 'HARASSMENT_STALKING', 'MOTOR_VEHICLE_DISPUTE', 'CORRUPTION_VIGILANCE', 'OTHER_GENERAL');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('ROUTINE', 'URGENT', 'CRITICAL_SENSITIVE', 'CM_WINDOW_VIP');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('REGISTERED', 'ASSIGNED_TO_EO', 'ENQUIRY_IN_PROGRESS', 'INTERIM_REPORT_SUBMITTED', 'REPORT_SUBMITTED', 'PENDING_SHO_REVIEW', 'PENDING_DSP_REVIEW', 'RECOMMENDED_FOR_FIR', 'DISPOSED_MUTUAL_ACCORD', 'DISPOSED_CIVIL_NATURE', 'DISPOSED_UNSUBSTANTIATED', 'TRANSFERRED_OTHER_PS');

-- CreateEnum
CREATE TYPE "EnquiryActionType" AS ENUM ('SPOT_INSPECTION', 'WITNESS_EXAMINATION', 'COMPLAINANT_STATEMENT', 'ACCUSED_EXAMINATION', 'NOTICE_ISSUED_BNSS', 'DOCUMENT_VERIFICATION', 'CCTV_RETRIEVAL', 'INTERIM_BRIEF');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('COMPLAINT_COPY_SIGNED', 'SPOT_PHOTOGRAPH', 'CCTV_FOOTAGE_CLIP', 'AUDIO_RECORDING', 'BANK_FINANCIAL_STATEMENT', 'MEDICAL_MLR_REPORT', 'WRITTEN_STATEMENT', 'NOTICE_COPY', 'OTHER_DOCUMENT');

-- CreateEnum
CREATE TYPE "FinalRecommendation" AS ENUM ('REGISTER_FIR_COGNIZABLE', 'DISPOSE_CIVIL_DISPUTE', 'DISPOSE_MUTUAL_SETTLEMENT', 'DISPOSE_FALSE_MALICIOUS', 'TRANSFER_OTHER_JURISDICTION', 'FURTHER_INVESTIGATION_NEEDED');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'RETURNED_WITH_QUERIES', 'REJECTED', 'ESCALATED_TO_SUPERVISOR');

-- CreateEnum
CREATE TYPE "GDEntryType" AS ENUM ('OPENING_OF_DIARY', 'SHIFT_RELIEF_TURNOVER', 'OFFICER_DEPARTURE', 'OFFICER_ARRIVAL', 'PATROL_DEPARTURE_RETURN', 'COMPLAINT_RECEIPT', 'FIR_REGISTERED_ENTRY', 'ARREST_INTIMATION', 'SEIZURE_MUDDMAL', 'SUPERVISORY_INSPECTION', 'GOVERNMENT_PROPERTY_LOG', 'CLOSING_OF_DIARY', 'MISCELLANEOUS_EVENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_LOGIN', 'USER_LOGOUT', 'RECORD_CREATE', 'RECORD_UPDATE', 'RECORD_VIEW_SENSITIVE', 'EO_ASSIGNMENT', 'EO_REASSIGNMENT', 'ENQUIRY_REPORT_SUBMIT', 'REPORT_APPROVED', 'RECORD_TRANSFER', 'DOCUMENT_DOWNLOAD', 'GD_ENTRY_LOGGED');

-- CreateTable
CREATE TABLE "PoliceUnit" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "UnitType" NOT NULL,
    "district" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "contactPhone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "pno" TEXT NOT NULL,
    "beltNumber" TEXT,
    "fullName" TEXT NOT NULL,
    "rank" "PoliceRank" NOT NULL,
    "role" "SystemRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "mobileNumber" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "source" "ComplaintSource" NOT NULL DEFAULT 'WALK_IN_STATION',
    "category" "ComplaintCategory" NOT NULL,
    "subCategory" TEXT,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'REGISTERED',
    "incidentDate" TIMESTAMP(3),
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
    "accusedDetails" JSONB,
    "policeStationId" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "assignedEoId" TEXT,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3),
    "targetResolutionDate" TIMESTAMP(3),
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "isFIRRecommended" BOOLEAN NOT NULL DEFAULT false,
    "recommendedFIRNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintAssignmentHistory" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "previousEoId" TEXT,
    "newEoId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignmentReason" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintAssignmentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryActionLog" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "actionType" "EnquiryActionType" NOT NULL,
    "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationVisited" TEXT,
    "personsExamined" TEXT,
    "summaryOfAction" TEXT NOT NULL,
    "nextActionPlan" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintEvidence" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileMimeType" TEXT NOT NULL,
    "sha256Hash" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedPlace" TEXT,
    "description" TEXT,
    "chainOfCustody" TEXT,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryReport" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "briefFacts" TEXT NOT NULL,
    "enquiryConductSummary" TEXT NOT NULL,
    "keyFindings" TEXT NOT NULL,
    "recommendation" "FinalRecommendation" NOT NULL,
    "proposedLegalSections" TEXT,
    "detailedRemarks" TEXT,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalHistory" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverRole" "SystemRole" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "officialRemarks" TEXT NOT NULL,
    "decisionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneralDiaryEntry" (
    "id" TEXT NOT NULL,
    "gdNumber" TEXT NOT NULL,
    "sequencePerDay" INTEGER NOT NULL,
    "gdDate" TIMESTAMP(3) NOT NULL,
    "entryTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entryType" "GDEntryType" NOT NULL,
    "subject" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "policeStationId" TEXT NOT NULL,
    "loggedById" TEXT NOT NULL,
    "relatedComplaintId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "isAddendum" BOOLEAN NOT NULL DEFAULT false,
    "parentGdEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralDiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userPno" TEXT,
    "userRole" "SystemRole",
    "action" "AuditAction" NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "details" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirFinalReport" (
    "id" TEXT NOT NULL,
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
    "sentToShoAt" TIMESTAMP(3),
    "sentToShoBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirFinalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirFinalReportAccused" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "accusedId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,

    CONSTRAINT "FirFinalReportAccused_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirFinalReportEvent" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "firId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "snapshotJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FirFinalReportEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FirBailDetail" (
    "id" TEXT NOT NULL,
    "firId" TEXT NOT NULL,
    "accusedId" TEXT NOT NULL,
    "policeStation" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "firSnapshotJson" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirBailDetail_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "PoliceUnit" ADD CONSTRAINT "PoliceUnit_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PoliceUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PoliceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedEoId_fkey" FOREIGN KEY ("assignedEoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintAssignmentHistory" ADD CONSTRAINT "ComplaintAssignmentHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryActionLog" ADD CONSTRAINT "EnquiryActionLog_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryActionLog" ADD CONSTRAINT "EnquiryActionLog_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintEvidence" ADD CONSTRAINT "ComplaintEvidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryReport" ADD CONSTRAINT "EnquiryReport_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryReport" ADD CONSTRAINT "EnquiryReport_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "EnquiryReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalHistory" ADD CONSTRAINT "ApprovalHistory_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralDiaryEntry" ADD CONSTRAINT "GeneralDiaryEntry_policeStationId_fkey" FOREIGN KEY ("policeStationId") REFERENCES "PoliceUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralDiaryEntry" ADD CONSTRAINT "GeneralDiaryEntry_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralDiaryEntry" ADD CONSTRAINT "GeneralDiaryEntry_relatedComplaintId_fkey" FOREIGN KEY ("relatedComplaintId") REFERENCES "Complaint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneralDiaryEntry" ADD CONSTRAINT "GeneralDiaryEntry_parentGdEntryId_fkey" FOREIGN KEY ("parentGdEntryId") REFERENCES "GeneralDiaryEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirFinalReportAccused" ADD CONSTRAINT "FirFinalReportAccused_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FirFinalReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FirFinalReportEvent" ADD CONSTRAINT "FirFinalReportEvent_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FirFinalReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

