import { randomUUID } from "node:crypto";
import { z } from "zod";
import { apiAccess, forbidden } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import type { TADABillRecord } from "@/types/tada";

const id = z.string().min(1).max(200);
const timestamp = z.iso.datetime({ offset: true });
const journey = z.object({ id, srNo: z.number().int().positive() }).passthrough();
const journeyForm = z.object({ journeys: z.array(journey).max(500) }).passthrough();
const billSchema = z.object({
  id,
  userId: id,
  userName: z.string().max(500),
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED"]),
  createdAt: timestamp,
  updatedAt: timestamp,
  form1TourProgramme: journeyForm,
  form2JourneyDetails: journeyForm,
  form3MainPage: z.object({ billNumber: z.string().max(200).optional() }).passthrough(),
}).passthrough();
const mutation = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["save", "import"]), bill: billSchema }),
  z.object({ action: z.literal("delete"), id, updatedAt: timestamp }),
]);

export async function GET(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const [bills, lines, archived] = await prisma.$transaction([
    prisma.$queryRaw<{ payload: string }[]>`
      SELECT "payload" FROM "TaDaBill"
      WHERE "ownerId" = ${user.id} AND "deleted" = FALSE
      ORDER BY "updatedAt" DESC, "id"`,
    prisma.$queryRaw<{ billId: string; form: string; payload: string }[]>`
      SELECT line."billId", line."form", line."payload"
      FROM "TaDaBillLine" line JOIN "TaDaBill" bill ON bill.id = line."billId"
      WHERE bill."ownerId" = ${user.id} AND bill."deleted" = FALSE
      ORDER BY line."position"`,
    prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "TaDaBill" WHERE "ownerId" = ${user.id} AND "deleted" = TRUE`,
  ], { isolationLevel: "Serializable" });
  const records = bills.map(row => JSON.parse(row.payload) as TADABillRecord);
  const byId = new Map(records.map(bill => [bill.id, bill]));
  for (const line of lines) {
    const bill = byId.get(line.billId);
    if (!bill) continue;
    if (line.form === "tour") bill.form1TourProgramme.journeys.push(JSON.parse(line.payload));
    else if (line.form === "claim") bill.form2JourneyDetails.journeys.push(JSON.parse(line.payload));
  }
  return Response.json({ bills: records, archivedIds: archived.map(record => record.id) });
}

export async function POST(req: Request) {
  const user = await apiAccess(req);
  if (user instanceof Response) return user;
  const input = mutation.safeParse(await req.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid TA/DA bill." }, { status: 400 });
  const change = input.data;
  const billId = change.action === "delete" ? change.id : change.bill.id;
  if (change.action !== "delete" && change.bill.userId !== user.id) return forbidden();
  const conflict = () => Response.json({ error: "The bill changed. Reload your TA/DA history and try again." }, { status: 409 });

  return prisma.$transaction(async tx => {
    const [current] = await tx.$queryRaw<{ ownerId: string; status: string; updatedAt: string; deleted: boolean; payload: string }[]>`
      SELECT "ownerId", "status", "updatedAt", "deleted", "payload" FROM "TaDaBill" WHERE id = ${billId}`;
    if (current && current.ownerId !== user.id) return forbidden();
    if (change.action === "import" && current) return Response.json({ imported: false });
    if (current?.deleted) return conflict();
    const updatedAt = new Date(Math.max(Date.now(), current ? Date.parse(current.updatedAt) + 1 : 0)).toISOString();

    if (change.action === "delete") {
      if (!current || current.updatedAt !== change.updatedAt) return conflict();
      if (current.status !== "DRAFT") return forbidden("Only drafts can be deleted.");
      const changed = await tx.$executeRaw`UPDATE "TaDaBill" SET "deleted" = TRUE, "updatedAt" = ${updatedAt}
        WHERE id = ${billId} AND "ownerId" = ${user.id} AND "updatedAt" = ${change.updatedAt} AND "deleted" = FALSE`;
      if (!changed) return conflict();
    } else {
      if (change.bill.status === "APPROVED" || current?.status === "APPROVED") {
        return forbidden("Approved bills require verification by the approving officer.");
      }
      if (current && current.updatedAt !== change.bill.updatedAt) return conflict();
      const { journeys: tour, ...form1 } = change.bill.form1TourProgramme;
      const { journeys: claim, ...form2 } = change.bill.form2JourneyDetails;
      const stored = {
        ...change.bill,
        createdAt: current ? JSON.parse(current.payload).createdAt : change.action === "import" ? change.bill.createdAt : updatedAt,
        userId: user.id,
        updatedAt,
        form1TourProgramme: { ...form1, journeys: [] },
        form2JourneyDetails: { ...form2, journeys: [] },
      };
      const payload = JSON.stringify(stored);
      const status = change.bill.status;
      const number = change.bill.form3MainPage.billNumber || null;
      const changed = current
        ? await tx.$executeRaw`UPDATE "TaDaBill" SET "status" = ${status}, "updatedAt" = ${updatedAt}, "payload" = ${payload},
            "registrationNumber" = ${number}
            WHERE id = ${billId} AND "ownerId" = ${user.id} AND "updatedAt" = ${current.updatedAt} AND "deleted" = FALSE`
        : await tx.$executeRaw`INSERT INTO "TaDaBill" ("id", "ownerId", "status", "updatedAt", "payload",
            "district", "policeStation", "registrationNumber", "registrationDate")
            VALUES (${billId}, ${user.id}, ${status}, ${updatedAt}, ${payload},
              ${user.district || null}, ${user.stationName || null}, ${number}, ${stored.createdAt.slice(0,10)})
            ON CONFLICT ("id") DO NOTHING`;
      if (!changed) return conflict();
      await tx.$executeRaw`DELETE FROM "TaDaBillLine" WHERE "billId" = ${billId}`;
      for (const [form, journeys] of [["tour", tour], ["claim", claim]] as const) {
        for (const [position, line] of journeys.entries()) {
          await tx.$executeRaw`INSERT INTO "TaDaBillLine" ("billId", "form", "position", "payload")
            VALUES (${billId}, ${form}, ${position}, ${JSON.stringify(line)})`;
        }
      }
      await tx.$executeRaw`INSERT INTO "TaDaBillEvent" ("id", "billId", "officerId", "action", "timestamp")
        VALUES (${randomUUID()}, ${billId}, ${user.id}, ${change.action === "import" ? "IMPORT" : status}, ${updatedAt})`;
      return Response.json({ bill: { ...stored, form1TourProgramme: { ...form1, journeys: tour }, form2JourneyDetails: { ...form2, journeys: claim } } });
    }
    await tx.$executeRaw`INSERT INTO "TaDaBillEvent" ("id", "billId", "officerId", "action", "timestamp")
      VALUES (${randomUUID()}, ${billId}, ${user.id}, 'DELETE', ${updatedAt})`;
    return Response.json({ deleted: true });
  }, { timeout: 15000 });
}
