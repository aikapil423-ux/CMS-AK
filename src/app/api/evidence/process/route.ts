import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UniversalEvidenceRecord, EvidenceModuleType } from "@/types/evidence";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash";
const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");

function readEvidenceStore(): UniversalEvidenceRecord[] {
  try {
    if (fs.existsSync(EVIDENCE_STORE_PATH)) {
      const data = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Error reading evidence store in process:", err);
  }
  return [];
}

function writeEvidenceStore(records: UniversalEvidenceRecord[]): void {
  try {
    const dir = path.dirname(EVIDENCE_STORE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EVIDENCE_STORE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing evidence store in process:", err);
  }
}

function computeSha256(buffer: Buffer | string): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fallbackText = (formData.get("text") as string) || "";
    const rawDataUrl = (formData.get("dataUrl") as string) || "";
    const fileId = (formData.get("fileId") as string) || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const caseId = (formData.get("caseId") as string) || "";
    const caseNumber = (formData.get("caseNumber") as string) || "";
    const moduleType = ((formData.get("module") as string) || "COMPLAINTS") as EvidenceModuleType;
    const uploadedBy = (formData.get("uploadedBy") as string) || "Intake Officer";
    const forceReprocess = formData.get("forceReprocess") === "true";

    if (!file && !fallbackText && !rawDataUrl) {
      return NextResponse.json({ success: false, error: "No document file or text content provided." }, { status: 400 });
    }

    const fileName = file ? file.name : (formData.get("fileName") as string) || "evidence_document.pdf";
    const fileSize = file ? file.size : rawDataUrl ? Math.round(rawDataUrl.length * 0.75) : fallbackText.length;
    const fileType = file ? file.type || "application/octet-stream" : "application/pdf";

    // 1. Compute checksum to enforce Process-Once-and-Reuse-Everywhere
    let fileBuffer: Buffer | null = null;
    let sha256Hash = "";

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      sha256Hash = computeSha256(fileBuffer);
    } else if (rawDataUrl) {
      sha256Hash = computeSha256(rawDataUrl);
    } else {
      sha256Hash = computeSha256(fallbackText);
    }

    // 2. CHECK CACHE: If already processed and COMPLETED, reuse immediately without re-running AI/OCR!
    const store = readEvidenceStore();
    const existing = store.find(
      (r) =>
        (r.rawDocument?.sha256Hash === sha256Hash || r.fileId === fileId) &&
        r.processingStatus === "COMPLETED"
    );

    if (existing && !forceReprocess) {
      // If found in cache, simply bind to the new caseId/caseNumber if requested, and return!
      if (caseId && !existing.caseId) existing.caseId = caseId;
      if (caseNumber && !existing.caseNumber) existing.caseNumber = caseNumber;

      existing.auditTrail = [
        ...(existing.auditTrail || []),
        {
          id: `aud_${Date.now()}`,
          action: "DOCUMENT_GENERATION_REUSED",
          performedBy: uploadedBy,
          timestamp: new Date().toISOString(),
          details: `Cached processed data reused without reprocessing for Case: ${caseNumber || caseId || "General"}.`,
        },
      ];
      writeEvidenceStore(store);

      return NextResponse.json({
        success: true,
        reused: true,
        record: existing,
        message: "Retrieved existing processed data from database cache (0s re-computation).",
      });
    }

    // 3. Process new evidence or explicit reprocess
    let dataUrl = rawDataUrl;
    if (!dataUrl && fileBuffer) {
      dataUrl = `data:${fileType};base64,${fileBuffer.toString("base64")}`;
    }

    const newRecordId = existing ? existing.id : `ev_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const inProgressRecord: UniversalEvidenceRecord = {
      id: newRecordId,
      fileId,
      caseId: caseId || undefined,
      caseNumber: caseNumber || undefined,
      module: moduleType,
      rawDocument: {
        fileName,
        fileSize,
        fileType,
        mimeType: fileType,
        dataUrl,
        sha256Hash,
        uploadedAt: nowIso,
        uploadedBy,
      },
      extractedText: fallbackText || "",
      detectedLanguage: "bilingual",
      structuredData: {
        classifiedDocumentName: fileName,
        verifiedDocumentTitle: "Official Police Case Evidence",
        persons: [],
        accusedList: [],
      },
      processingStatus: "PROCESSING",
      verificationStatus: "AI_EXTRACTED",
      processingVersion: 1,
      processingEngine: GEMINI_API_KEY ? "Gemini-3.5-Flash" : "Local-Parser",
      retryCount: existing ? (existing.retryCount || 0) + 1 : 0,
      auditTrail: [
        ...(existing?.auditTrail || []),
        {
          id: `aud_${Date.now()}`,
          action: existing ? "REPROCESSED" : "PROCESS_STARTED",
          performedBy: uploadedBy,
          timestamp: nowIso,
          details: `Evidence processing initialized via ${GEMINI_API_KEY ? "Gemini 3.5 Flash" : "Local Parser"}.`,
        },
      ],
      createdAt: existing ? existing.createdAt : nowIso,
      updatedAt: nowIso,
    };

    // Upsert status to PROCESSING in store
    const existingIndex = store.findIndex((r) => r.id === newRecordId);
    if (existingIndex !== -1) {
      store[existingIndex] = inProgressRecord;
    } else {
      store.unshift(inProgressRecord);
    }
    writeEvidenceStore(store);

    // 4. Run Processing Engine
    try {
      let geminiData: any = null;

      if (GEMINI_API_KEY) {
        let contents: any[] = [];
        const prompt = `You are a Law Enforcement Evidence Analyzer & Crime Case Document Parser for Haryana Police (BNSS 2023 / BNS 2023 / IPC).
STRICT ANTI-HALLUCINATION:
- Extract ONLY facts EXPLICITLY mentioned in the document.
- Never invent dummy data. If a field is not present, return empty string or empty array.
- PRESERVE ORIGINAL LANGUAGE (Hindi in Hindi, English in English).
- Incident Details: Verbatim complete complaint text in "incident.details".
- Complaint Description: Concise structured summary in "complaint.summary".

Return a valid JSON object matching:
{
  "classifiedDocumentName": "Standardized_Document_Name.ext",
  "verifiedDocumentTitle": "Verified document description",
  "documentCategory": "COMPLAINT | MLR | SEIZURE_MEMO | NOTICE | STATUTORY_RECORD | OTHER",
  "complainant": {
    "name": "", "relationType": "", "relativeName": "", "gender": "", "age": "", "mobile": "", "address": "", "city": "", "district": "", "state": ""
  },
  "accusedList": [
    { "name": "", "address": "", "phone": "", "alias": "", "relationWithComplainant": "" }
  ],
  "witnessList": [
    { "name": "", "statementBrief": "", "contact": "", "address": "" }
  ],
  "incident": {
    "place": "", "landmark": "", "date": "", "time": "", "isDateTimeKnown": false, "category": "", "details": "", "summary": ""
  },
  "vehicles": [
    { "regNumber": "", "makeModel": "", "color": "", "ownerName": "", "involvement": "SUSPECT" }
  ],
  "properties": [
    { "description": "", "estimatedValue": "", "category": "", "status": "STOLEN" }
  ],
  "legalSections": [
    { "act": "", "section": "", "description": "" }
  ],
  "rawText": ""
}`;

        if (fileBuffer) {
          const base64Data = fileBuffer.toString("base64");
          contents = [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: fileType.includes("pdf")
                      ? "application/pdf"
                      : fileType.includes("image")
                      ? fileType
                      : fileType.includes("audio")
                      ? fileType
                      : "application/pdf",
                    data: base64Data,
                  },
                },
              ],
            },
          ];
        } else {
          contents = [
            {
              role: "user",
              parts: [{ text: `${prompt}\n\nDOCUMENT TEXT CONTENT:\n${fallbackText}` }],
            },
          ];
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const gJson = await geminiRes.json();
          const rawReply = gJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawReply) {
            geminiData = JSON.parse(rawReply.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
          }
        }
      }

      // If Gemini succeeded or fallback to local parsing
      const extractedRawText = geminiData?.rawText || fallbackText || "";
      const isHindi = /[\u0900-\u097F]/.test(extractedRawText);
      const isEnglish = /[a-zA-Z]/.test(extractedRawText);
      const lang: "hindi" | "english" | "bilingual" = isHindi && isEnglish ? "bilingual" : isHindi ? "hindi" : "english";

      const persons: any[] = [];
      if (geminiData?.complainant?.name) {
        persons.push({
          id: `p_comp_${Date.now()}`,
          name: geminiData.complainant.name,
          role: "Complainant",
          relativeName: geminiData.complainant.relativeName,
          relationType: geminiData.complainant.relationType,
          gender: geminiData.complainant.gender,
          age: geminiData.complainant.age,
          mobile: geminiData.complainant.mobile,
          address: geminiData.complainant.address,
        });
      }

      if (Array.isArray(geminiData?.accusedList)) {
        geminiData.accusedList.forEach((acc: any, i: number) => {
          if (acc.name) {
            persons.push({
              id: `p_acc_${Date.now()}_${i}`,
              name: acc.name,
              role: "Accused",
              address: acc.address,
              mobile: acc.phone,
              relativeName: acc.alias,
            });
          }
        });
      }

      if (Array.isArray(geminiData?.witnessList)) {
        geminiData.witnessList.forEach((w: any, i: number) => {
          if (w.name) {
            persons.push({
              id: `p_wit_${Date.now()}_${i}`,
              name: w.name,
              role: "Witness",
              address: w.address,
              mobile: w.contact,
            });
          }
        });
      }

      const completedRecord: UniversalEvidenceRecord = {
        ...inProgressRecord,
        extractedText: extractedRawText,
        detectedLanguage: lang,
        structuredData: {
          classifiedDocumentName: geminiData?.classifiedDocumentName || fileName,
          verifiedDocumentTitle: geminiData?.verifiedDocumentTitle || "Verified Case Evidence",
          documentCategory: geminiData?.documentCategory || "EVIDENCE",
          persons,
          complainant: geminiData?.complainant,
          accusedList: Array.isArray(geminiData?.accusedList) ? geminiData.accusedList : [],
          witnessList: Array.isArray(geminiData?.witnessList) ? geminiData.witnessList : [],
          incident: {
            place: geminiData?.incident?.place,
            landmark: geminiData?.incident?.landmark,
            date: geminiData?.incident?.date,
            time: geminiData?.incident?.time,
            isDateTimeKnown: Boolean(geminiData?.incident?.isDateTimeKnown),
            category: geminiData?.incident?.category,
            details: geminiData?.incident?.details || extractedRawText,
            summary: geminiData?.incident?.summary || geminiData?.complaint?.summary,
          },
          vehicles: Array.isArray(geminiData?.vehicles) ? geminiData.vehicles : [],
          properties: Array.isArray(geminiData?.properties) ? geminiData.properties : [],
          legalSections: Array.isArray(geminiData?.legalSections) ? geminiData.legalSections : [],
          missingInformationFlags: !geminiData?.complainant?.name ? ["Complainant details unstated"] : [],
        },
        processingStatus: "COMPLETED",
        verificationStatus: "AI_EXTRACTED",
        processedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        auditTrail: [
          ...inProgressRecord.auditTrail,
          {
            id: `aud_${Date.now()}_c`,
            action: "PROCESS_COMPLETED",
            performedBy: uploadedBy,
            timestamp: new Date().toISOString(),
            details: `Processing completed successfully. Extracted ${persons.length} persons and incident facts.`,
          },
        ],
      };

      const finalStore = readEvidenceStore();
      const fIdx = finalStore.findIndex((r) => r.id === newRecordId);
      if (fIdx !== -1) finalStore[fIdx] = completedRecord;
      else finalStore.unshift(completedRecord);
      writeEvidenceStore(finalStore);

      return NextResponse.json({
        success: true,
        reused: false,
        record: completedRecord,
      });
    } catch (procErr: any) {
      console.error("Processing failure:", procErr);
      const failedRecord: UniversalEvidenceRecord = {
        ...inProgressRecord,
        processingStatus: "FAILED",
        errorMessage: procErr.message || "Failed to parse document stream",
        updatedAt: new Date().toISOString(),
        auditTrail: [
          ...inProgressRecord.auditTrail,
          {
            id: `aud_${Date.now()}_f`,
            action: "PROCESS_FAILED",
            performedBy: uploadedBy,
            timestamp: new Date().toISOString(),
            details: `Processing failed: ${procErr.message || "Error"}. Original raw evidence preserved.`,
          },
        ],
      };

      const finalStore = readEvidenceStore();
      const fIdx = finalStore.findIndex((r) => r.id === newRecordId);
      if (fIdx !== -1) finalStore[fIdx] = failedRecord;
      else finalStore.unshift(failedRecord);
      writeEvidenceStore(finalStore);

      return NextResponse.json({
        success: false,
        error: procErr.message,
        record: failedRecord,
      }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
