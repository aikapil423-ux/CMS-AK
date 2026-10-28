import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { BuilderDbService } from "@/services/builderDbService";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const { id } = await params;
    const ownerRecord=await BuilderDbService.getDraftById(id);
    if (!ownerRecord) return NextResponse.json({error:"Record not found"},{status:404});
    if (true && ownerRecord.createdBy !== apiUser.id) return NextResponse.json({error:"Only the creator may access or change this record."},{status:403});
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
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const { id } = await params;
    const ownerRecord=await BuilderDbService.getDraftById(id);
    if (!ownerRecord) return NextResponse.json({error:"Record not found"},{status:404});
    if (true && ownerRecord.createdBy !== apiUser.id) return NextResponse.json({error:"Only the creator may access or change this record."},{status:403});
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const { id } = await params;
    const ownerRecord=await BuilderDbService.getDraftById(id);
    if (!ownerRecord) return NextResponse.json({error:"Record not found"},{status:404});
    if (true && ownerRecord.createdBy !== apiUser.id) return NextResponse.json({error:"Only the creator may access or change this record."},{status:403});
    await BuilderDbService.deleteDraft(id);
    return NextResponse.json({ success: true, message: "Draft deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete draft" },
      { status: 500 }
    );
  }
}
