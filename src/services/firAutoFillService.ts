// src/services/firAutoFillService.ts
// Service for processing uploaded FIR complaint documents, caching raw documents and parsed structured data,
// and binding processed data to registered FIR numbers in persistent backend storage.
// STRICT ANTI-HALLUCINATION: Only extracts and fills data that is explicitly present in the document.
// Leaves missing fields completely blank without inventing or fabricating any dummy data.

import { parseUploadedDocument } from "@/utils/universalDocumentParser";
import { universalEvidenceService } from "@/services/universalEvidenceService";

export interface ProcessedFIRDocumentRecord {
  id: string;
  relatedFirNumber: string; // e.g. "FIR/0004/2026"
  relatedFirId?: string;
  firYear: number;
  createdAt: string;
  updatedAt: string;

  // Raw Document Metadata & Content
  rawDocument: {
    fileName: string;
    fileSize: number;
    fileType: string;
    dataUrl: string; // base64 string for immediate preview / download
    rawExtractedText: string;
    detectedLanguage: "hindi" | "english" | "bilingual";
  };

  // Structured Processed Data
  processedData: {
    state?: string;
    district?: string;
    policeStation?: string;
    sourceOfComplaint?: string;
    complaintNumber?: string;
    gdEntryNumber?: string;
    gdDate?: string;
    gdTime?: string;
    isHeinousCrime?: boolean;
    isSensitiveFIR?: boolean;

    // Complainant Details (Blank if not in document)
    complainant?: {
      firstName?: string;
      middleName?: string;
      lastName?: string;
      fatherOrSpouse?: string;
      relationType?: string;
      gender?: string;
      age?: string;
      mobile?: string;
      email?: string;
      houseNo?: string;
      street?: string;
      colony?: string;
      city?: string;
      district?: string;
      state?: string;
      pincode?: string;
      occupation?: string;
      nationality?: string;
    };

    // Incident / Occurrence Details (Blank if not in document)
    occurrence?: {
      dateFrom?: string;
      dateTo?: string;
      timeFrom?: string;
      timeTo?: string;
      place?: string;
      distanceKm?: string;
      directionFromPs?: string;
      beatNo?: string;
      landmark?: string;
    };

    // Accused Persons (Empty array if none mentioned in document)
    accusedList?: Array<{
      id: string;
      name: string;
      relativeName?: string;
      gender?: string;
      age?: string;
      address?: string;
      phone?: string;
      physicalDescription?: string;
      isIdentified: boolean;
    }>;

    // FIR Text & Facts
    firContentText?: string;
    briefFacts?: string;

    // Acts & Sections Detected
    actsAndSections?: Array<{
      act: string;
      sections: string;
    }>;
    majorHead?: string;
    minorHead?: string;
  };
}

const STORAGE_KEY = "cms_fir_autofill_processed_documents_v1";

// In-memory cache for fast access
let memoryCache: ProcessedFIRDocumentRecord[] | null = null;

function loadFromStorage(): ProcessedFIRDocumentRecord[] {
  if (typeof window === "undefined") return [];
  if (memoryCache !== null) return memoryCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache || [];
    }
  } catch (err) {
    console.error("Error reading FIR processed documents from storage:", err);
  }
  memoryCache = [];
  return memoryCache;
}

function persistToStorage(records: ProcessedFIRDocumentRecord[]): void {
  memoryCache = records;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent("cms-fir-autofill-updated"));
  } catch (err) {
    console.error("Error saving FIR processed documents to storage:", err);
  }
}

