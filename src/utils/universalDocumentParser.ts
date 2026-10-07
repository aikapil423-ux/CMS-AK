/**
 * Universal Police Document Parser & Digitizer
 * STRICT FAITHFUL MIRRORING:
 * Extracts exact text and mirrors layout, language, and words verbatim without adding or inventing any external boilerplate.
 */

export interface ParsedDocumentStructure {
  rawText: string;
  fileName: string;
  fileFormat: string;
  detectedLanguage: "hindi" | "english" | "bilingual";
  documentType: "report" | "notice" | "proforma" | "letter";
  title: string;
  subTitle: string;
  headerLeft: string;
  headerRight: string;
  subHeaderLeft: string;
  dispatchNo: string;
  policeStation: string;
  district: string;
  date: string;
  columns: string[];
  rows: Array<{
    id: string;
    label: string;
    cells: string[];
  }>;
  clauses: Array<{
    id: string;
    title: string;
    content: string;
    isMandatory?: boolean;
  }>;
  closingLine: string;
  officerName: string;
  officerRank: string;
  officerLocation: string;
  officerPno?: string;
  noticeeName?: string;
  noticeeAddress?: string;
  noticeePhone?: string;
  complainantName?: string;
  complaintNo?: string;
  allegationsBrief?: string;
}

// Kruti Dev 010 to Unicode Hindi character mapping table for legacy police documents
const KRUTI_DEV_MAP: Record<string, string> = {
  "gfj;k.kk": "हरियाणा",
  "iqfyl": "पुलिस",
  "Fkkuk": "थाना",
  "ftyk": "जिला",
  "vEckyk": "अम्बाला",
  "ikuhir": "पानीपत",
  "fljlk": "सिरसा",
  "Lkqpuk": "सूचना",
  "i=": "पत्र",
  "ekad": "क्रमांक",
  "fnukad": "दिनांक",
  "vkidks": "आपको",
  "uksfVl": "नोटिस",
  "lqfpr": "सूचित",
  "fd;k": "किया",
  "tkrk": "जाता",
  "gS": "है",
  "ifjoknh": "परिवादी",
  "Jheku": "श्रीमान",
  "th": "जी",
  "tkap": "जांच",
  "fjiksVZ": "रिपोर्ट",
  "vkjksih": "आरोपी",
  "njp": "दर्ज",
  "dkjZokbZ": "कार्रवाई",
  ";qfuV": "यूनिट",
  "ek;e": "माध्यम",
};

export function convertKrutiDevIfDetected(text: string): string {
  let converted = text;
  for (const [k, v] of Object.entries(KRUTI_DEV_MAP)) {
    const reg = new RegExp(k, "g");
    converted = converted.replace(reg, v);
  }
  return converted;
}

/**
 * Extract text from DOCX ArrayBuffer by locating word/document.xml
 */
async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(buffer);
    const binaryStr = Array.from(bytes)
      .map((b) => String.fromCharCode(b))
      .join("");

    const docStart = binaryStr.indexOf("<w:document");
    if (docStart !== -1) {
      const docEnd = binaryStr.indexOf("</w:document>", docStart);
      const xmlChunk = binaryStr.substring(docStart, docEnd !== -1 ? docEnd + 13 : docStart + 120000);

      // Extract all paragraphs <w:p>
      const paragraphs = xmlChunk.split("</w:p>");
      const lines: string[] = [];

      for (const p of paragraphs) {
        const textMatches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
        if (textMatches && textMatches.length > 0) {
          const pText = textMatches.map((m) => m.replace(/<[^>]+>/g, "")).join("");
          if (pText.trim()) lines.push(pText.trim());
        }
      }

      if (lines.length > 0) {
        return lines.join("\n");
      }
    }

    // Fallback: extract all readable text pieces
    const textPieces: string[] = [];
    let currentPiece = "";
    for (let i = 0; i < bytes.length; i++) {
      const code = bytes[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13) {
        currentPiece += String.fromCharCode(code);
      } else {
        if (currentPiece.length > 3 && !currentPiece.includes("<w:") && !currentPiece.includes("xml")) {
          textPieces.push(currentPiece.trim());
        }
        currentPiece = "";
      }
    }
    return textPieces.join("\n").replace(/\n{3,}/g, "\n\n");
  } catch (err) {
    console.warn("DOCX text parsing fallback:", err);
    return "";
  }
}

/**
 * Extract text streams from PDF ArrayBuffer
 */
