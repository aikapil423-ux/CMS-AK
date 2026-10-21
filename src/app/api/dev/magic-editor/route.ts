import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LAYOUT_RULES_FILE = path.join(process.cwd(), "src", "lib", "permanent_layout_rules.json");

function ensureFile() {
  if (!fs.existsSync(LAYOUT_RULES_FILE)) {
    fs.writeFileSync(LAYOUT_RULES_FILE, JSON.stringify([]), "utf-8");
  }
}

export async function GET(req: NextRequest) {
  try {
    ensureFile();
    const data = fs.readFileSync(LAYOUT_RULES_FILE, "utf-8");
    return NextResponse.json({ rules: JSON.parse(data) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, rules: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    ensureFile();
    const body = await req.json();
    let current: any[] = [];
    try {
      current = JSON.parse(fs.readFileSync(LAYOUT_RULES_FILE, "utf-8"));
    } catch {
      current = [];
    }

    const { actions } = body;
    const actionsList = Array.isArray(actions) ? actions : [actions];

    for (const act of actionsList) {
      if (!act) continue;

      // Upsert: If a rule already exists for this element on this url, update it
      const existingIdx = current.findIndex(
        (r) => r.elementText === act.elementText && r.url === act.url
      );

      const entry = {
        id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...act,
      };

      if (existingIdx >= 0) {
        current[existingIdx] = entry;
      } else {
        current.push(entry);
      }
    }

    fs.writeFileSync(LAYOUT_RULES_FILE, JSON.stringify(current, null, 2), "utf-8");
    return NextResponse.json({ success: true, count: current.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    ensureFile();
    const { searchParams } = new URL(req.url);
    const urlFilter = searchParams.get("url");

    if (!urlFilter) {
      fs.writeFileSync(LAYOUT_RULES_FILE, JSON.stringify([]), "utf-8");
      return NextResponse.json({ success: true, message: "Cleared all layout rules" });
    }

    let current: any[] = JSON.parse(fs.readFileSync(LAYOUT_RULES_FILE, "utf-8"));
    current = current.filter((r) => r.url !== urlFilter);
    fs.writeFileSync(LAYOUT_RULES_FILE, JSON.stringify(current, null, 2), "utf-8");
    return NextResponse.json({ success: true, rules: current });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
