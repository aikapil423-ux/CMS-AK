import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), ".eraser_requests.json");

export async function GET(req: Request) {
 const apiUser=apiAccess(req);if(apiUser instanceof Response)return apiUser;
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ requests: [] });
    }
    const data = fs.readFileSync(LOG_FILE, "utf-8");
    return NextResponse.json({ requests: JSON.parse(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, requests: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const body = await req.json();
    let current: any[] = [];
    if (fs.existsSync(LOG_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
      } catch {
        current = [];
      }
    }

    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      url: body.url || "",
      textSnippet: (body.textSnippet || "").trim(),
      tagName: body.tagName || "",
      ariaLabel: body.ariaLabel || "",
      classes: body.classes || "",
      parentContext: body.parentContext || "",
      status: "pending_code_deletion",
    };

    current.push(newEntry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(current, null, 2), "utf-8");

    return NextResponse.json({ success: true, entry: newEntry, count: current.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
 const apiUser=apiAccess(req);if(apiUser instanceof Response)return apiUser;
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
    }
    return NextResponse.json({ success: true, message: "Cleared" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
