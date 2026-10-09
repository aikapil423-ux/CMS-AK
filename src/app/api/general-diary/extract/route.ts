import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    // Accept multiple files with key "files" or "file"
    const rawFiles = formData.getAll("files");
    const singleFiles = formData.getAll("file");
    const allFiles = [...rawFiles, ...singleFiles].filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    if (allFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No document or image was uploaded." },
        { status: 400 }
      );
    }

    const processedFiles: Array<{
      id: string;
      name: string;
      size: number;
      type: string;
      dataUrl: string;
      uploadedAt: string;
    }> = [];

    const filePartsForGemini: any[] = [];
    let combinedFallbackText = "";

    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Data = buffer.toString("base64");

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

      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      processedFiles.push({
        id: `doc_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: mimeType,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });

      if (mimeType.startsWith("text/")) {
        const textContent = buffer.toString("utf-8");
        combinedFallbackText += `\n[Document ${i + 1}: ${file.name}]\n${textContent}\n`;
        filePartsForGemini.push({
          text: `[Uploaded Text Document: ${file.name}]\n${textContent}`,
        });
      } else {
        filePartsForGemini.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data,
          },
        });
        filePartsForGemini.push({
          text: `[Above attachment is Document ${i + 1}: ${file.name}]`,
        });
      }
    }

    const prompt = `You are an expert Indian Police General Diary (Roznamcha / GD Register No. II) Document Intelligence Analyzer (under Punjab Police Rules / BNSS 2023).

CRITICAL TASK:
Extract the full, complete textual narrative and facts from the uploaded document(s)/image(s) to autofill the General Diary Brief (GD विवरण / Description).

STRICT RULES:
1. WORD-BY-WORD VERBATIM TRANSCRIPTION: Transcribe all text, statements, incident particulars, dates, times, names, allegations, and factual contents from the document(s)/image(s) word-by-word (शब्द-ब-शब्द / हू-ब-हू).
2. LANGUAGE FIDELITY: If the document is in Hindi (देवनागरी), extract in Hindi. If in English, extract in English. If mixed, preserve original script and language exactly as written. Absolutely DO NOT translate Hindi to English or vice-versa.
3. ANTI-HALLUCINATION: Extract ONLY what is explicitly written or visible in the documents. Do NOT invent, assume, or fabricate any data.
4. FORMAT: Output clean, well-punctuated narrative text suitable for the Police General Diary Brief. Do not include markdown meta-commentary, greetings, or explanations like "Here is the extracted text". Just provide the extracted body text directly.`;

    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
      "gemini-flash-lite-latest",
    ];

    let extractedText = "";

    if (GEMINI_API_KEY && filePartsForGemini.length > 0) {
      const contents = [
        {
          role: "user",
          parts: [{ text: prompt }, ...filePartsForGemini],
        },
      ];

      for (const model of candidateModels) {
        try {
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const geminiRes = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.1,
              },
            }),
          });

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText && rawText.trim()) {
              extractedText = rawText.trim();
              break;
            }
          } else {
            const err = await geminiRes.text();
            console.warn(`Model ${model} returned (${geminiRes.status}):`, err.slice(0, 150));
          }
        } catch (e: any) {
          console.warn(`Error calling model ${model}:`, e?.message);
        }
      }
    }

    // Fallback if AI was unavailable or for plain text files
    if (!extractedText) {
      if (combinedFallbackText.trim()) {
        extractedText = combinedFallbackText.trim();
      } else {
        extractedText = `Document(s) uploaded: ${processedFiles.map((f) => f.name).join(", ")}. Please review attached evidence files.`;
      }
    }

    return NextResponse.json({
      success: true,
      extractedText,
      files: processedFiles,
    });
  } catch (err: any) {
    console.error("General Diary Document Extraction error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process document" },
      { status: 500 }
    );
  }
}
