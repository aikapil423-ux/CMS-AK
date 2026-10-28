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
    const ownerRecord=await BuilderDbService.getTemplateById(id);
    if (!ownerRecord) return NextResponse.json({error:"Record not found"},{status:404});
    if (req.method !== "GET" && ownerRecord.createdBy !== apiUser.id) return NextResponse.json({error:"Only the creator may access or change this record."},{status:403});
    const template = await BuilderDbService.getTemplateById(id);
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch template" },
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
    const ownerRecord=await BuilderDbService.getTemplateById(id);
    if (!ownerRecord) return NextResponse.json({error:"Record not found"},{status:404});
    if (req.method !== "GET" && ownerRecord.createdBy !== apiUser.id) return NextResponse.json({error:"Only the creator may access or change this record."},{status:403});
    const body = await req.json();

    const updated = await BuilderDbService.updateTemplate(id, {
      name: body.name,
      description: body.description,
      content: body.content,
      documentStructure: body.documentStructure,
      customFields: body.customFields,
      status: body.status,
    });

    return NextResponse.json({ success: true, template: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update template" },
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
    const ownerRecord=await BuilderDbService.getTemplateById(id);
    if (!ownerRecord) return NextResponse.json({error:"Record not found"},{status:404});
    if (req.method !== "GET" && ownerRecord.createdBy !== apiUser.id) return NextResponse.json({error:"Only the creator may access or change this record."},{status:403});
    await BuilderDbService.deleteTemplate(id);
    return NextResponse.json({ success: true, message: "Template deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete template" },
      { status: 500 }
    );
  }
}
