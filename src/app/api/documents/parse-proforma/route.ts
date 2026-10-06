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
    const prompt = `You are an elite Indian Police Document Digitizer & OCR Specialist for Haryana Police.
Your task is to analyze the uploaded document image/PDF (e.g. Haryana Police Enquiry Report / जांच रिपोर्ट, Police Notice, NCR, Panchnama, or official legal document) and convert it into a structured, fully editable proforma table.

CRITICAL INSTRUCTIONS:
1. Examine the visual document layout carefully:
   - Identify header lines: Top left (e.g. "विभाग" or "पुलिस विभाग"), Top right (e.g. "जिला पानीपत"), Sub-header (e.g. "श्रीमान जी").
   - Identify the main case reference title: e.g. "जांच रिपोर्ट परिवाद नम्बरी 128-SPL-III DT 10.02.2026", or "परिवाद नम्बरी 1736-पेशी दिनांक 19.12.2025...".
   - Identify whether the table is:
     a) STANDARD 2-COLUMN PROFORMA (like Haryana Police Formats 1, 2, 5 with rows: परिवादी, परिवाद का सार, उत्तरवादी का विवरण, जांच की स्थिती का विवरण). For this, keep "columns": [] (empty array) and put the row headers in "label", and row contents in "cells": [ "content..." ].
     b) MULTI-COLUMN COMPARATIVE TABLE (like 3-column Format with headers: "शिकायतकर्ता द्वारा लगाये गये आरोप (बिन्दूवार)", "जांच का विवरण (सही/गलत) बिन्दूवार कारण सहित", "स्थानीय पुलिस/ एस.एच.ओ. द्वारा की गई कार्यवाही"). For this, put the column headers in "columns": ["Col 1", "Col 2", "Col 3"] and row values in "cells": ["val 1", "val 2", "val 3"].
     c) CITIZEN GRIEVANCE PROFORMA (like CM Window / DCR with DEPARTMENT, CITIZEN DETAIL, लगाये गये आरोप, DATE, CITIZEN SATISFACTION, FINAL REPORT).
     d) NOTICE / ORDER (Notice u/s 35(3) BNSS, Notice u/s 179 BNSS, Order u/s 94 BNSS).
2. Extract EVERY piece of text VERBATIM without truncating, omitting, or summarizing.
3. Extract the closing line: e.g. "रिपोर्ट सेवा में पेश है।" or "रिपोर्ट सेवा में प्रस्तुत है।".
4. Extract the officer's signature block:
   - officerName: e.g. "(सतीश कुमार ह.पु.से.)"
   - officerRank: e.g. "उप पुलिस अधीक्षक" or "सहायक पुलिस अधीक्षक"
   - officerLocation: e.g. "मुख्यालय पानीपत" or "समालखा पानीपत"
   - reportDate: e.g. "दिनांक 17.03.26"
5. Set "borderStyle": "solid".

Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "documentType": "enquiry_report",
  "headerLeft": "पुलिस विभाग",
  "headerRight": "जिला पानीपत",
  "subHeaderLeft": "श्रीमान जी,",
  "title": "जांच रिपोर्ट परिवाद नम्बरी...",
  "subTitle": "",
  "columns": [],
  "rows": [
    {
      "id": "row_1",
      "label": "परिवादी",
      "cells": ["पूरी जानकारी..."]
    },
    {
      "id": "row_2",
      "label": "परिवाद का सार",
      "cells": ["पूरी जानकारी..."]
    },
    {
      "id": "row_3",
      "label": "उत्तरवादी का विवरण",
      "cells": ["पूरी जानकारी..."]
    },
    {
      "id": "row_4",
      "label": "जांच की स्थिती का विवरण",
      "cells": ["पूर्ण जांच विवरण..."]
    }
  ],
  "closingLine": "रिपोर्ट सेवा में पेश है।",
  "officerName": "(सतीश कुमार ह.पु.से.)",
  "officerRank": "उप पुलिस अधीक्षक",
  "officerLocation": "मुख्यालय पानीपत",
  "reportDate": "दिनांक 17.03.2026",
  "borderStyle": "solid",
  "rawText": "Word by word text extracted..."
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

    // Heuristic Fallback Parser
    const lines = (fallbackText || fileName)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const fallbackProforma = {
      documentType: "enquiry_report",
      headerLeft: "पुलिस विभाग",
      headerRight: "जिला पानीपत",
      subHeaderLeft: "",
      title: `जांच रिपोर्ट परिवाद (${fileName.replace(/\.[^/.]+$/, "")})`,
      subTitle: "",
      columns: [],
      rows: [
        {
          id: "row_1",
          label: "परिवादी",
          cells: [lines[0] || "परिवादी का नाम व पता"],
        },
        {
          id: "row_2",
          label: "परिवाद का सार",
          cells: [lines[1] || "शिकायत का संक्षिप्त विवरण"],
        },
        {
          id: "row_3",
          label: "उत्तरवादी का विवरण",
          cells: [lines[2] || "उत्तरवादी का नाम व पता"],
        },
        {
          id: "row_4",
          label: "जांच की स्थिती का विवरण",
          cells: [
            fallbackText ||
              "दौरान जांच परिवाद का अध्ययन किया गया व दोनों पक्षों को शामिल जांच कर पूछताछ की गई। साक्ष्य का अवलोकन कर रिपोर्ट तैयार की गई।",
          ],
        },
      ],
      closingLine: "रिपोर्ट सेवा में पेश है।",
      officerName: "(जांच अधिकारी)",
      officerRank: "सहायक पुलिस अधीक्षक",
      officerLocation: "समालखा पानीपत",
      reportDate: `दिनांक ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`,
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
