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

TASK 0: LANGUAGE FIDELITY (जैसी शिकायत है हू-ब-हू उसी भाषा में रखें)
- STRICT USER REQUIREMENT: "jese hai complaint vese language me rhe".
- If the uploaded document is in Hindi (देवनागरी लिपि), ALL extracted textual fields (Complainant Name, Relative Name, Address, Accused Names, Subject, Description, Incident Details) MUST REMAIN 100% IN HINDI.
- ABSOLUTELY DO NOT TRANSLATE Hindi text into English! (e.g., keep "काजल", NOT "Kajal"; keep "दरखास्त बराये...", NOT English translation; keep "गांव कुटानी, जिला पानीपत", NOT "Village Kutani...").
- Keep the original wording, phrasing, and Devanagari script intact.

TASK 1: CLASSIFY & RENAME DOCUMENT (CRITICAL)
- The uploaded file's original name may be wrong, ambiguous, or misleading (e.g. "IMG_1234.jpg", "document.pdf", "complaint.docx", "WhatsApp_Audio.mp3", or even named something false like "bill.pdf" while the actual content inside is an extortion complaint).
- Analyze the ACTUAL LEGAL CONTENT inside this document/image/audio.
- Classify the document type and contents precisely (e.g., "Shikayat_Dahej_Utpidan_Kajal_v_Romi.pdf", "Handwritten_Shikayat_Cheating_Fraud_5Lakhs.jpg", "Scanned_Legal_Complaint_Land_Encroachment_Khasra.pdf", "MLR_Medical_Injury_Report_Assault.pdf").
- Provide a clean, official, and standardized sanitized filename: "classifiedDocumentName".
- Provide a one-sentence verification note: "verifiedDocumentTitle".

TASK 2: 100% EXACT WORD-BY-WORD VERBATIM TRANSCRIPTION FOR DESCRIPTION (ABSOLUTE MANDATORY REQUIREMENT)
- In the "complaint.description" field, you MUST transcribe the ENTIRE document text WORD-BY-WORD (शब्द-ब-शब्द / हू-ब-हू) exactly as written in the uploaded document/image/petition.
- STRICT RULE: Do NOT summarize. Do NOT shorten. Do NOT skip any words, sentences, dates, greetings, or sign-offs. The entire verbatim body of the complaint as written by the citizen (whether in Hindi, English, or mixed) must be placed in full inside "complaint.description".
- The user's exact instruction: "sthe me complaint details me descripation me jo bhi document upload hua hai vo word by word likha jaaye usme kam na ho baaki filled shi fill hui thi".
- Also mirror this exact full narrative in "incident.details".

TASK 3: EXTRACT ALL COMPLAINT REGISTER FIELDS
Read and extract all particulars from this document to populate the Police Station Complaint Registration Register. Keep fields in the original language of the document (Hindi in Hindi):
1. Complainant Details:
   - Full Name (in original language, e.g. "काजल")
   - Relation (must be one of: "S/O", "D/O", "W/O", "C/O")
   - Relative Name (father / husband name in original language, e.g. "रोमी उर्फ सत्यम" or "दिलबाग सिंह")
   - Gender ("MALE", "FEMALE", or "TRANSGENDER")
   - Age (number as string, e.g. "20" from DOB 29/08/2005 on Aadhaar card)
   - Mobile Number (10 digits, e.g. "8168270722" or "9050258485")
   - Present Address (House / Street / Locality in original language, e.g. "गांव महावटी, तहसील समालखा, जिला पानीपत")
   - City / Village (e.g. "महावटी")
   - District (e.g. "पानीपत" / "Panipat")
   - State (e.g. "हरियाणा" / "Haryana")
   - Nationality ("Indian" or other)
