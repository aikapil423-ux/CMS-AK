import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { UniversalEvidenceRecord } from "@/types/evidence";

const EVIDENCE_STORE_PATH = path.join(process.cwd(), "prisma", "processed-evidence-store.json");

// Words to exclude (common stopwords in English and Hindi)
const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "from", "for", "are", "was", "were", "been", "have", "has", "had",
  "what", "when", "where", "which", "who", "whom", "will", "would", "shall", "should", "can", "could", "may",
  "might", "must", "about", "above", "after", "again", "against", "all", "any", "both", "each", "few", "more",
  "most", "other", "some", "such", "than", "too", "very", "you", "your", "they", "them", "their", "there",
  "here", "just", "into", "over", "under", "also", "only", "then", "once", "here", "why", "how", "while",
  "और", "कि", "यह", "वह", "है", "हैं", "था", "थी", "थे", "का", "के", "की", "को", "में", "पर", "से", "ने",
  "तक", "तो", "भी", "ही", "या", "एवं", "तथा", "गया", "गई", "गए", "किया", "किए", "की", "रहा", "रही", "रहे",
  "दिया", "दिए", "हुए", "हुआ", "हुई", "होने", "करने", "होता", "होती", "होते", "सकता", "सकती", "सकते", "पास",
  "साथ", "अपने", "अपनी", "अपना", "इन", "उन", "इन्होंने", "उन्होंने", "इसके", "उसके", "जिसके", "जिनके"
]);

function cleanToken(token: string): string {
  return token.replace(/[^\p{L}\p{N}\-_/.]/gu, "").trim();
}

/**
 * Extracts distinct police, legal, and case words & multi-word phrases
 * from a body of text.
 */
export function extractVocabulary(rawText: string): { words: string[]; phrases: string[] } {
  if (!rawText || typeof rawText !== "string") {
    return { words: [], phrases: [] };
  }

  const wordCounts = new Map<string, number>();
  const phraseCounts = new Map<string, number>();

  // Split into sentences / segments
  const sentences = rawText
    .split(/[\n\r।!?.]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  for (const sentence of sentences) {
    const rawTokens = sentence.split(/\s+/).filter(Boolean);
    const tokens: string[] = [];

    for (const t of rawTokens) {
      const clean = cleanToken(t);
      if (clean.length >= 3 && !/^\d+$/.test(clean)) {
        tokens.push(clean);
        const lower = clean.toLowerCase();
        if (!STOPWORDS.has(lower) && !STOPWORDS.has(clean)) {
          wordCounts.set(clean, (wordCounts.get(clean) || 0) + 1);
        }
      }
    }

    // Extract 2-to-4 word phrases (bi-grams & tri-grams)
    for (let i = 0; i < tokens.length - 1; i++) {
      const t1 = tokens[i];
      const t2 = tokens[i + 1];
      if (t1.length >= 2 && t2.length >= 2) {
        const bi = `${t1} ${t2}`;
        phraseCounts.set(bi, (phraseCounts.get(bi) || 0) + 1);
      }

      if (i < tokens.length - 2) {
        const t3 = tokens[i + 2];
        if (t3.length >= 2) {
          const tri = `${t1} ${t2} ${t3}`;
          phraseCounts.set(tri, (phraseCounts.get(tri) || 0) + 1);
        }
      }
    }
  }

  // Sort by occurrence frequency
  const sortedWords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 1500);

  const sortedPhrases = Array.from(phraseCounts.entries())
    .filter(([_, count]) => count >= 1)
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p)
    .slice(0, 500);

  return { words: sortedWords, phrases: sortedPhrases };
}

export async function GET() {
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
