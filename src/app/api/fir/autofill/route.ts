import { processingAIAvailable, PROCESSING_MODEL, processWithAI } from "@/lib/openRouter";
import { apiAccess } from "@/lib/apiSecurity";
import { NextRequest, NextResponse } from "next/server";
import { normalizeInvestigation, withInvestigationPrompt } from "@/services/investigationPromptService";


export async function POST(req: NextRequest) {
  const apiUser = apiAccess(req); if (apiUser instanceof Response) return apiUser;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fallbackText = (formData.get("text") as string) || "";
    const currentStation = (formData.get("currentStation") as string) || "";
    const currentDistrict = (formData.get("currentDistrict") as string) || "";

    if (!file && !fallbackText) {
      return NextResponse.json(
        { error: "No document or text file was uploaded." },
        { status: 400 }
      );
    }

    const cmsPrompt = `You are a Senior Police Crime Investigator and CCTNS Form Document Analyzer for Haryana Police / Indian Criminal Justice System (BNSS 2023 / BNS 2023 / IPC).

STRICT ANTI-HALLUCINATION & NO-FABRICATION MANDATE (अति आवश्यक निर्देश - दस्तावेज़ में जो है केवल वही भरें, खुद से कुछ न जोड़ें):
1. MANDATORY RULE: Extract ONLY information that is EXPLICITLY and TRULY present in the uploaded complaint document/image.
2. ABSOLUTELY DO NOT INVENT, FABRICATE, ASSUME, GUESS, OR HALLUCINATE ANY VALUE!
3. If ANY field is NOT mentioned in the document (such as age, mobile number, relative name, house number, accused name, occurrence date/time, place of offence, etc.), you MUST return an EMPTY STRING "" or empty array [].
4. NEVER use dummy, sample, or placeholder values (DO NOT fill "35", "9812000000", "Complainant", "Father/Spouse", "Kurukshetra Market", "1.5 km", "East", "Beat No. 1", or any generic accused unless explicitly written in the document).
5. If no accused person is named in the document, return "accusedList": [].
6. If no GD or Complaint number is written in the document, return "gdEntryNumber": "" and "complaintNumber": "".
7. PRESERVE ORIGINAL LANGUAGE & SCRIPT: If the complaint is written in Hindi (Devanagari), keep names, addresses, and complaint text in Hindi. Do not translate Hindi names into English.
8. VERBATIM COMPLAINT TRANSCRIPTION: "firContentText" must contain the complete, 100% exact word-by-word verbatim text of the complaint from start to finish without omitting anything.

Return ONLY a valid, parseable JSON object matching this schema with no markdown formatting or backticks:
{
  "state": "",
  "district": "",
  "policeStation": "",
  "sourceOfComplaint": "",
  "complaintNumber": "",
  "gdEntryNumber": "",
  "gdDate": "",
  "gdTime": "",
  "isHeinousCrime": false,
  "isSensitiveFIR": false,
  "complainant": {
    "firstName": "",
    "middleName": "",
    "lastName": "",
    "fatherOrSpouse": "",
    "relationType": "",
    "gender": "",
    "age": "",
    "mobile": "",
    "email": "",
    "houseNo": "",
    "street": "",
    "colony": "",
    "city": "",
    "district": "",
    "state": "",
    "pincode": ""
  },
  "occurrence": {
    "dateFrom": "",
    "dateTo": "",
    "timeFrom": "",
    "timeTo": "",
    "place": "",
    "distanceKm": "",
    "directionFromPs": "",
    "beatNo": "",
    "landmark": ""
  },
  "accusedList": [
    {
      "name": "",
      "relativeName": "",
      "gender": "",
      "age": "",
      "address": "",
      "phone": "",
      "physicalDescription": "",
      "isIdentified": true
    }
  ],
  "firContentText": "",
  "briefFacts": "",
  "actsAndSections": [
    {
      "act": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      "sections": "Sec 303(2)"
    }
  ],
  "majorHead": "",
  "minorHead": ""
}`;

    const documentId = String(formData.get('fileId') || file?.name || 'fir-intake-document');
    const savedPrompt = withInvestigationPrompt(cmsPrompt, documentId);
    const prompt = savedPrompt.text;
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
              text: `File name: "${file.name}". Context: Station="${currentStation}", District="${currentDistrict}". Extract only real content.`,
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
              text: `Document text:\n${fallbackText}\nContext: Station="${currentStation}", District="${currentDistrict}".`,
            },
          ],
        },
      ];
    }

    if (!processingAIAvailable()) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const modelUsed = PROCESSING_MODEL;
    const rawText = await processWithAI(contents[0].parts, { json: true, maxTokens: 32768 });

    const cleanJson = rawText
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const parsedData = JSON.parse(cleanJson);
    if (parsedData.investigation) parsedData.investigation = normalizeInvestigation(parsedData.investigation, documentId, parsedData.firContentText || fallbackText, savedPrompt.audit);

    return NextResponse.json({
      success: true,
      data: parsedData,
      modelUsed,
    });
  } catch (error: any) {
    console.error("FIR Autofill API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process FIR document" },
      { status: 500 }
    );
  }
}
