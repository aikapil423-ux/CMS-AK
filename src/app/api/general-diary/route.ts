import { NextRequest, NextResponse } from "next/server";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { GDSearchFilter } from "@/types/generalDiary";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const filter: GDSearchFilter = {
      gdNumber: searchParams.get("gdNumber") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      officerQuery: searchParams.get("officer") || undefined,
      personName: searchParams.get("person") || undefined,
      firNumber: searchParams.get("fir") || undefined,
      complaintNumber: searchParams.get("complaint") || undefined,
      vehicleNumber: searchParams.get("vehicle") || undefined,
      typeCode: searchParams.get("type") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      keyword: searchParams.get("q") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 15,
    };

    const result = await GeneralDiaryService.getPaginatedEntries(filter);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch General Diary entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a System Event triggering a suggestion
    if (body.action === "SYSTEM_EVENT_SUGGESTION") {
      const suggestion = await GeneralDiaryService.generateSuggestionFromSystemEvent(body.event);
      return NextResponse.json({ success: true, suggestion });
    }

    // Check if this is a Verify and Lock request
    if (body.action === "VERIFY_AND_LOCK") {
      const lockedRecord = await GeneralDiaryService.verifyAndLockEntry(
        body.record,
        body.verifier,
        body.remarks
      );
      return NextResponse.json({ success: true, record: lockedRecord });
    }

    // Default: Save Draft
    const draft = await GeneralDiaryService.saveDraft(body);
    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process General Diary request" },
      { status: 500 }
    );
  }
}
