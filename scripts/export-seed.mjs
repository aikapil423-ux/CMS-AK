import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const seedDataPath = path.join(rootDir, "prisma", "seed-data.json");

const prisma = new PrismaClient();

async function exportSeedData() {
  try {
    const [
      policeUnits,
      users,
      complaints,
      complaintAssignmentHistory,
      enquiryActionLogs,
      complaintEvidences,
      enquiryReports,
      approvalHistory,
      generalDiaryEntries,
      auditLogs,
      builderTemplates,
      builderDrafts,
      gdRecords,
    ] = await Promise.all([
      prisma.policeUnit.findMany({ orderBy: { id: "asc" } }),
      prisma.user.findMany({ orderBy: { id: "asc" } }),
      prisma.complaint.findMany({ orderBy: { id: "asc" } }),
      prisma.complaintAssignmentHistory.findMany({ orderBy: { id: "asc" } }),
      prisma.enquiryActionLog.findMany({ orderBy: { id: "asc" } }),
      prisma.complaintEvidence.findMany({ orderBy: { id: "asc" } }),
      prisma.enquiryReport.findMany({ orderBy: { id: "asc" } }),
      prisma.approvalHistory.findMany({ orderBy: { id: "asc" } }),
      prisma.generalDiaryEntry.findMany({ orderBy: { id: "asc" } }),
      prisma.auditLog.findMany({ orderBy: { id: "asc" } }),
      prisma.builderTemplate.findMany({ orderBy: { id: "asc" } }),
      prisma.builderDraft.findMany({ orderBy: { id: "asc" } }),
      prisma.gDRecord.findMany({ orderBy: { gdNumber: "asc" } }),
    ]);

    const payload = {
      meta: {
        schema: "prisma/schema.prisma",
        databaseFile: "prisma/dev.db",
        counts: {
          policeUnits: policeUnits.length,
          users: users.length,
          complaints: complaints.length,
          complaintAssignmentHistory: complaintAssignmentHistory.length,
          enquiryActionLogs: enquiryActionLogs.length,
          complaintEvidences: complaintEvidences.length,
          enquiryReports: enquiryReports.length,
          approvalHistory: approvalHistory.length,
          generalDiaryEntries: generalDiaryEntries.length,
          auditLogs: auditLogs.length,
          builderTemplates: builderTemplates.length,
          builderDrafts: builderDrafts.length,
          gdRecords: gdRecords.length,
        },
      },
      data: {
        policeUnits,
        users,
        complaints,
        complaintAssignmentHistory,
        enquiryActionLogs,
        complaintEvidences,
        enquiryReports,
        approvalHistory,
        generalDiaryEntries,
        auditLogs,
        builderTemplates,
        builderDrafts,
        gdRecords,
      },
    };

    const nextContent = JSON.stringify(payload, null, 2) + "\n";
    const existingContent = fs.existsSync(seedDataPath)
      ? fs.readFileSync(seedDataPath, "utf8")
      : "";

    if (nextContent !== existingContent) {
      fs.writeFileSync(seedDataPath, nextContent, "utf8");
      console.log(`[db:export-seed] Updated prisma/seed-data.json (${gdRecords.length} GD records, ${complaints.length} complaints).`);
    } else {
      console.log("[db:export-seed] prisma/seed-data.json is already up to date.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

exportSeedData().catch((err) => {
  console.error("[db:export-seed] Failed to export seed data:", err);
  process.exit(1);
});
