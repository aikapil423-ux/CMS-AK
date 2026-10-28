import {evidenceOwner} from "@/lib/evidenceOwnership";
import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { UniversalEvidenceRecord } from "@/types/evidence";

const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");

function readEvidenceStore(): UniversalEvidenceRecord[] {
  try {
    if (fs.existsSync(EVIDENCE_STORE_PATH)) {
      const data = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading processed-evidence-store.json:", err);
  }
  return [];
}

function writeEvidenceStore(records: UniversalEvidenceRecord[]): void {
  try {
    const dir = path.dirname(EVIDENCE_STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(EVIDENCE_STORE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing processed-evidence-store.json:", err);
    throw err;
  }
}

export async function GET(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get("caseId");
    const caseNumber = searchParams.get("caseNumber");
    const fileId = searchParams.get("fileId");
    const sha256Hash = searchParams.get("sha256Hash");
    const recordId = searchParams.get("id");
    const moduleType = searchParams.get("module");

    const fileName = searchParams.get("fileName");

    const store = readEvidenceStore().filter(r=>apiUser.role === "SUPER_ADMIN" || evidenceOwner(r) === apiUser.id);

    if (recordId) {
      const record = store.find((r) => r.id === recordId);
      return NextResponse.json({ success: true, record: record || null });
    }

    if (fileId) {
      const record = store.find((r) => r.fileId === fileId || r.id === fileId);
      return NextResponse.json({ success: true, record: record || null });
    }

    if (fileName) {
      const cleanName = fileName.toLowerCase().trim();
      const matches = store.filter(
        (r) =>
          (r.rawDocument?.fileName || "").toLowerCase().trim() === cleanName ||
          ((r.rawDocument as any)?.originalFileName || "").toLowerCase().trim() === cleanName ||
          (r.structuredData?.classifiedDocumentName || "").toLowerCase().trim() === cleanName
      );
      if(matches.length>1)return Response.json({error:"Several files share this name. Select the evidence by its unique ID."},{status:409});
      const record = matches.length === 1 ? matches[0] : null;
      if (record) {
        return NextResponse.json({ success: true, record });
      }
    }

    if (sha256Hash) {
      const record = store.find(
        (r) => r.rawDocument?.sha256Hash === sha256Hash && r.processingStatus === "COMPLETED"
      );
      return NextResponse.json({ success: true, record: record || null });
    }

    let results = store;

    if (caseId) {
      results = results.filter((r) => r.caseId === caseId);
    }

    if (caseNumber) {
      const cleanNum = caseNumber.toLowerCase().trim();
      results = results.filter((r) => (r.caseNumber || "").toLowerCase().trim() === cleanNum);
    }

    if (moduleType) {
      results = results.filter((r) => r.module === moduleType);
    }

    return NextResponse.json({ success: true, count: results.length, records: results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const body = await req.json();
    const store = readEvidenceStore();

    if (Array.isArray(body.records)) {
      const incomingList: UniversalEvidenceRecord[] = body.records;
      const updatedStore = [...store];

      for (const inc of incomingList) {
        if (!inc.id) inc.id = `ev_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        inc.updatedAt = new Date().toISOString();
        if (!inc.createdAt) inc.createdAt = inc.updatedAt;

        const existingIdx = updatedStore.findIndex(
          (r) => r.id === inc.id || (inc.fileId && r.fileId === inc.fileId)
        );

        if (existingIdx !== -1 && evidenceOwner(updatedStore[existingIdx]) !== apiUser.id) return Response.json({error:"Evidence belongs to another officer"},{status:403});
        inc.ownerId=apiUser.id;
        if (existingIdx !== -1) {
          // Metadata synchronization must never replace the original uploaded bytes.
          inc.rawDocument = updatedStore[existingIdx].rawDocument;
          inc.fileId = updatedStore[existingIdx].fileId;
          updatedStore[existingIdx] = {
            ...updatedStore[existingIdx],
            ...inc,
            auditTrail: [
              ...(updatedStore[existingIdx].auditTrail || []),
              ...(inc.auditTrail || []),
            ],
          };
        } else {
          updatedStore.unshift(inc);
        }
      }

      writeEvidenceStore(updatedStore);
      return NextResponse.json({ success: true, count: incomingList.length });
    }

    if (body.record) {
      const inc: UniversalEvidenceRecord = body.record;
      if (!inc.id) inc.id = `ev_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      inc.updatedAt = new Date().toISOString();
      if (!inc.createdAt) inc.createdAt = inc.updatedAt;

      const updatedStore = [...store];
      const existingIdx = updatedStore.findIndex(
        (r) => r.id === inc.id || (inc.fileId && r.fileId === inc.fileId)
      );

      if (existingIdx !== -1 && evidenceOwner(updatedStore[existingIdx]) !== apiUser.id) return Response.json({error:"Evidence belongs to another officer"},{status:403});
      inc.ownerId=apiUser.id;
      if (existingIdx !== -1) {
        if (!inc.rawDocument?.dataUrl && updatedStore[existingIdx].rawDocument?.dataUrl) {
          inc.rawDocument.dataUrl = updatedStore[existingIdx].rawDocument.dataUrl;
        }
        updatedStore[existingIdx] = {
          ...updatedStore[existingIdx],
          ...inc,
          auditTrail: [
            ...(updatedStore[existingIdx].auditTrail || []),
            ...(inc.auditTrail || []),
          ],
        };
      } else {
        updatedStore.unshift(inc);
      }

      writeEvidenceStore(updatedStore);
      return NextResponse.json({ success: true, record: inc });
    }

    return NextResponse.json({ success: false, error: "Invalid payload: record or records expected." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const body = await req.json();
    const { id, fileId, updates, auditEntry } = body;

    if (!id && !fileId) {
      return NextResponse.json({ success: false, error: "id or fileId required" }, { status: 400 });
    }

    const store = readEvidenceStore();
    const idx = store.findIndex((r) => (!!id && r.id === id) || (!!fileId && r.fileId === fileId));

    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Evidence record not found" }, { status: 404 });
    }

    const current = store[idx];
    if (evidenceOwner(current) !== apiUser.id) return Response.json({error:"Evidence belongs to another officer"},{status:403});
    if(current.caseId && updates?.caseId && updates.caseId !== current.caseId)return Response.json({error:"Evidence is already bound to another case."},{status:409});
    const updated: UniversalEvidenceRecord = {
      ...current,
      ...updates,
      id:current.id,fileId:current.fileId,caseId:current.caseId || updates?.caseId,ownerId:apiUser.id,rawDocument:current.rawDocument,
      updatedAt: new Date().toISOString(),
      auditTrail: auditEntry ? [...(current.auditTrail || []), {...auditEntry,performedBy:apiUser.name,performedByRole:apiUser.role,timestamp:new Date().toISOString()}] : current.auditTrail,
    };

    store[idx] = updated;
    writeEvidenceStore(store);

    return NextResponse.json({ success: true, record: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const fileId = searchParams.get("fileId");
    const caseId = searchParams.get("caseId");

    if (!id && !fileId && !caseId) {
      return NextResponse.json({ success: false, error: "id, fileId, or caseId is required" }, { status: 400 });
    }

    let store = readEvidenceStore();
    const initialCount = store.length;

    if (id) {
      store = store.filter((r) => r.id !== id || evidenceOwner(r) !== apiUser.id);
    } else if (fileId) {
      store = store.filter((r) => evidenceOwner(r) !== apiUser.id || r.fileId !== fileId && r.id !== fileId);
    } else if (caseId) {
      store = store.filter((r) => r.caseId !== caseId || evidenceOwner(r) !== apiUser.id);
    }

    writeEvidenceStore(store);
    return NextResponse.json({ success: true, deletedCount: initialCount - store.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