function extractTextFromPdf(buffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(buffer);
    const pdfStr = Array.from(bytes.slice(0, Math.min(bytes.length, 1200000)))
      .map((b) => String.fromCharCode(b))
      .join("");

    const btRegex = /BT[\s\S]*?ET/g;
    const btBlocks = pdfStr.match(btRegex) || [];
    const extractedLines: string[] = [];

    for (const block of btBlocks) {
      const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      const arrayTjMatches = block.match(/\[([^\]]*)\]\s*TJ/g) || [];

      for (const tj of tjMatches) {
        const inner = tj.replace(/^\(|\)\s*Tj$/g, "");
        if (inner.trim()) extractedLines.push(inner);
      }

      for (const atj of arrayTjMatches) {
        const inner = atj.replace(/^\[|\]\s*TJ$/g, "");
        const strings = inner.match(/\(([^)]*)\)/g) || [];
        const combined = strings.map((s) => s.slice(1, -1)).join("");
        if (combined.trim()) extractedLines.push(combined);
      }
    }

    let combinedText = extractedLines.join("\n");
    if (!combinedText.trim()) {
      const simpleStrings = pdfStr.match(/\(([\w\s.,;:/\-+=@#%&*!?\u0900-\u097F]{3,})\)/g) || [];
      combinedText = simpleStrings.map((s) => s.slice(1, -1)).join(" ");
    }

    return convertKrutiDevIfDetected(combinedText);
  } catch (err) {
    console.warn("PDF stream parsing fallback:", err);
    return "";
  }
}

/**
 * Universal faithful parser entrypoint
 * Preserves the exact document text word-to-word without adding external boilerplate.
 */
export async function parseUploadedDocument(file: File): Promise<ParsedDocumentStructure> {
  const fileName = file.name;
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  let extractedText = "";

  if (fileExt === "docx" || fileExt === "doc") {
    const buffer = await file.arrayBuffer();
    extractedText = await extractTextFromDocx(buffer);
  } else if (fileExt === "pdf") {
    const buffer = await file.arrayBuffer();
    extractedText = extractTextFromPdf(buffer);
  } else if (fileExt === "txt" || fileExt === "rtf" || fileExt === "html" || fileExt === "csv") {
    extractedText = await file.text();
  }

  extractedText = convertKrutiDevIfDetected(extractedText).trim();

  // If text is empty or non-extractable, keep only the original file reference
  if (!extractedText) {
    extractedText = `${fileName.replace(/\.[^/.]+$/, "")}\nUploaded original document: ${fileName}`;
  }

  // 1. Language Detection
  const hasHindi = /[\u0900-\u097F]/.test(extractedText);
  const hasEnglish = /[a-zA-Z]/.test(extractedText);
  const detectedLanguage: "hindi" | "english" | "bilingual" =
    hasHindi && hasEnglish ? "bilingual" : hasHindi ? "hindi" : "english";

  // 2. Line-by-line verbatim parsing
  const rawLines = extractedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = "";
  let subTitle = "";
  let headerLeft = "";
  let headerRight = "";
  let subHeaderLeft = "";
  let dispatchNo = "";
  let policeStation = "";
  let district = "";
  const date = new Date().toISOString().split("T")[0];
  let closingLine = "";
  let officerName = "";
  let officerRank = "";
  let officerLocation = "";

  // Inspect first 6 lines strictly for real headers present in the document
  const headerCandidates = rawLines.slice(0, 6);
  for (let i = 0; i < headerCandidates.length; i++) {
    const line = headerCandidates[i];
    const upper = line.toUpperCase();

    if ((upper.includes("POLICE") || upper.includes("पुलिस") || upper.includes("DEPARTMENT") || upper.includes("कार्यालय") || upper.includes("HARYANA") || upper.includes("हरियाणा")) && !headerLeft) {
      headerLeft = line;
      continue;
    }
    if ((upper.includes("DISTRICT") || upper.includes("जिला") || upper.includes("PANIPAT") || upper.includes("SIRSA") || upper.includes("AMBALA") || upper.includes("KURUKSHETRA")) && !headerRight) {
      headerRight = line;
      continue;
    }
    if ((upper.includes("REPORT") || upper.includes("NOTICE") || upper.includes("PROFORMA") || upper.includes("PERFORMA") || upper.includes("रिपोर्ट") || upper.includes("सूचना") || upper.includes("ज्ञापन") || upper.includes("MEMO") || upper.includes("FORM") || upper.includes("REQUISITION")) && !title) {
      title = line;
      continue;
    }
    if ((upper.includes("NO.") || upper.includes("क्रमांक") || upper.includes("DISPATCH") || upper.includes("FIR NO") || upper.includes("COMPLAINT NO")) && !dispatchNo) {
      dispatchNo = line;
      continue;
    }
  }

  // If no explicit title found, use the first non-empty line or file name
  if (!title) {
    title = rawLines[0] || fileName.replace(/\.[^/.]+$/, "");
  }

  // Check last 4 lines strictly for real signatures present in the document
  const footerCandidates = rawLines.slice(-6);
  for (const line of footerCandidates) {
    const upper = line.toUpperCase();
    if (upper.includes("REPORT IS SUBMITTED") || upper.includes("सादर सेवा") || upper.includes("अवलोकनार्थ") || upper.includes("प्रस्तुत")) {
      closingLine = line;
    } else if (upper.includes("INSPECTOR") || upper.includes("SUB-INSPECTOR") || upper.includes("SHO") || upper.includes("DSP") || upper.includes("अधीक्षक") || upper.includes("अधिकारी") || upper.includes("IO")) {
      officerRank = line;
    } else if ((line.startsWith("(") && line.endsWith(")")) || upper.includes("SIGNATURE") || upper.includes("हस्ताक्षर")) {
      officerName = line;
    }
  }

  // 3. Extract exact rows and clauses word-to-word
  const rows: Array<{ id: string; label: string; cells: string[] }> = [];
  const clauses: Array<{ id: string; title: string; content: string }> = [];

  let currentLabel = "";
  let currentContentLines: string[] = [];
  let itemIndex = 1;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Don't duplicate exact top header lines as table rows
    if (line === headerLeft || line === headerRight || line === title) {
      continue;
    }

    // Check if line is a field label: e.g. "Name:- ...", "Point 1: ...", "Allegation: ..."
    const colonMatch = line.match(/^([^:-]{2,45})[:\-]\s*(.*)$/);
    const numberedMatch = line.match(/^([0-9]{1,2}[.)]\s*[^:-]{2,50})[:\-]?\s*(.*)$/);

    if (colonMatch || numberedMatch) {
      if (currentLabel && currentContentLines.length > 0) {
        const fullContent = currentContentLines.join("\n").trim();
        rows.push({
          id: `row_${rows.length + 1}`,
          label: currentLabel,
          cells: [fullContent || "—"],
        });
        clauses.push({
          id: `clause_${clauses.length + 1}`,
          title: currentLabel,
          content: fullContent || "—",
        });
        currentContentLines = [];
      }

      if (colonMatch) {
        currentLabel = colonMatch[1].trim();
        if (colonMatch[2].trim()) {
          currentContentLines.push(colonMatch[2].trim());
        }
      } else if (numberedMatch) {
        currentLabel = numberedMatch[1].trim();
        if (numberedMatch[2].trim()) {
          currentContentLines.push(numberedMatch[2].trim());
        }
      }
    } else {
      if (currentLabel) {
        currentContentLines.push(line);
      } else {
        // If line is a standalone point/paragraph from the document
        if (line.length > 10) {
          currentLabel = `Item ${itemIndex++}`;
          currentContentLines.push(line);
        }
      }
    }
  }

  // Push final collected item
  if (currentLabel && currentContentLines.length > 0) {
    const fullContent = currentContentLines.join("\n").trim();
    rows.push({
      id: `row_${rows.length + 1}`,
      label: currentLabel,
      cells: [fullContent || "—"],
    });
    clauses.push({
      id: `clause_${clauses.length + 1}`,
      title: currentLabel,
      content: fullContent || "—",
    });
  }

  // If no rows were split, take every non-empty line as an exact row word-to-word
  if (rows.length === 0) {
    rawLines.forEach((line, idx) => {
      rows.push({
        id: `row_${idx + 1}`,
        label: `Section ${idx + 1}`,
        cells: [line],
      });
      clauses.push({
        id: `clause_${idx + 1}`,
        title: `Section ${idx + 1}`,
        content: line,
      });
    });
  }

  return {
    rawText: extractedText,
    fileName,
    fileFormat: fileExt.toUpperCase(),
    detectedLanguage,
    documentType: title.toUpperCase().includes("NOTICE") || title.toUpperCase().includes("सूचना") ? "notice" : "report",
    title: title || fileName.replace(/\.[^/.]+$/, ""),
    subTitle,
    headerLeft,
    headerRight,
    subHeaderLeft,
    dispatchNo,
    policeStation,
    district,
    date,
    columns: [],
    rows,
    clauses,
    closingLine,
    officerName,
    officerRank,
    officerLocation,
  };
}