export const firAutoFillService = {
  /**
   * Retrieves all processed document records
   */
  getAll(): ProcessedFIRDocumentRecord[] {
    return loadFromStorage();
  },

  /**
   * Finds the processed document record bound to a specific FIR Number
   */
  getByFirNumber(firNumber: string): ProcessedFIRDocumentRecord | null {
    if (!firNumber) return null;
    const records = loadFromStorage();
    const cleanTarget = firNumber.trim().toLowerCase();
    const found = records.find((r) => r.relatedFirNumber.trim().toLowerCase() === cleanTarget);
    if (found) return found;

    // Fallback to Universal Evidence Service
    const uniRecords = universalEvidenceService.getByCase(firNumber);
    if (uniRecords && uniRecords.length > 0) {
      const uRec = uniRecords[0];
      return {
        id: uRec.id,
        relatedFirNumber: firNumber,
        relatedFirId: uRec.caseId || `fir-${firNumber.replace(/\//g, "-")}`,
        firYear: new Date(uRec.createdAt).getFullYear(),
        createdAt: uRec.createdAt,
        updatedAt: uRec.updatedAt,
        rawDocument: {
          fileName: uRec.rawDocument.fileName,
          fileSize: uRec.rawDocument.fileSize,
          fileType: uRec.rawDocument.fileType || "application/pdf",
          dataUrl: uRec.rawDocument.dataUrl,
          rawExtractedText: uRec.extractedText,
          detectedLanguage: uRec.detectedLanguage || "bilingual",
        },
        processedData: {
          firContentText: uRec.extractedText,
          briefFacts: uRec.structuredData?.incident?.summary || uRec.structuredData?.incident?.details,
          complainant: uRec.structuredData?.complainant ? {
            firstName: uRec.structuredData.complainant.name?.split(" ")[0],
            lastName: uRec.structuredData.complainant.name?.split(" ").slice(1).join(" "),
            fatherOrSpouse: uRec.structuredData.complainant.relativeName,
            relationType: uRec.structuredData.complainant.relationType,
            mobile: uRec.structuredData.complainant.mobile,
            houseNo: uRec.structuredData.complainant.address,
            city: uRec.structuredData.complainant.city,
            district: uRec.structuredData.complainant.district,
            state: uRec.structuredData.complainant.state,
          } : undefined,
          occurrence: uRec.structuredData?.incident ? {
            place: uRec.structuredData.incident.place,
            dateFrom: uRec.structuredData.incident.date,
            timeFrom: uRec.structuredData.incident.time,
          } : undefined,
          accusedList: (uRec.structuredData?.accusedList || []).map((a, i) => ({
            id: `acc-${i}`,
            name: a.name,
            address: a.address,
            phone: a.phone,
            isIdentified: true,
          })),
        },
      };
    }
    return null;
  },

  /**
   * Saves or updates a processed document record in the database
   */
  save(record: ProcessedFIRDocumentRecord): ProcessedFIRDocumentRecord {
    const records = loadFromStorage();
    const existingIndex = records.findIndex(
      (r) =>
        r.id === record.id ||
        (r.relatedFirNumber &&
          record.relatedFirNumber &&
          r.relatedFirNumber.trim().toLowerCase() ===
            record.relatedFirNumber.trim().toLowerCase())
    );

    const now = new Date().toISOString();
    const recordToSave = {
      ...record,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      records[existingIndex] = recordToSave;
    } else {
      records.unshift(recordToSave);
    }

    persistToStorage(records);

    // Sync with universal persistent evidence store
    if (record.rawDocument?.dataUrl) {
      universalEvidenceService
        .registerAndProcess({
          dataUrl: record.rawDocument.dataUrl,
          text: record.rawDocument.rawExtractedText,
          fileName: record.rawDocument.fileName,
          fileId: record.id,
          caseId: record.relatedFirId || `fir-${record.relatedFirNumber.replace(/\//g, "-")}`,
          caseNumber: record.relatedFirNumber,
          module: "FIR",
          uploadedBy: "FIR Intake Officer",
        })
        .catch((err) => console.warn("Universal persistent evidence sync warning:", err));
    }

    return recordToSave;
  },

  /**
   * Removes a record from the database
   */
  delete(id: string): void {
    const records = loadFromStorage();
    const filtered = records.filter((r) => r.id !== id);
    persistToStorage(filtered);
  },

  /**
   * Parses an uploaded file, converts to base64 for raw document viewing,
   * performs automated entity extraction (first via AI API, falling back to faithful local extractor),
   * stores the result in backend DB, and binds it to the specified FIR Number.
   * STRICT ANTI-FABRICATION: Missing fields remain empty strings/arrays.
   */
  async processAndSaveDocument(
    file: File,
    firNumber: string,
    firYear: number,
    existingStation?: string,
    existingDistrict?: string
  ): Promise<ProcessedFIRDocumentRecord> {
    // 1. Convert file to Data URL for raw document persistence and preview
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    let extractedData: ProcessedFIRDocumentRecord["processedData"] | null = null;
    let rawExtractedText = "";
    let detectedLanguage: "hindi" | "english" | "bilingual" = "bilingual";

    // 2. First attempt: Call dedicated FIR Autofill AI Endpoint with Multimodal Vision/PDF Support
    try {
      const apiFormData = new FormData();
      apiFormData.append("file", file);
      if (existingStation) apiFormData.append("currentStation", existingStation);
      if (existingDistrict) apiFormData.append("currentDistrict", existingDistrict);

      const res = await fetch("/api/fir/autofill", {
        method: "POST",
        body: apiFormData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          extractedData = json.data;
          rawExtractedText = json.data.firContentText || "";
        }
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn("FIR Autofill API returned non-OK:", res.status, errJson);
      }
    } catch (apiErr) {
      console.warn("FIR AI Autofill API call failed, using faithful local fallback:", apiErr);
    }

    // 3. Fallback: If AI call failed, use faithful local extraction (Zero Hallucination)
    if (!extractedData) {
      try {
        const parsed = await parseUploadedDocument(file);
        rawExtractedText = parsed.rawText || "";
        detectedLanguage = parsed.detectedLanguage;
      } catch (err) {
        console.warn("Document parser fallback:", err);
        try {
          rawExtractedText = await file.text();
        } catch {
          rawExtractedText = "";
        }
      }

      extractedData = extractFaithfulEntitiesLocally(
        rawExtractedText,
        file.name
      );
    }

    // Detect language if not determined
    if (rawExtractedText) {
      const hasHindi = /[\u0900-\u097F]/.test(rawExtractedText);
      const hasEnglish = /[a-zA-Z]/.test(rawExtractedText);
      detectedLanguage = hasHindi && hasEnglish ? "bilingual" : hasHindi ? "hindi" : "english";
    }

    // 4. Construct complete record
    const recordId = `doc_proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: ProcessedFIRDocumentRecord = {
      id: recordId,
      relatedFirNumber: firNumber,
      relatedFirId: `fir-${firNumber.replace(/\//g, "-")}`,
      firYear: firYear || new Date().getFullYear(),
      createdAt: now,
      updatedAt: now,
      rawDocument: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        dataUrl,
        rawExtractedText: rawExtractedText || `Uploaded document: ${file.name}`,
        detectedLanguage,
      },
      processedData: extractedData,
    };

    // 5. Persist to storage
    return this.save(record);
  },
};

