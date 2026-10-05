import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-3.5-flash";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fallbackText = (formData.get("text") as string) || "";

    if (!file && !fallbackText) {
      return NextResponse.json(
        { error: "No document or text file was uploaded." },
        { status: 400 }
      );
    }

    let contents: any[] = [];
    const prompt = `You are an elite Law Enforcement Document Analyzer & Evidence Classifier for Indian Police (CMS Haryana / BNSS 2023 / IPC).

TASK 1: CLASSIFY & RENAME DOCUMENT (CRITICAL)
- The uploaded file's original name may be wrong, ambiguous, or misleading (e.g. "IMG_1234.jpg", "document.pdf", "complaint.docx", "WhatsApp_Audio.mp3", or even named something false like "bill.pdf" while the actual content inside is an extortion complaint).
- Analyze the ACTUAL LEGAL CONTENT inside this document/image/audio.
- Classify the document type and contents precisely (e.g., "Handwritten_Shikayat_Cheating_Fraud_5Lakhs.jpg", "Scanned_Legal_Complaint_Land_Encroachment_Khasra.pdf", "Evidence_Audio_Threat_Call_Recording.mp3", "MLR_Medical_Injury_Report_Assault.pdf", "CCTV_Snapshot_Theft_Suspect.jpg", "Bank_Account_Statement_UPI_Fraud.pdf").
- Provide a clean, official, and standardized sanitized filename: \`classifiedDocumentName\`.
- Provide a one-sentence verification note: \`verifiedDocumentTitle\`.

TASK 2: WORD-TO-WORD VERBATIM TRANSCRIPTION FOR DESCRIPTION (HIGH PRIORITY)
- In the "complaint.description" field, you MUST extract the verbatim, word-to-word text from the uploaded document exactly as written (in Hindi, English, Hinglish, or original language). Do NOT summarize, compress, or paraphrase. The user requires: "jesa hai vese ka vese word to word description in complaint details me fill ho jana chye".
- If the document has a written application, petition body, or narration, copy the entire narrative verbatim into "complaint.description" and "incident.details".

TASK 3: EXTRACT ALL COMPLAINT REGISTER FIELDS
Read and extract all particulars from this document to populate the Police Station Complaint Registration Register. If any specific detail is not explicitly mentioned in the document, provide a realistic police intake placeholder or reasonable inference based on the text:
1. Complainant Details:
   - Full Name
   - Relation (must be one of: "S/O", "D/O", "W/O", "C/O")
   - Relative Name (father / husband name)
   - Gender ("MALE", "FEMALE", or "TRANSGENDER")
   - Age (number as string, e.g. "38")
   - Mobile Number (10 digits)
   - Present Address (House / Street / Locality)
   - City / Village
   - District (e.g. "Kurukshetra")
   - State (e.g. "Haryana")
   - Nationality ("Indian" or other)
2. Accused Details:
   - isAccusedKnown (boolean: true if accused person or entity is named/known, false if unidentified/unknown)
   - Accused Full Name (or alias, e.g. "Raju @ Pehalwan" or "Unknown thief")
   - Accused Address or identifiable details
3. Incident Details:
   - Place of Incident (specific location or landmark)
   - Date of Incident (YYYY-MM-DD if known)
   - Time of Incident (HH:MM if known)
   - isDateTimeKnown (boolean)
   - Class of Incident (must strictly match one of: "FINANCIAL_FRAUD_CHEATING", "CYBER_CRIME", "LAND_PROPERTY_DISPUTE", "PHYSICAL_ASSAULT_AFFRAY", "PROPERTY_THEFT_BURGLARY", "DOMESTIC_VIOLENCE_DOWRY", "PUBLIC_NUISANCE", "MISSING_PERSON", "NARCOTICS_DRUGS_INFO", "HARASSMENT_STALKING", "OTHER_GENERAL")
   - Facts of Details / Detailed Allegations: Verbatim complete narrative of events, weapons, amounts, witnesses, etc. as described in document.
4. Complaint Details:
   - Mode of Intake (one of: "WALK_IN_STATION", "CM_WINDOW_HARYANA", "CITIZEN_PORTAL_HARPATH", "EMERGENCY_112", "SP_OFFICE_REFERENCE", "POSTAL_APPLICATION", "WOMEN_HELPDESK")
   - Subject (Precise legal subject line for the complaint)
   - Description (CRITICAL: Verbatim word-to-word full text transcript of the application / complaint body from the document)
   - Type of Complaint ("FRESH" or "OLD")
   - Is FIR Registered (boolean: false unless expressly mentions FIR already registered)
   - FIR Number (if registered, else empty)

Return ONLY a valid, parseable JSON object matching this schema without markdown code blocks, backticks, or other text:
{
  "classifiedDocumentName": "Standardized_Document_Name.ext",
  "verifiedDocumentTitle": "Verified document description",
  "complainant": {
    "name": "Full Name",
    "relationType": "S/O",
    "relativeName": "Father / Husband Name",
    "gender": "MALE",
    "age": "35",
    "mobile": "9812345678",
    "presentAddress": "Address details",
    "city": "Thanesar",
    "district": "Kurukshetra",
    "state": "Haryana",
    "nationality": "Indian"
  },
  "accused": {
    "isKnown": true,
    "name": "Accused Name",
    "address": "Accused Address"
  },
  "incident": {
    "place": "Incident Location",
    "date": "2026-03-20",
    "time": "14:30",
    "isDateTimeKnown": true,
    "category": "FINANCIAL_FRAUD_CHEATING",
    "details": "Verbatim word-to-word text of the incident narration from document..."
  },
  "complaint": {
    "mode": "WALK_IN_STATION",
    "subject": "Complaint regarding...",
    "description": "Verbatim word-to-word exact text of the application / complaint from document...",
    "type": "FRESH",
    "isFirRegistered": false,
    "firNumber": ""
  }
}`;

    if (file) {
      const mimeType = file.type || "application/octet-stream";
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
              text: `Original File Name provided by user: "${file.name}" (Warning: verify content to see if filename is inaccurate or misleading, then produce the real classified name and extract all fields).`,
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
              text: `Document text content:\n${fallbackText}`,
            },
          ],
        },
      ];
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

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

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API Error:", geminiRes.status, errText);
      return NextResponse.json(
        {
          error: `Gemini API returned error (${geminiRes.status}): ${errText}`,
        },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json(
        { error: "No response text received from Gemini model." },
        { status: 500 }
      );
    }

    // Clean JSON if needed
    const cleanJson = rawText.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({
      success: true,
      data: parsedData,
      modelUsed: GEMINI_MODEL,
    });
  } catch (error: any) {
    console.error("Autofill processing error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process document with Gemini AI" },
      { status: 500 }
    );
  }
}
