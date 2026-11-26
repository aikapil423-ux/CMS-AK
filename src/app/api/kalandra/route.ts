import { z } from "zod";
import { apiAccess, forbidden, scopeAllowed } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { usesPostgresStore } from "@/lib/runtimeJsonStore";
import { readFirRecords } from "@/services/firRepository";
import { readComplaints } from "@/services/complaintRepository";
import { isFirVisibleToUser } from "@/lib/firIntegrity";
import { canViewComplaint } from "@/utils/complaintPermissions";
import type { KalandraRecord } from "@/types/kalandra";

const id = z.string().min(1).max(200);
const recordInput = z.object({
  id, policeStation: z.string().max(300), district: z.string().max(300),
  status: z.enum(["DRAFT", "FINALISED"]),
  caseType: z.enum(["DIRECT", "FROM_GD", "FROM_FIR", "FROM_COMPLAINT"]),
  respondentName: z.string().trim().min(1).max(500),
  incidentPlace: z.string().max(1000), factsAndCircumstances: z.string().max(100000),
  relatedFirId: id.optional(), relatedComplaintId: id.optional(), relatedGdNumber: id.optional(),
  createdAt: z.iso.datetime({offset:true}), updatedAt: z.iso.datetime({offset:true}),
  kalandraNumber: z.string().max(200),
  witnesses: z.array(z.object({id}).passthrough()).max(100),
  supportingDocuments: z.array(z.object({id}).passthrough()).max(100),
}).passthrough();
const changeInput = z.discriminatedUnion("action", [
  z.object({action:z.enum(["save","import"]), record:recordInput}),
  z.object({action:z.literal("delete"), id, updatedAt:z.iso.datetime({offset:true})}),
]);

const unavailable = () => Response.json({error:"Kalandra requires the PostgreSQL case register."},{status:503});
const conflict = () => Response.json({error:"This Kalandra changed. Reload the record before saving."},{status:409});

export async function GET(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  if (!usesPostgresStore()) return unavailable();
  const rows = await prisma.$queryRaw<{payload:KalandraRecord;archived:boolean}[]>`
    SELECT payload, archived FROM "KalandraRecord" WHERE "ownerId" = ${user.id}
      OR lower(district) = lower(${user.district || ""}) OR ${user.role === "SUPER_ADMIN"}
    ORDER BY "updatedAt" DESC`;
  const scoped = rows.filter(row => scopeAllowed(user, row.payload));
  return Response.json({
    records:scoped.filter(row => !row.archived).map(row => row.payload),
    archivedIds:scoped.filter(row => row.archived).map(row => row.payload.id),
  });
}

