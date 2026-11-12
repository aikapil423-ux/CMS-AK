import { canAccessEvidenceCase } from "@/services/evidenceCaseAccess";
import { processingAIAvailable, PROCESSING_MODEL, processWithAI } from "@/lib/geminiProcessing";
import { apiAccess } from "@/lib/apiSecurity";
import { after, NextRequest, NextResponse } from "next/server";
import { authorizedAnalysisFir, refreshCaseAnalysis } from "@/services/caseAnalysisService";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UniversalEvidenceRecord, EvidenceModuleType } from "@/types/evidence";
import { extractVocabulary } from "@/lib/vocabularyExtractor";
import { losslessCompressionService } from "@/services/losslessCompressionService";
import { investigationPrompts, normalizeInvestigation, withInvestigationPrompt } from "@/services/investigationPromptService";

export const maxDuration = 300;
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
    throw new Error("Evidence could not be saved. Please retry.");
  }
}

function computeSha256(buffer: Buffer | string): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export async function POST(req: NextRequest) {
  const apiUser = await apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fallbackText = (formData.get("text") as string) || "";
    const rawDataUrl = (formData.get("dataUrl") as string) || "";
    const fileId = (formData.get("fileId") as string) || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const caseId = (formData.get("caseId") as string) || "";
    const caseNumber = (formData.get("caseNumber") as string) || "";
    const moduleType = ((formData.get("module") as string) || "COMPLAINTS") as EvidenceModuleType;
    if (!await canAccessEvidenceCase(apiUser, { module: moduleType, caseId })) {
      return NextResponse.json({error:'Case not found or access denied.'},{status:404});
    }
    const uploadedBy = apiUser.name;
    const forceReprocess = formData.get("forceReprocess") === "true";
    const deferCaseAnalysis = formData.get('deferCaseAnalysis') === 'true';

    if (!file && !fallbackText && !rawDataUrl) {
      return NextResponse.json({ success: false, error: "No document file or text content provided." }, { status: 400 });
    }

    const fileName = file ? file.name : (formData.get("fileName") as string) || "evidence_document.pdf";
    const fileSize = file ? file.size : rawDataUrl ? Math.round(rawDataUrl.length * 0.75) : fallbackText.length;
    const fileType = file ? file.type || "application/octet-stream" : rawDataUrl.match(/^data:([^;,]+)/)?.[1] || (fallbackText ? 'text/plain' : 'application/pdf');

    // 1. Compute checksum to enforce Process-Once-and-Reuse-Everywhere
    let fileBuffer: Buffer | null = null;
    let sha256Hash = "";

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      sha256Hash = computeSha256(fileBuffer);
    } else if (rawDataUrl) {
      fileBuffer = Buffer.from(rawDataUrl.split(",")[1] || "", "base64");
      sha256Hash = computeSha256(fileBuffer);
    } else {
      sha256Hash = computeSha256(fallbackText);
    }

    // 2. CHECK CACHE: If already processed and COMPLETED, reuse immediately without re-running AI/OCR!
    const store = readEvidenceStore();
    const existing = store.find(
      (r) =>
        r.ownerId === apiUser.id && r.caseId === (caseId || undefined) && r.rawDocument?.sha256Hash === sha256Hash
    );

    const activePromptAudit = processingAIAvailable() ? investigationPrompts().audit : undefined;
    const storedPromptAudit = existing?.structuredData?.investigation?.promptAudit;
    const promptUnchanged = !activePromptAudit || (storedPromptAudit?.extractionHash === activePromptAudit.extractionHash && storedPromptAudit?.resolutionHash === activePromptAudit.resolutionHash);
    if (existing?.processingStatus === 'PROCESSING' && Date.now() - Date.parse(existing.updatedAt) < 600000) return NextResponse.json({ success: false, error: 'This evidence is already processing. Retry shortly.' }, { status: 409 });
    if (existing?.processingStatus === 'COMPLETED' && !forceReprocess && promptUnchanged) {
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
      ownerId: apiUser.id,
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
        uploadedAt: existing?.rawDocument.uploadedAt || nowIso,
        uploadedBy: existing?.rawDocument.uploadedBy || uploadedBy,
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
      processingEngine: processingAIAvailable() ? PROCESSING_MODEL : "Local-Parser",
      retryCount: existing ? (existing.retryCount || 0) + 1 : 0,
      auditTrail: [
        ...(existing?.auditTrail || []),
        {
          id: `aud_${Date.now()}`,
          action: existing ? "REPROCESSED" : "PROCESS_STARTED",
          performedBy: uploadedBy,
          timestamp: nowIso,
          details: `Evidence processing initialized via ${processingAIAvailable() ? PROCESSING_MODEL : "Local Parser"}.`,
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
      let extractedData: any = null;
      let promptAudit: ReturnType<typeof withInvestigationPrompt>['audit'] | undefined;

      if (processingAIAvailable()) {
        let contents: any[] = [];
        const cmsPrompt = `You are a Law Enforcement Evidence Analyzer & Crime Case Document Parser for Haryana Police (BNSS 2023 / BNS 2023 / IPC).
STRICT ANTI-HALLUCINATION:
- Extract ONLY facts EXPLICITLY mentioned in the document.
- Never invent dummy data. If a field is not present, return empty string or empty array.
- PRESERVE ORIGINAL LANGUAGE (Hindi in Hindi, English in English).
- Put the verbatim complete document text in "rawText". Leave "incident.details" empty to reuse that transcript without duplicating it in the response.
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

        const referencePrompt = withInvestigationPrompt(cmsPrompt, newRecordId);
        const prompt = referencePrompt.text;
        promptAudit = referencePrompt.audit;

        if (fileBuffer) {
          const base64Data = fileBuffer.toString("base64");
          contents = [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: fileType,
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

        const reply = await processWithAI(contents[0].parts, {
          json: true, maxTokens: 32768, timeout: 240000,
          system: 'Extract concise structured facts. Transcribe the source once in rawText; do not repeat the full transcript in other fields. Return all required investigation arrays, using empty arrays when no supported facts exist.',
        });
        extractedData = JSON.parse(reply);
      }

      // Use the AI result or local parsing when AI is unconfigured
      if (processingAIAvailable() && (!extractedData || !Array.isArray(extractedData.investigation?.entities))) throw new Error('AI entity extraction did not return the required investigation data. Original evidence is retained; retry processing.');
      if (!extractedData && !fallbackText.trim()) {
        throw new Error("Document text could not be extracted. Configure the AI service or provide extracted text, then retry processing. Original evidence is retained.");
      }
      const extractedRawText = extractedData?.rawText || extractedData?.incident?.details || fallbackText || "";
      const isHindi = /[\u0900-\u097F]/.test(extractedRawText);
      const isEnglish = /[a-zA-Z]/.test(extractedRawText);
      const lang: "hindi" | "english" | "bilingual" = isHindi && isEnglish ? "bilingual" : isHindi ? "hindi" : "english";

      const persons: any[] = [];
      if (extractedData?.complainant?.name) {
        persons.push({
          id: `p_comp_${Date.now()}`,
          name: extractedData.complainant.name,
          role: "Complainant",
          relativeName: extractedData.complainant.relativeName,
          relationType: extractedData.complainant.relationType,
          gender: extractedData.complainant.gender,
          age: extractedData.complainant.age,
          mobile: extractedData.complainant.mobile,
          address: extractedData.complainant.address,
        });
      }

      if (Array.isArray(extractedData?.accusedList)) {
        extractedData.accusedList.forEach((acc: any, i: number) => {
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

      if (Array.isArray(extractedData?.witnessList)) {
        extractedData.witnessList.forEach((w: any, i: number) => {
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

      // Perform Lossless Compression & Cryptographic Integrity Verification
      let compressionMeta = undefined;
      let compressionAudit = null;
      try {
        const rawBuf =
          fileBuffer ||
          (dataUrl.includes(",") ? Buffer.from(dataUrl.split(",")[1], "base64") : null);
        if (rawBuf) {
          const compResult = await losslessCompressionService.compressAndVerify(
            rawBuf,
            fileName,
            fileType
          );
          compressionMeta = compResult.metadata;
          if (compressionMeta.status === "VERIFIED_LOSSLESS") {
            compressionAudit = {
              id: `aud_${Date.now()}_comp`,
              action: "PROCESS_COMPLETED" as const,
              performedBy: "Lossless Compression Engine",
              timestamp: new Date().toISOString(),
              details: `Lossless compression verified: ${compressionMeta.savedPercentage}% saved (${(compressionMeta.savedBytes / 1024).toFixed(1)} KB reduction). SHA-256 integrity check passed.`,
            };
          } else {
            compressionAudit = {
              id: `aud_${Date.now()}_comp`,
              action: "PROCESS_COMPLETED" as const,
              performedBy: "Lossless Compression Engine",
              timestamp: new Date().toISOString(),
              details: `Original authoritative file retained (${compressionMeta.failureReason || "Optimal format"}).`,
            };
          }
        }
      } catch (cErr: any) {
        console.warn("[ProcessRoute] Lossless compression non-blocking error:", cErr);
      }

      const completedRecord: UniversalEvidenceRecord = {
        ...inProgressRecord,
        extractedText: extractedRawText,
        detectedLanguage: lang,
        structuredData: {
          investigation: extractedData?.investigation && promptAudit ? normalizeInvestigation(extractedData.investigation, newRecordId, extractedRawText, promptAudit) : undefined,
          classifiedDocumentName: extractedData?.classifiedDocumentName || fileName,
          verifiedDocumentTitle: extractedData?.verifiedDocumentTitle || "Verified Case Evidence",
          documentCategory: extractedData?.documentCategory || "EVIDENCE",
          persons,
          complainant: extractedData?.complainant,
          accusedList: Array.isArray(extractedData?.accusedList) ? extractedData.accusedList : [],
          witnessList: Array.isArray(extractedData?.witnessList) ? extractedData.witnessList : [],
          incident: {
            place: extractedData?.incident?.place,
            landmark: extractedData?.incident?.landmark,
            date: extractedData?.incident?.date,
            time: extractedData?.incident?.time,
            isDateTimeKnown: Boolean(extractedData?.incident?.isDateTimeKnown),
            category: extractedData?.incident?.category,
            details: extractedData?.incident?.details || extractedRawText,
            summary: extractedData?.incident?.summary || extractedData?.complaint?.summary,
          },
          vehicles: Array.isArray(extractedData?.vehicles) ? extractedData.vehicles : [],
          properties: Array.isArray(extractedData?.properties) ? extractedData.properties : [],
          legalSections: Array.isArray(extractedData?.legalSections) ? extractedData.legalSections : [],
          missingInformationFlags: !extractedData?.complainant?.name ? ["Complainant details unstated"] : [],
        },
        processingStatus: "COMPLETED",
        verificationStatus: "AI_EXTRACTED",
        compression: compressionMeta,
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
          ...(compressionAudit ? [compressionAudit] : []),
        ],
      };

      const finalStore = readEvidenceStore();
      const fIdx = finalStore.findIndex((r) => r.id === newRecordId);
      if (fIdx !== -1) finalStore[fIdx] = completedRecord;
      else finalStore.unshift(completedRecord);
      writeEvidenceStore(finalStore);

      // Evidence is safely saved before the case-wide AI pass. Failure never discards the upload.
      if (moduleType === "FIR" && caseId && !deferCaseAnalysis) after(async () => {
        try {
          const fir = await authorizedAnalysisFir(caseId, apiUser);
          if (fir) await refreshCaseAnalysis(fir, apiUser);
        } catch (error) { console.error("Case comparison refresh failed; saved evidence retained:", error); }
      });

      const harvested = extractVocabulary(completedRecord.extractedText || "");
      if (completedRecord.structuredData?.classifiedDocumentName) {
        harvested.phrases.unshift(completedRecord.structuredData.classifiedDocumentName);
      }
      if (completedRecord.structuredData?.complainant?.name) {
        harvested.phrases.unshift(completedRecord.structuredData.complainant.name);
      }

      return NextResponse.json({
        success: true,
        reused: false,
        record: completedRecord,
        harvestedVocabulary: harvested,
      });
    } catch (procErr: any) {
      console.error("Processing failure:", procErr);
      const failedRecord: UniversalEvidenceRecord = {
        ...inProgressRecord,
        extractedText: "",
        structuredData: { classifiedDocumentName: fileName, verifiedDocumentTitle: "", persons: [], accusedList: [] },
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
