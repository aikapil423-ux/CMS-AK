import { apiAccess, forbidden } from "@/lib/apiSecurity";
import { prisma } from "@/lib/prisma";
import { demoEnabled } from "@/lib/serverSession";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const actor = await apiAccess(request);
  if (actor instanceof Response) return actor;
  if (process.env.NODE_ENV === "production" && demoEnabled()) return forbidden();

  const station = actor.stationName.toLowerCase().replace(/^(police station|ps)\s+/, "").trim();
  const key = station.replace(/\s+/g, "-");
  const document = actor.unitId && key
    ? await prisma.importedJsonDocument.findUnique({ where: { path: `station-roster/${key}.json` } })
    : null;

  return Response.json({ members: document?.payload ?? [] }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
