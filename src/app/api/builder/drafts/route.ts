import { NextRequest, NextResponse } from "next/server";
import { BuilderDbService } from "@/services/builderDbService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const caseId = searchParams.get("caseId") || undefined;
    const createdBy = searchParams.get("createdBy") || undefined;
    const templateId = searchParams.get("templateId") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "updatedAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

    const drafts = await BuilderDbService.getDrafts({
      search,
      caseId,
      createdBy,
      templateId,
      status,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({ success: true, drafts });
  } catch (error: any) {
    console.error("GET /api/builder/drafts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load drafts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Draft name is required" },
        { status: 400 }
      );
    }

    if (!body.content && body.content !== "") {
      return NextResponse.json(
        { success: false, error: "Draft content is required" },
        { status: 400 }
      );
    }

    const draft = await BuilderDbService.createDraft({
      name: body.name,
      description: body.description,
      content: body.content,
      documentStructure: body.documentStructure,
      customFields: body.customFields,
      caseId: body.caseId,
      complaintNumber: body.complaintNumber,
      templateId: body.templateId,
      createdBy: body.createdBy || "officer_1",
      createdByName: body.createdByName,
      createdByRank: body.createdByRank,
      status: body.status || "DRAFT",
    });

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    console.error("POST /api/builder/drafts error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create draft" },
      { status: 500 }
    );
  }
}
