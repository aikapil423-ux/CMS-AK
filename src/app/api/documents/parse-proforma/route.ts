import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fallbackText = (formData.get("text") as string) || "";
    const targetType = (formData.get("targetType") as string) || "auto";

    if (!file && !fallbackText) {
      return NextResponse.json(
        { error: "No document file or text provided." },
        { status: 400 }
      );
    }

    const fileName = file?.name || "Uploaded_Document.pdf";
    const prompt = `You are an elite Indian Police Document Digitizer & Analysis Specialist for Haryana Police.
Your task is to analyze the uploaded document (PDF, Word DOCX, Image, Text) and mirror its structure WORD-TO-WORD into a fully editable digital template in its EXACT ORIGINAL LANGUAGE.

CRITICAL INSTRUCTIONS:
1. PRESERVE ORIGINAL LANGUAGE & PHRASING WORD-TO-WORD:
   - If the document is in HINDI, keep all headings, labels, and text in HINDI (देवनागरी). Do NOT translate to English!
   - If the document is in ENGLISH, keep all text in ENGLISH.
   - If the document is BILINGUAL, preserve the exact bilingual text.
   - Mirror the exact words, statutory section numbers, dates, titles, and layout verbatim!

2. EXAMINE VISUAL STRUCTURE & MIRROR EXACT LAYOUT:
   - Identify header lines: Top left (e.g. "हरियाणा पुलिस" / "POLICE DEPARTMENT"), Top right (e.g. "जिला पानीपत" / "DISTRICT PANIPAT"), Sub-header (e.g. "श्रीमान जी," / "Respected Sir,").
   - Identify the main case reference title: e.g. "जांच रिपोर्ट बाबत दरखास्त न. 128-SPL..." or "REQUISITION PROFORMA FOR CDR..." or "NOTICE OF APPEARANCE U/S 173(3) BNSS...".
   - Identify table or key-value format:
     a) STANDARD PROFORMA (with rows: Complainant, Gist, Opposite Party, Findings, or custom rows). For this, keep "columns": [] (empty array) and put row labels in "label" and contents in "cells": [ "content..." ].
     b) MULTI-COLUMN TABLE (e.g. 3-column with headers like Allegations, Findings, Action Taken). Put column titles in "columns": ["...", "..."] and row values in "cells": ["...", "..."].
     c) REQUISITION / NOTICE / MEMO (e.g. NATGRID table, CDR proforma, Arrest Memo, 173(3) notice). Extract all labeled rows and clauses word-to-word.
   - Extract clauses/sections for notice templates: "clauses": [ { "id": "clause_1", "title": "...", "content": "..." } ].

3. Extract the officer's signature block word-to-word:
   - officerName: e.g. "(Satish Kumar, HPS)" or "(सतीश कुमार, उप पुलिस अधीक्षक)"
   - officerRank: e.g. "Deputy Superintendent of Police" or "उप पुलिस अधीक्षक"
   - officerLocation: e.g. "Headquarters Panipat" or "मुख्यालय पानीपत"
   - reportDate: date mentioned on document
   - closingLine: closing greeting/submission phrase from document

Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "documentType": "enquiry_report",
  "language": "hindi | english | bilingual",
  "headerLeft": "Top left header",
  "headerRight": "Top right header",
  "subHeaderLeft": "Sub header if any",
  "title": "Main document title",
  "subTitle": "Subtitle if any",
  "columns": [],
  "rows": [
    {
      "id": "row_1",
      "label": "Original Row Label",
      "cells": ["Exact original cell content..."]
    }
  ],
  "clauses": [
    {
      "id": "clause_1",
      "title": "Clause / Section Title",
      "content": "Clause body text word-to-word..."
    }
  ],
  "closingLine": "Closing submission line",
  "officerName": "Officer Name",
  "officerRank": "Officer Rank",
  "officerLocation": "Police Station / District",
  "reportDate": "Date",
  "borderStyle": "solid",
  "rawText": "Extracted text..."
}`;

    if (GEMINI_API_KEY) {
      let contents: any[] = [];

      if (file) {
        let mimeType = file.type || "";
        const lowerName = file.name.toLowerCase();
        if (!mimeType || mimeType === "application/octet-stream") {
          if (lowerName.endsWith(".pdf")) mimeType = "application/pdf";
          else if (lowerName.endsWith(".png")) mimeType = "image/png";
          else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) mimeType = "image/jpeg";
          else if (lowerName.endsWith(".webp")) mimeType = "image/webp";
          else if (lowerName.endsWith(".txt")) mimeType = "text/plain";
          else mimeType = "application/pdf";
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Data = buffer.toString("base64");

        contents = [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              {
                text: `Document Name: "${fileName}". Target mode: ${targetType}. Extract the entire proforma and all fields into the requested JSON.`,
              },
            ],
          },
        ];
      } else {
        contents = [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                text: `Extracted Document Text:\n${fallbackText}`,
              },
            ],
          },
        ];
      }

      const candidateModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.5-pro",
      ];

      for (const model of candidateModels) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
          const geminiRes = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
              const cleaned = textResponse
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/```$/i, "")
                .trim();
              const parsed = JSON.parse(cleaned);

              // Ensure rows have IDs
              if (Array.isArray(parsed.rows)) {
                parsed.rows = parsed.rows.map((r: any, idx: number) => ({
                  id: r.id || `row_${idx + 1}`,
                  label: r.label || `पंक्ति ${idx + 1}`,
                  cells: Array.isArray(r.cells) ? r.cells : [r.cells || ""],
                }));
              }

              return NextResponse.json({
                success: true,
                modelUsed: model,
                proformaData: parsed,
              });
            }
          }
        } catch (err: any) {
          console.warn(`Model ${model} error:`, err?.message);
        }
      }
    }

    // Heuristic Fallback Parser: Word-to-word mirroring without inventing text
    const lines = (fallbackText || fileName)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const docTitle = lines[0] || fileName.replace(/\.[^/.]+$/, "");
    const parsedRows = lines.slice(1).map((line, idx) => {
      const match = line.match(/^([^:-]{2,40})[:\-]\s*(.*)$/);
      if (match) {
        return {
          id: `row_${idx + 1}`,
          label: match[1].trim(),
          cells: [match[2].trim() || "—"],
        };
      }
      return {
        id: `row_${idx + 1}`,
        label: `Item ${idx + 1}`,
        cells: [line],
      };
    });

    const fallbackProforma = {
      documentType: "enquiry_report",
      headerLeft: "",
      headerRight: "",
      subHeaderLeft: "",
      title: docTitle,
      subTitle: "",
      columns: [],
      rows: parsedRows.length > 0 ? parsedRows : [{ id: "row_1", label: docTitle, cells: [fallbackText || fileName] }],
      clauses: parsedRows.map((r, i) => ({ id: `clause_${i + 1}`, title: r.label, content: r.cells[0] })),
      closingLine: "",
      officerName: "",
      officerRank: "",
      officerLocation: "",
      reportDate: new Date().toLocaleDateString("en-GB").replace(/\//g, "."),
      borderStyle: "solid",
      rawText: fallbackText,
    };

    return NextResponse.json({
      success: true,
      modelUsed: "heuristic-parser",
      proformaData: fallbackProforma,
    });
  } catch (error: any) {
    console.error("Error in parse-proforma route:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