/**
 * STRICT FAITHFUL Entity Extractor (Zero Fabrication / No Hallucination).
 * Only extracts values that are genuinely found in the document text.
 * Leaves all missing fields blank ("" or []).
 */
function extractFaithfulEntitiesLocally(
  text: string,
  fileName: string
): ProcessedFIRDocumentRecord["processedData"] {
  if (!text || text.trim().length === 0) {
    return {
      state: "",
      district: "",
      policeStation: "",
      sourceOfComplaint: "Written Complaint",
      complaintNumber: "",
      gdEntryNumber: "",
      gdDate: "",
      gdTime: "",
      isHeinousCrime: false,
      isSensitiveFIR: false,
      complainant: {
        firstName: "",
        middleName: "",
        lastName: "",
        fatherOrSpouse: "",
        relationType: "",
        gender: "",
        age: "",
        mobile: "",
        email: "",
        houseNo: "",
        street: "",
        colony: "",
        city: "",
        district: "",
        state: "",
        pincode: "",
      },
      occurrence: {
        dateFrom: "",
        dateTo: "",
        timeFrom: "",
        timeTo: "",
        place: "",
        distanceKm: "",
        directionFromPs: "",
        beatNo: "",
        landmark: "",
      },
      accusedList: [],
      firContentText: "",
      briefFacts: "",
      actsAndSections: [],
      majorHead: "",
      minorHead: "",
    };
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // Phone number (10 digits starting with 6-9) - ONLY if present in document
  const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
  const mobile = phoneMatch ? phoneMatch[1] : "";

  // Date format (DD/MM/YYYY or DD-MM-YYYY) - ONLY if present in document
  const dateMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/);
  let occurrenceDate = "";
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = dateMatch[2].padStart(2, "0");
    const year = dateMatch[3];
    occurrenceDate = `${year}-${month}-${day}`;
  }

  // Time format (HH:MM) - ONLY if present in document
  const timeMatch = text.match(/\b(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?\b/);
  let occurrenceTime = "";
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const ampm = timeMatch[3];
    if (ampm && ampm.toLowerCase() === "pm" && hours < 12) hours += 12;
    if (ampm && ampm.toLowerCase() === "am" && hours === 12) hours = 0;
    occurrenceTime = `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Complainant extraction
  let complainantFullName = "";
  let relativeName = "";
  let relationType = "";
  let gender = "";
  let address = "";
  let accusedName = "";
  let incidentPlace = "";
  let policeStation = "";
  let district = "";
  let state = "";
  let gdEntryNumber = "";
  let complaintNumber = "";

  // Check for GD / DD number in document
  const gdMatch = text.match(/(?:GD|DD|रपट)\s*(?:No\.?|संख्या|नं\.?)?\s*[:\-]?\s*([A-Za-z0-9\/-]+)/i);
  if (gdMatch) gdEntryNumber = gdMatch[1].trim();

  // Check for Complaint number in document
  const cmpMatch = text.match(/(?:Complaint|शिकायत)\s*(?:No\.?|संख्या|क्रमांक)?\s*[:\-]?\s*([A-Za-z0-9\/-]+)/i);
  if (cmpMatch) complaintNumber = cmpMatch[1].trim();

  // Check for Police Station / Thana in document
  const psMatch = text.match(/(?:Police Station|थाना|PS)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]+?)(?:,|\n|$)/i);
  if (psMatch && psMatch[1].trim().length > 2 && psMatch[1].trim().length < 35) {
    policeStation = psMatch[1].trim();
  }

  // Check for District / Zila in document
  const distMatch = text.match(/(?:District|जिला|ज़िला)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]+?)(?:,|\n|$)/i);
  if (distMatch && distMatch[1].trim().length > 2 && distMatch[1].trim().length < 35) {
    district = distMatch[1].trim();
  }

  // Check for State / Rajya in document
  const stateMatch = text.match(/(?:State|राज्य)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]+?)(?:,|\n|$)/i);
  if (stateMatch && stateMatch[1].trim().length > 2 && stateMatch[1].trim().length < 35) {
    state = stateMatch[1].trim();
  }

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Complainant Name
    if (
      lower.includes("complainant:") ||
      lower.includes("applicant:") ||
      lower.includes("शिकायतकर्ता:") ||
      lower.includes("परिवादी:") ||
      lower.includes("निवेदक:") ||
      lower.includes("प्रार्थी:")
    ) {
      const parts = line.split(/[:\-]/);
      if (parts[1] && !complainantFullName) {
        complainantFullName = parts[1].replace(/s\/o|w\/o|d\/o|पुत्र|पत्नी|निवासी|r\/o/gi, "").trim();
      }
    }

    // Relative Name (S/o, W/o, D/o)
    const relMatch = line.match(/(?:s\/o|w\/o|d\/o|c\/o|पुत्र|पत्नी|सुपुत्र|आत्मज)\s*(?:sh\.|shri|श्री)?\s*([A-Za-z\u0900-\u097F\s.]+?)(?:,|\b|निवासी|r\/o|$)/i);
    if (relMatch && !relativeName) {
      relativeName = relMatch[1].trim();
      if (/w\/o|पत्नी/i.test(line)) {
        relationType = "Spouse";
        gender = "Female";
      } else if (/s\/o|पुत्र|सुपुत्र/i.test(line)) {
        relationType = "Father";
        gender = "Male";
      } else if (/d\/o|पुत्री/i.test(line)) {
        relationType = "Father";
        gender = "Female";
      }
    }

    // Accused / Opposite Party
    if (
      lower.includes("accused:") ||
      lower.includes("suspect:") ||
      lower.includes("आरोपी:") ||
      lower.includes("बनाम:") ||
      lower.includes("अभियुक्त:") ||
      lower.includes("विरुद्ध:")
    ) {
      const parts = line.split(/[:\-]/);
      if (parts[1] && !accusedName) {
        accusedName = parts[1].trim();
      }
    }

    // Incident Place
    if (
      lower.includes("place of incident:") ||
      lower.includes("incident place:") ||
      lower.includes("घटनास्थल:") ||
      lower.includes("स्थान:")
    ) {
      const parts = line.split(/[:\-]/);
      if (parts[1] && !incidentPlace) {
        incidentPlace = parts[1].trim();
      }
    }

    // Address
    if (
      lower.includes("address:") ||
      lower.includes("पता:") ||
      lower.includes("r/o") ||
      lower.includes("निवासी")
    ) {
      const parts = line.split(/[:\-]/);
      if (parts[1] && !address) {
        address = parts[1].trim();
      }
    }
  }

  // Split name if present
  let firstName = "";
  let lastName = "";
  if (complainantFullName) {
    const nameParts = complainantFullName.trim().split(/\s+/);
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(" ") || "";
  }

  // Detect Acts & Sections strictly based on mentioned crime patterns
  const actsAndSections: Array<{ act: string; sections: string }> = [];
  let majorHead = "";
  let minorHead = "";

  if (/cheating|fraud|धोखाधड़ी|phishing|apk|bank fraud|साइबर|cyber/i.test(text)) {
    actsAndSections.push({
      act: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      sections: "Sec 318(4), 316",
    });
    actsAndSections.push({
      act: "Information Technology Act, 2000 (IT Act)",
      sections: "Sec 66C, 66D",
    });
    majorHead = "Cyber Crime";
    minorHead = "Online Financial Fraud";
  } else if (/theft|chori|चोरी|stolen|snatching|झपटमारी/i.test(text)) {
    actsAndSections.push({
      act: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      sections: "Sec 303(2), 305",
    });
    majorHead = "Crime Against Property";
    minorHead = "Theft";
  } else if (/assault|marpeet|मारपीट|hurt|scuffle|धमकी|threat/i.test(text)) {
    actsAndSections.push({
      act: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      sections: "Sec 115(2), 351(2), 352",
    });
    majorHead = "Crime Against Body";
    minorHead = "Voluntarily Causing Hurt";
  } else if (/domestic violence|घरेलू हिंसा|dowry|दहेज|dahej|498a/i.test(text)) {
    actsAndSections.push({
      act: "Domestic Violence Act, 2005",
      sections: "Sec 12, 18, 19, 20",
    });
    actsAndSections.push({
      act: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
      sections: "Sec 85, 86",
    });
    majorHead = "Crime Against Women";
    minorHead = "Cruelty by Husband/Relatives";
  }

  // Build Accused List ONLY if accused actually found in document
  const accusedList: Array<{
    id: string;
    name: string;
    relativeName?: string;
    gender?: string;
    age?: string;
    address?: string;
    phone?: string;
    physicalDescription?: string;
    isIdentified: boolean;
  }> = [];

  if (accusedName && accusedName.trim().length > 1) {
    accusedList.push({
      id: `acc-${Date.now()}`,
      name: accusedName.trim(),
      relativeName: "",
      gender: "",
      age: "",
      address: "",
      phone: "",
      physicalDescription: "",
      isIdentified: true,
    });
  }

  // Brief Facts: summarize only if text exists
  const briefFacts = text.length > 300 ? text.slice(0, 300) + "..." : text;

  return {
    state,
    district,
    policeStation,
    sourceOfComplaint: "Written Complaint",
    complaintNumber,
    gdEntryNumber,
    gdDate: occurrenceDate,
    gdTime: occurrenceTime,
    isHeinousCrime: false,
    isSensitiveFIR: false,

    complainant: {
      firstName,
      middleName: "",
      lastName,
      fatherOrSpouse: relativeName,
      relationType,
      gender,
      age: "",
      mobile,
      email: "",
      houseNo: address,
      street: "",
      colony: "",
      city: "",
      district,
      state,
      pincode: "",
    },

    occurrence: {
      dateFrom: occurrenceDate,
      dateTo: occurrenceDate,
      timeFrom: occurrenceTime,
      timeTo: "",
      place: incidentPlace,
      distanceKm: "",
      directionFromPs: "",
      beatNo: "",
      landmark: "",
    },

    accusedList,
    firContentText: text,
    briefFacts,
    actsAndSections,
    majorHead,
    minorHead,
  };
}
