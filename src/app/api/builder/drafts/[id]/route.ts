import { NextRequest, NextResponse } from "next/server";
import { BuilderDbService } from "@/services/builderDbService";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const draft = await BuilderDbService.getDraftById(id);
    if (!draft) {
      return NextResponse.json(
        { success: false, error: "Draft not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch draft" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await BuilderDbService.updateDraft(id, {
      name: body.name,
      description: body.description,
      content: body.content,
      documentStructure: body.documentStructure,
      customFields: body.customFields,
      caseId: body.caseId,
      complaintNumber: body.complaintNumber,
      status: body.status,
    });

    return NextResponse.json({ success: true, draft: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await BuilderDbService.deleteDraft(id);
    return NextResponse.json({ success: true, message: "Draft deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete draft" },
      { status: 500 }
    );
  }
}
