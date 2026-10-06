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
Your task is to analyze the uploaded document image/PDF (e.g. Haryana Police Enquiry Report, Police Notice, NCR, Panchnama, or official legal document) and convert it into a structured, fully editable proforma table in ENGLISH.

CRITICAL INSTRUCTIONS:
1. Examine the visual document layout carefully:
   - Identify header lines: Top left (e.g. "POLICE DEPARTMENT"), Top right (e.g. "DISTRICT PANIPAT"), Sub-header (e.g. "Respected Sir,").
   - Identify the main case reference title: e.g. "ENQUIRY REPORT ON COMPLAINT NO. 128-SPL-III DATED 10.02.2026", or "ENQUIRY REPORT ON COMPLAINT NO. 1736...".
   - Identify whether the table is:
     a) STANDARD 2-COLUMN PROFORMA (like Haryana Police Formats 1, 2, 5 with rows: Complainant / Informant, Gist / Substance of Complaint, Opposite Party / Accused Details, Enquiry Findings & Action Taken). For this, keep "columns": [] (empty array) and put the row headers in "label", and row contents in "cells": [ "content..." ].
     b) MULTI-COLUMN COMPARATIVE TABLE (like 3-column Format with headers: "Allegations Leveled by Complainant (Point-wise)", "Enquiry Findings (Substantiated / Unsubstantiated with Reasons)", "Action Taken by Local Police / S.H.O."). For this, put the column headers in "columns": ["Col 1", "Col 2", "Col 3"] and row values in "cells": ["val 1", "val 2", "val 3"].
     c) CITIZEN GRIEVANCE PROFORMA (like CM Window / DCR with DEPARTMENT, CITIZEN DETAIL, ALLEGATIONS LEVELED, DATE, CITIZEN SATISFACTION, FINAL REPORT).
     d) NOTICE / ORDER (Notice u/s 35(3) BNSS, Notice u/s 179 BNSS, Order u/s 94 BNSS).
2. All labels, headings, and proforma text should be in clean ENGLISH. Translate Hindi labels cleanly into standard police terminology:
   - परिवादी -> "Complainant / Informant"
   - परिवाद का सार -> "Gist / Substance of Complaint"
   - उत्तरवादी का विवरण -> "Opposite Party / Accused Details"
   - जांच की स्थिती का विवरण -> "Enquiry Findings & Action Taken"
   - पुलिस विभाग -> "POLICE DEPARTMENT"
   - जिला -> "DISTRICT"
   - रिपोर्ट सेवा में पेश है। -> "Report is submitted for perusal and orders."
3. Extract content accurately while preserving names, dates, amounts, and facts verbatim.
4. Extract the officer's signature block:
   - officerName: e.g. "(Satish Kumar, HPS)"
   - officerRank: e.g. "Deputy Superintendent of Police" or "Assistant Superintendent of Police"
   - officerLocation: e.g. "Headquarters Panipat" or "Samalkha, Panipat"
   - reportDate: e.g. "Dated: 17.03.2026"
5. Set "borderStyle": "solid".

Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "documentType": "enquiry_report",
  "headerLeft": "POLICE DEPARTMENT",
  "headerRight": "DISTRICT PANIPAT",
  "subHeaderLeft": "Respected Sir,",
  "title": "ENQUIRY REPORT ON COMPLAINT NO...",
  "subTitle": "",
  "columns": [],
  "rows": [
    {
      "id": "row_1",
      "label": "Complainant / Informant",
      "cells": ["Full particulars..."]
    },
    {
      "id": "row_2",
      "label": "Gist / Substance of Complaint",
      "cells": ["Full particulars..."]
    },
    {
      "id": "row_3",
      "label": "Opposite Party / Accused Details",
      "cells": ["Full particulars..."]
    },
    {
      "id": "row_4",
      "label": "Enquiry Findings & Action Taken",
      "cells": ["Full enquiry findings..."]
    }
  ],
  "closingLine": "Report is submitted for perusal and orders.",
  "officerName": "(Satish Kumar, HPS)",
  "officerRank": "Deputy Superintendent of Police",
  "officerLocation": "Headquarters Panipat",
  "reportDate": "Dated: 17.03.2026",
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
