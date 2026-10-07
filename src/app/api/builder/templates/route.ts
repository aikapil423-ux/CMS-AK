import { NextRequest, NextResponse } from "next/server";
import { BuilderDbService } from "@/services/builderDbService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const createdBy = searchParams.get("createdBy") || undefined;
    const status = searchParams.get("status") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "updatedAt";
    const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

    const templates = await BuilderDbService.getTemplates({
      search,
      createdBy,
      status,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("GET /api/builder/templates error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load templates" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Template name is required" },
        { status: 400 }
      );
    }

    if (!body.content && body.content !== "") {
      return NextResponse.json(
        { success: false, error: "Template content is required" },
        { status: 400 }
      );
    }

    const template = await BuilderDbService.createTemplate({
      name: body.name,
      description: body.description,
      content: body.content,
      documentStructure: body.documentStructure,
      customFields: body.customFields,
      createdBy: body.createdBy || "officer_1",
      createdByName: body.createdByName,
      createdByRank: body.createdByRank,
    });

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("POST /api/builder/templates error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create template" },
      { status: 500 }
    );
  }
}
