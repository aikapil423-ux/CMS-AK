// src/app/api/telecom/finding/route.ts
import { NextRequest, NextResponse } from "next/server";
import { telecomAccess, validateTelecomReferences } from "@/services/telecomAccess";
import { apiAccess } from "@/lib/apiSecurity";


export async function POST(req: NextRequest) {
  try {
    const user = await apiAccess(req);
    if (user instanceof Response) return user;
    const body = await req.json();
    const { service: telecomService } = await telecomAccess(user, body.firId);
    if (!body.firId || body.firId === "ALL") return NextResponse.json({ error: "Select one FIR" }, { status: 400 });
    await validateTelecomReferences(telecomService, body);

    const {
      firId,
      firNumber,
      title,
      findingType = "KEY_CONTACT",
      summary,
      supportingFileIds = [],
      supportingRecordIds = [],
      sourceCitations = [],
      limitationsWarning = "Tower coordinates indicate cellular antenna coverage area (~500m-1km) and do not represent precise GPS coordinates.",
      savedToFirDocuments = true,
    } = body;

    if (!title || !summary) {
      return NextResponse.json(
        { success: false, error: "Title and summary are mandatory." },
        { status: 400 }
      );
    }

    const savedBy = user?.name ? `${user.name} (${user.role})` : "Investigating Officer";

    const finding = await telecomService.saveFinding({
      firId,
      firNumber,
      title,
      findingType,
      summary,
      supportingFileIds,
      supportingRecordIds,
      sourceCitations,
      limitationsWarning,
      savedToFirDocuments,
      savedBy,
    });

    return NextResponse.json({ success: true, finding });
  } catch (error: any) {
    console.error("[Telecom Finding API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save finding." },
      { status: error.message?.startsWith("Access denied") ? 403 : 400 }
    );
  }
}