2. Accused / Suspect Details (CRITICAL - EXTRACT EVERY ACCUSED PERSON INTO A SEPARATE CARD):
   - In Indian police complaints under "विषय: ... बरखिलाफ:-", "विरुद्ध:-", "आरोपीगण:-", or numbered list (1., 2., 3., 4., etc.), inspect all named accused.
   - For example:
     1. रोमी उर्फ सत्यम पुत्र सुरेन्द्र सिंह (पति) मो0 नं0 9485636036
     2. सुरेन्द्र सिंह पुत्र श्री हुकम चन्द (ससुर) मो0 नं0 8397816075
     3. नीलम पत्नी सुरेन्द्र (सास) मो0 नं0 9499408983
     4. सोनिया पुत्री सुरेन्द्र (ननंद)
     सभी निवासीगण गांव कुटानी, जिला पानीपत
   - YOU MUST CREATE 4 SEPARATE OBJECTS in "accusedList" for the 4 individuals above!
   - NEVER combine multiple accused into 1 card! NEVER return only 1 accused when multiple are listed!
   - If a shared address is mentioned ("सभी निवासीगण गांव कुटानी, जिला पानीपत"), copy that full address to EVERY accused card.
   - For EACH accused person:
     * name: Individual's name only (e.g. "रोमी उर्फ सत्यम" or "सुरेन्द्र सिंह" or "नीलम" or "सोनिया")
     * address: Address of this individual (e.g. "गांव कुटानी, जिला पानीपत")
     * phone: Mobile number if mentioned (e.g. "9485636036", "8397816075", "9499408983")
     * alias: Role / Alias / Parentage (e.g. "पति", "ससुर", "सास", "ननंद")
     * relationWithComplainant: Relation with complainant (e.g. "पति", "ससुर", "सास", "ननंद")
   - isAccusedKnown: true if one or more accused are identified/named, false if unidentified/unknown.
3. Incident Details:
   - Place of Incident (specific location or landmark)
   - Date of Incident (YYYY-MM-DD if known)
   - Time of Incident (HH:MM if known)
   - isDateTimeKnown (boolean)
   - Class of Incident (must strictly match one of: "FINANCIAL_FRAUD_CHEATING", "CYBER_CRIME", "LAND_PROPERTY_DISPUTE", "PHYSICAL_ASSAULT_AFFRAY", "PROPERTY_THEFT_BURGLARY", "DOMESTIC_VIOLENCE_DOWRY", "PUBLIC_NUISANCE", "MISSING_PERSON", "NARCOTICS_DRUGS_INFO", "HARASSMENT_STALKING", "OTHER_GENERAL")
   - Facts of Details / Detailed Allegations: Complete word-to-word verbatim incident narrative.
4. Complaint Details:
   - Mode of Intake (one of: "WALK_IN_STATION", "CM_WINDOW_HARYANA", "CITIZEN_PORTAL_HARPATH", "EMERGENCY_112", "SP_OFFICE_REFERENCE", "POSTAL_APPLICATION", "WOMEN_HELPDESK")
   - Subject (Precise legal subject line for the complaint)
   - Description (MANDATORY: 100% complete exact word-by-word verbatim transcript of the entire application/document without any reduction or omission)
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
  "isAccusedKnown": true,
  "accusedList": [
    {
      "name": "Full Name of Accused 1 (Single individual)",
      "address": "Address or location of Accused 1",
      "phone": "",
      "alias": "",
      "relationWithComplainant": ""
    },
    {
      "name": "Full Name of Accused 2 (Single individual)",
      "address": "Address or location of Accused 2",
      "phone": "",
      "alias": "",
      "relationWithComplainant": ""
    }
  ],
  "accused": {
    "isKnown": true,
    "name": "Primary Accused Name",
    "address": "Primary Accused Address"
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
      let mimeType = file.type || "";
      const lowerName = file.name.toLowerCase();
      if (!mimeType || mimeType === "application/octet-stream") {
        if (lowerName.endsWith(".pdf")) mimeType = "application/pdf";
        else if (lowerName.endsWith(".png")) mimeType = "image/png";
        else if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) mimeType = "image/jpeg";
        else if (lowerName.endsWith(".webp")) mimeType = "image/webp";
        else if (lowerName.endsWith(".mp3")) mimeType = "audio/mp3";
        else if (lowerName.endsWith(".wav")) mimeType = "audio/wav";
        else if (lowerName.endsWith(".m4a")) mimeType = "audio/m4a";
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

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];

    let geminiData: any = null;
    let modelUsed = "";
    let lastError = "";

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
          geminiData = await geminiRes.json();
          modelUsed = model;
          break;
        } else {
          const errText = await geminiRes.text();
          console.warn(`Model ${model} returned (${geminiRes.status}):`, errText.slice(0, 200));
          lastError = errText;
          // If 503 or 429, try next model candidate immediately
          continue;
        }
      } catch (err: any) {
        console.warn(`Error calling model ${model}:`, err?.message);
        lastError = err?.message;
      }
    }

    if (!geminiData) {
      return NextResponse.json(
        {
          error: `Gemini API service temporarily unavailable: ${lastError}`,
        },
        { status: 502 }
      );
    }

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
      modelUsed,
    });
  } catch (error: any) {
    console.error("Autofill processing error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process document with Gemini AI" },
      { status: 500 }
    );
  }
}
