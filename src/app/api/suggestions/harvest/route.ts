import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { UniversalEvidenceRecord } from "@/types/evidence";
import { extractVocabulary } from "@/lib/vocabularyExtractor";

const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");



export async function GET(req: Request) {
 const apiUser=apiAccess(req);if(apiUser instanceof Response)return apiUser;
  try {
    let records: UniversalEvidenceRecord[] = [];
    if (fs.existsSync(EVIDENCE_STORE_PATH)) {
      const data = fs.readFileSync(EVIDENCE_STORE_PATH, "utf-8");
      records = JSON.parse(data);
    }

    const aggregatedWords = new Set<string>();
    const aggregatedPhrases = new Set<string>();

    for (const r of records) {
      // 1. Raw extracted text from PDF/Doc/OCR
      if (r.extractedText) {
        const res = extractVocabulary(r.extractedText);
        res.words.forEach((w) => aggregatedWords.add(w));
        res.phrases.forEach((p) => aggregatedPhrases.add(p));
      }

      // 2. Structured data fields
      if (r.structuredData) {
        const sd = r.structuredData;
        if (sd.verifiedDocumentTitle) aggregatedPhrases.add(sd.verifiedDocumentTitle);
        if (sd.classifiedDocumentName) aggregatedPhrases.add(sd.classifiedDocumentName);

        if (sd.complainant?.name) aggregatedPhrases.add(sd.complainant.name);
        if (sd.complainant?.address) aggregatedPhrases.add(sd.complainant.address);

        if (Array.isArray(sd.accusedList)) {
          sd.accusedList.forEach((acc: any) => {
            if (acc.name) aggregatedPhrases.add(acc.name);
            if (acc.address) aggregatedPhrases.add(acc.address);
          });
        }

        if (Array.isArray(sd.witnessList)) {
          sd.witnessList.forEach((w: any) => {
            if (w.name) aggregatedPhrases.add(w.name);
            if (w.address) aggregatedPhrases.add(w.address);
          });
        }

        if (sd.incident?.place) aggregatedPhrases.add(sd.incident.place);
        if (sd.incident?.landmark) aggregatedPhrases.add(sd.incident.landmark);
        if (sd.incident?.category) aggregatedPhrases.add(sd.incident.category);

        if (sd.incident?.summary) {
          const res = extractVocabulary(sd.incident.summary);
          res.words.forEach((w) => aggregatedWords.add(w));
          res.phrases.forEach((p) => aggregatedPhrases.add(p));
        }

        if (Array.isArray(sd.legalSections)) {
          sd.legalSections.forEach((sec: any) => {
            const secStr = typeof sec === "string" ? sec : sec?.section || sec?.name || "";
            if (secStr) {
              aggregatedWords.add(secStr);
              aggregatedPhrases.add(`धारा ${secStr}`);
              aggregatedPhrases.add(`Section ${secStr}`);
            }
          });
        }

        if (Array.isArray(sd.vehicles)) {
          sd.vehicles.forEach((v: any) => {
            if (v.regNumber || v.number) aggregatedWords.add(v.regNumber || v.number);
            if (v.model) aggregatedWords.add(v.model);
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalDocumentsScanned: records.length,
      words: Array.from(aggregatedWords).slice(0, 2000),
      phrases: Array.from(aggregatedPhrases).slice(0, 800),
    });
  } catch (err: any) {
    console.error("Error in /api/suggestions/harvest:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const body = await req.json();
    const text = body.text || "";
    const title = body.title || "";

    const { words, phrases } = extractVocabulary(text);
    if (title) phrases.unshift(title);

    return NextResponse.json({
      success: true,
      words,
      phrases,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