export async function POST(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  if (!usesPostgresStore()) return unavailable();
  const parsed = changeInput.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return Response.json({error:"Invalid Kalandra record."},{status:400});
  const change = parsed.data;
  const recordId = change.action === "delete" ? change.id : change.record.id;
  const supervisor = ["SUPER_ADMIN","SP_DISTRICT","DSP_SUBDIV","SHO"].includes(user.role);

  let source: { district: string; policeStation: string } | undefined;
  if (change.action !== "delete") {
    const item = change.record;
    if (item.status === "FINALISED" && (!item.incidentPlace.trim() || !item.factsAndCircumstances.trim())) {
      return Response.json({error:"Incident location and facts are required."},{status:400});
    }
    if (item.caseType === "FROM_FIR") {
      source = (await readFirRecords()).find(row => row.id === item.relatedFirId && isFirVisibleToUser(user,row));
    } else if (item.caseType === "FROM_COMPLAINT") {
      source = (await readComplaints()).find(row => row.id === item.relatedComplaintId && canViewComplaint(user,row).allowed);
    } else if (item.caseType === "FROM_GD" && item.relatedGdNumber) {
      const row = await prisma.gDRecord.findUnique({where:{gdNumber:item.relatedGdNumber},select:{district:true,policeStation:true}});
      source = row ?? undefined;
    }
    if (item.caseType !== "DIRECT" && (!source || !scopeAllowed(user,source))) return forbidden("The linked case is unavailable for your posting.");
    if (change.action === "import" && !supervisor) return forbidden("A supervising officer must review browser records before importing.");
  }

  return prisma.$transaction(async tx => {
    await tx.$executeRaw`LOCK TABLE "KalandraRecord" IN SHARE ROW EXCLUSIVE MODE`;
    const [old] = await tx.$queryRaw<{payload:KalandraRecord;archived:boolean;ownerId:string}[]>`
      SELECT payload, archived, "ownerId" FROM "KalandraRecord" WHERE id = ${recordId}`;
    if (old && (!scopeAllowed(user,old.payload) || !supervisor && old.ownerId !== user.id)) return forbidden();
    if (change.action === "import" && old) return Response.json({imported:false});
    if (old?.archived) return conflict();
    const updatedAt = new Date(Math.max(Date.now(),old ? Date.parse(old.payload.updatedAt)+1 : 0)).toISOString();

    if (change.action === "delete") {
      if (!old || old.payload.updatedAt !== change.updatedAt) return conflict();
      if (old.payload.status !== "DRAFT") return forbidden("Only drafts can be removed.");
      await tx.$executeRaw`UPDATE "KalandraRecord" SET archived = TRUE WHERE id = ${recordId}`;
      await tx.$executeRaw`INSERT INTO "CaseDocumentEvent" (kind,"recordId","officerId",action)
        VALUES ('KALANDRA',${recordId},${user.id},'ARCHIVE')`;
      return Response.json({archived:true});
    }

    const item = change.record;
    if (old && old.payload.updatedAt !== item.updatedAt) return conflict();
    if (old && old.payload.status !== "DRAFT") return forbidden("A finalised Kalandra is read-only.");
    const location = old?.payload ?? source ?? (change.action === "import" ? item : {policeStation:user.stationName,district:user.district});
    const { district, policeStation } = location;
    if (!district || !policeStation || !scopeAllowed(user,location)) return forbidden("Select a case in your posting.");
    if (source && (source.district !== district || source.policeStation !== policeStation)) return forbidden("The linked case belongs to a different station.");
    const createdAt = old?.payload.createdAt ?? (change.action === "import" ? item.createdAt : updatedAt);
    const year = createdAt.slice(0,4);
    const [counter] = await tx.$queryRaw<{sequence:number}[]>`
      SELECT COALESCE(MAX(sequence),0)+1 AS sequence FROM "KalandraRecord"
      WHERE district=${district} AND "policeStation"=${policeStation} AND "registrationYear"=${year}`;
    const legacyNumber = change.action === "import" ? /^KAL\/(\d{4})\/(\d{1,8})$/.exec(item.kalandraNumber) : null;
    if (change.action === "import" && (!legacyNumber || legacyNumber[1] !== year)) {
      return Response.json({error:"Review the legacy Kalandra number and registration date before importing."},{status:400});
    }
    const sequence = legacyNumber ? Number(legacyNumber[2]) : counter.sequence;
    const record = {
      ...item, district, policeStation, createdAt, updatedAt,
      kalandraNumber: old?.payload.kalandraNumber ?? legacyNumber?.[0] ?? `KAL/${year}/${String(sequence).padStart(3,"0")}`,
      reportingOfficer:old?.payload.reportingOfficer ?? (change.action === "import" ? item.reportingOfficer : user.name),
      officerRank:old?.payload.officerRank ?? (change.action === "import" ? item.officerRank : user.rankDisplay || user.rank || ""),
      officerBelt:old?.payload.officerBelt ?? (change.action === "import" ? item.officerBelt : user.pno),
      approvedBy:undefined, approvedAt:undefined,
      finalisedAt:item.status === "FINALISED" ? (change.action === "import" ? item.finalisedAt : updatedAt) : undefined,
    };
    const payload = JSON.stringify(record);
    const changed = old
      ? await tx.$executeRaw`UPDATE "KalandraRecord" SET status=${record.status},"updatedAt"=${updatedAt},payload=${payload}::jsonb WHERE id=${recordId}`
      : await tx.$executeRaw`INSERT INTO "KalandraRecord"
          (id,"ownerId",district,"policeStation","registrationDate","registrationYear","registrationNumber",sequence,status,"updatedAt",payload)
          VALUES (${recordId},${user.id},${district},${policeStation},${createdAt.slice(0,10)},${year},${record.kalandraNumber},${sequence},${record.status},${updatedAt},${payload}::jsonb)
          ON CONFLICT DO NOTHING`;
    if (!changed) return conflict();
    await tx.$executeRaw`INSERT INTO "CaseDocumentEvent" (kind,"recordId","officerId",action)
      VALUES ('KALANDRA',${recordId},${user.id},${change.action === "import" ? "IMPORT" : record.status})`;
    return Response.json({record});
  },{timeout:15000});
}
