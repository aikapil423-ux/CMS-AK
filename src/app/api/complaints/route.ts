import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ComplaintItem } from "@/types";
import { MOCK_COMPLAINTS } from "@/lib/mockData";

const DATA_FILE_PATH = path.join(process.cwd(), "prisma", "complaints-store.json");

function readComplaintsFromFile(): ComplaintItem[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading complaints-store.json:", e);
  }
  return [...MOCK_COMPLAINTS];
}

function writeComplaintsToFile(items: ComplaintItem[]): void {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(items, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing complaints-store.json:", e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assignedEo = searchParams.get("assignedEo");
  const viewerRole = searchParams.get("viewerRole");

  let complaints = readComplaintsFromFile();

  const isSupervisory =
    viewerRole === "SHO" ||
    viewerRole === "MHC_GD_INCHARGE" ||
    viewerRole === "DSP_SUBDIV" ||
    viewerRole === "SP_DISTRICT" ||
    viewerRole === "SUPER_ADMIN";

  const isEo = viewerRole === "ENQUIRY_OFFICER" || (!isSupervisory && Boolean(assignedEo));

  if (isEo && assignedEo) {
    const eo = assignedEo.toLowerCase().trim();
    const eoTokens = eo
      .split(" ")
      .filter((p) => p.length > 2 && !["sub-inspector", "inspector", "asi", "si", "officer"].includes(p));

    complaints = complaints.filter((c) => {
      const hasEo = Boolean(c.assignedEoId || c.assignedEoName || c.assignedEoPno);
      if (!hasEo) return false;

      const eoId = (c.assignedEoId || "").toLowerCase();
      const eoPno = (c.assignedEoPno || "").toLowerCase();
      const eoName = (c.assignedEoName || "").toLowerCase();

      let matches = eoId === eo || eoPno === eo;
      if (!matches && eoName && (eoName.includes(eo) || eo.includes(eoName))) matches = true;
      if (!matches && eoTokens.length > 0 && eoTokens.some((t) => eoName.includes(t))) matches = true;
      return matches;
    });
  }

  return NextResponse.json({ success: true, complaints });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (Array.isArray(body.complaints)) {
      writeComplaintsToFile(body.complaints);
      return NextResponse.json({ success: true, count: body.complaints.length });
    } else if (body.complaint && body.complaint.id) {
      const list = readComplaintsFromFile();
      const idx = list.findIndex((c) => c.id === body.complaint.id || c.complaintNumber === body.complaint.complaintNumber);
      if (idx !== -1) {
        list[idx] = body.complaint;
      } else {
        list.unshift(body.complaint);
      }
      writeComplaintsToFile(list);
      return NextResponse.json({ success: true, complaint: body.complaint });
    }
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
