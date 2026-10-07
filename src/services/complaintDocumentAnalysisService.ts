import { ComplaintItem, ComplaintDocumentItem, ComplaintEvidenceAttachment, UserSession } from "@/types";
import { ComplaintService } from "./complaintService";
import { convertKrutiDevIfDetected } from "@/utils/universalDocumentParser";

export interface IdentifiedPerson {
  id: string;
  name: string;
  role: 'Complainant' | 'Respondent / Accused' | 'Witness' | 'Victim' | 'Informant' | 'Other / Related';
  fatherOrSpouse?: string;
  phone?: string;
  address?: string;
  age?: number | string;
  gender?: string;
  source: 'Overview' | 'Document' | 'Enquiry Note';
  documentName?: string;
  details?: string;
}

export interface ExtractedDocumentInfo {
  id: string;
  fileName: string;
  fileCategory: string;
  isReadable: boolean;
  extractedText?: string;
  unreadableReason?: string;
  identifiedPersonsCount: number;
}

export interface ComplaintAnalysisReport {
  complaintId: string;
  complaintNumber: string;
  shortTitle: string;
  overviewSummary: string;
  identifiedPersons: IdentifiedPerson[];
  extractedDocuments: ExtractedDocumentInfo[];
  unreadableDocuments: Array<{ fileName: string; reason: string }>;
  missingInformationFlags: string[];
  conflictingInformationFlags: string[];
  incidentDate?: string;
  incidentPlace?: string;
  allegationsBrief?: string;
  sectionsOfLaw?: string;
  policeStation?: string;
  district?: string;
}

/**
 * Builds a friendly, readable short title for complaint dropdowns
 */
export function getComplaintShortTitle(c: ComplaintItem): string {
  const accusedName = c.accusedList?.[0]?.name ? ` vs ${c.accusedList[0].name}` : "";
  const cat = c.categoryDisplay || (c.category ? c.category.replace(/_/g, " ") : "General Complaint");
  return `${c.complaintNumber} — ${c.complainantName}${accusedName} (${cat})`;
}

/**
 * Fetches complaints strictly filtered by the user's role and assigned EO
 */
export async function getAuthorizedComplaintsForUser(user: UserSession): Promise<ComplaintItem[]> {
  const isSupervisory =
    user.role === "SHO" ||
    user.role === "MHC_GD_INCHARGE" ||
    user.role === "DSP_SUBDIV" ||
    user.role === "SP_DISTRICT" ||
    user.role === "SUPER_ADMIN" ||
    user.id === "usr_sho_1";

  const isEo = !isSupervisory;
  const eoFilterParam = isEo ? (user.pno || user.name) : undefined;

  const complaints = await ComplaintService.getComplaints({
    assignedEo: eoFilterParam,
    viewerRole: user.role,
  });

  return complaints || [];
}

/**
 * Parses and extracts readable text from document items
 */
async function extractTextFromDocumentItem(
  doc: ComplaintDocumentItem | ComplaintEvidenceAttachment
): Promise<{ text: string; isReadable: boolean; unreadableReason?: string }> {
  // 1. If explicit description or pre-parsed text exists
  const candidateText = (doc as ComplaintDocumentItem).description || "";
  const dataUrl = (doc as any).dataUrl || (doc as any).fileUrl || "";
  const fileName = (doc as any).name || (doc as any).fileName || "document";
  const lowerName = fileName.toLowerCase();

  // If plain text or html
  if (dataUrl.startsWith("data:text/plain") || dataUrl.startsWith("data:text/html") || dataUrl.startsWith("data:text/csv")) {
    try {
      const base64Content = dataUrl.split(",")[1];
      if (base64Content) {
        const decoded = decodeURIComponent(escape(atob(base64Content)));
        if (decoded.trim()) {
          return { text: convertKrutiDevIfDetected(decoded), isReadable: true };
        }
      }
    } catch {}
  }

  // If base64 PDF
  if (dataUrl.startsWith("data:application/pdf") || lowerName.endsWith(".pdf")) {
    try {
      const base64Content = dataUrl.split(",")[1];
      if (base64Content) {
        const binary = atob(base64Content.slice(0, 500000));
        const btMatches = binary.match(/BT[\s\S]*?ET/g) || [];
        const textLines: string[] = [];
        for (const block of btMatches) {
          const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g) || [];
          for (const tj of tjMatches) {
            const inner = tj.replace(/^\(|\)\s*Tj$/g, "");
            if (inner.trim().length > 1) textLines.push(inner.trim());
          }
        }
        if (textLines.length > 0) {
          return { text: convertKrutiDevIfDetected(textLines.join("\n")), isReadable: true };
        }
      }
    } catch {}
  }

  // If candidate text exists
  if (candidateText && candidateText.length > 20 && !candidateText.startsWith("Uploaded")) {
    return { text: candidateText, isReadable: true };
  }

  // Scanned image or binary without clear text layer
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png") || lowerName.endsWith(".webp")) {
    return {
      text: "",
      isReadable: false,
      unreadableReason: "Scanned photo/image without optical text stream. Content not included in automated text generation.",
    };
  }

  if (lowerName.endsWith(".mp3") || lowerName.endsWith(".wav") || lowerName.endsWith(".m4a") || lowerName.endsWith(".mp4")) {
    return {
      text: "",
      isReadable: false,
      unreadableReason: "Audio/Video evidence recording without auto-transcription transcript.",
    };
  }

  return {
    text: candidateText || "",
    isReadable: Boolean(candidateText && candidateText.trim().length > 0),
    unreadableReason: !candidateText ? "Encrypted or binary document format without readable text stream." : undefined,
  };
}

/**
 * Extracts named individuals from freeform text
 */
function extractPersonsFromText(
  text: string,
  sourceName: string
): IdentifiedPerson[] {
  if (!text || text.trim().length < 5) return [];

  const persons: IdentifiedPerson[] = [];
  const lines = text.split("\n");

  // Regex patterns for Indian legal documents (Hindi & English)
  // e.g. "Babli Devi w/o Gurdyal Singh", "Chanderpal s/o Ramkishan", "गवाह रमेश कुमार पुत्र श्री श्याम लाल"
  const patterns = [
    /(?:witness|गवाह|statement of|बयान)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,30}?)(?:\s*(?:s\/o|w\/o|d\/o|c\/o|सुपुत्र|पुत्र|पत्नी|निवासी|r\/o)\s*([A-Za-z\u0900-\u097F\s]{3,30}))?/i,
    /(?:accused|opposite party|आरोपी|प्रतिवादी|suspect)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,30}?)(?:\s*(?:s\/o|w\/o|d\/o|c\/o|सुपुत्र|पुत्र|पत्नी|निवासी|r\/o)\s*([A-Za-z\u0900-\u097F\s]{3,30}))?/i,
    /(?:complainant|informant|परिवादी|शिकायतकर्ता)\s*[:\-]?\s*([A-Za-z\u0900-\u097F\s]{3,30}?)(?:\s*(?:s\/o|w\/o|d\/o|c\/o|सुपुत्र|पुत्र|पत्नी|निवासी|r\/o)\s*([A-Za-z\u0900-\u097F\s]{3,30}))?/i,
  ];

  for (const line of lines) {
    for (const pat of patterns) {
      const match = line.match(pat);
      if (match && match[1]) {
        const rawName = match[1].replace(/[:,\-]/g, "").trim();
        // Ignore generic labels
        if (
          rawName.length > 2 &&
          !["police", "inspector", "station", "sub-inspector", "department", "haryana", "district", "respected", "sir"].includes(rawName.toLowerCase())
        ) {
          let role: IdentifiedPerson["role"] = "Other / Related";
          if (line.toLowerCase().includes("witness") || line.includes("गवाह")) role = "Witness";
          else if (line.toLowerCase().includes("accused") || line.includes("आरोपी") || line.includes("प्रतिवादी")) role = "Respondent / Accused";
          else if (line.toLowerCase().includes("complainant") || line.includes("परिवादी")) role = "Complainant";

          persons.push({
            id: `p_txt_${Math.random().toString(36).substring(2, 7)}`,
            name: rawName,
            role,
            fatherOrSpouse: match[2]?.trim(),
            source: "Document",
            documentName: sourceName,
            details: line.trim().slice(0, 80),
          });
        }
      }
    }
  }

  return persons;
}

/**
 * Normalizes person name for deduplication
 */
function normalizeName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/^(mr\.|mrs\.|ms\.|shri|smt\.|sh\.|dr\.|adv\.)\s+/i, "")
    .replace(/[^a-z0-9\u0900-\u097F]/g, "")
    .trim();
}

/**
 * Deep Analysis of a Complaint's Overview, Documents, Attachments and Enquiry Notes
 */
export async function analyzeComplaintWithDocuments(complaint: ComplaintItem): Promise<ComplaintAnalysisReport> {
  const shortTitle = getComplaintShortTitle(complaint);
  const identifiedPersons: IdentifiedPerson[] = [];
  const extractedDocuments: ExtractedDocumentInfo[] = [];
  const unreadableDocuments: Array<{ fileName: string; reason: string }> = [];
  const missingInformationFlags: string[] = [];
  const conflictingInformationFlags: string[] = [];

  // 1. Process Overview Tab: Primary Complainant
  if (complaint.complainantName) {
    identifiedPersons.push({
      id: `p_complainant_main`,
      name: complaint.complainantName,
      role: "Complainant",
      fatherOrSpouse: complaint.complainantRelativeName || complaint.complainantFatherSpouse,
      phone: complaint.complainantMobile,
      address: complaint.complainantAddress || [complaint.complainantCity, complaint.complainantDistrict].filter(Boolean).join(", "),
      age: complaint.complainantAge,
      gender: complaint.complainantGender,
      source: "Overview",
      details: "Main complainant identified in complaint intake registration.",
    });
  } else {
    missingInformationFlags.push("Complainant name is missing from complaint intake record.");
  }

  // Additional Complainants (if any)
  if (Array.isArray(complaint.additionalComplainants)) {
    complaint.additionalComplainants.forEach((ac, idx) => {
      if (ac.name) {
        identifiedPersons.push({
          id: `p_complainant_add_${idx}`,
          name: ac.name,
          role: "Complainant",
          fatherOrSpouse: ac.relativeName,
          phone: ac.mobile,
          address: ac.presentAddress || ac.permanentAddress || "",
          age: ac.age,
          gender: ac.gender,
          source: "Overview",
          details: `Joint complainant #${idx + 2}.`,
        });
      }
    });
  }

  // Accused / Opposite Party List
  if (Array.isArray(complaint.accusedList) && complaint.accusedList.length > 0) {
    complaint.accusedList.forEach((acc, idx) => {
      if (acc.name && acc.name.trim().length > 0) {
        identifiedPersons.push({
          id: `p_accused_${(acc as any).id || idx}`,
          name: acc.name,
          role: "Respondent / Accused",
          fatherOrSpouse: acc.fatherName,
          phone: acc.phone,
          address: acc.address,
          age: (acc as any).age,
          gender: (acc as any).gender,
          source: "Overview",
          details: acc.alias ? `Opposite party / named suspect (Alias: "${acc.alias}").` : "Opposite party / named suspect in complaint.",
        });
      }
    });
  } else {
    missingInformationFlags.push("No named opposite party / accused specified in complaint record.");
  }

  // 2. Process Enquiry Notes: Extract Witnesses and Statements
  if (Array.isArray(complaint.enquiryNotes) && complaint.enquiryNotes.length > 0) {
    complaint.enquiryNotes.forEach((n, idx) => {
      const notePersons = extractPersonsFromText(n.content || "", `Enquiry Note #${idx + 1}`);
      notePersons.forEach((np) => {
        identifiedPersons.push({
          ...np,
          source: "Enquiry Note",
        });
      });
    });
  }

  // 3. Process Documents Subtab: Attachments & Uploaded Documents
  const allDocs = [
    ...(complaint.documents || []),
    ...(complaint.attachments || []).map((att) => ({
      id: `att_${att.id}`,
      complaintId: complaint.id,
      fileName: att.name,
      fileCategory: att.category?.toUpperCase() || "DOCUMENT",
      uploadedBy: complaint.registeredBy || "Officer",
      uploadedAt: att.uploadedAt || complaint.createdAt,
      fileSize: typeof att.size === "number" ? `${(att.size / 1024).toFixed(1)} KB` : String(att.size || "10 KB"),
      dataUrl: att.dataUrl,
      description: att.description,
    })),
  ];

  // Remove duplicates by fileName
  const uniqueDocs = allDocs.filter(
    (d, i, arr) => arr.findIndex((x) => (x.fileName || "").toLowerCase() === (d.fileName || "").toLowerCase()) === i
  );

  for (const doc of uniqueDocs) {
    const res = await extractTextFromDocumentItem(doc);
    let docPersons: IdentifiedPerson[] = [];

    if (res.isReadable && res.text) {
      docPersons = extractPersonsFromText(res.text, doc.fileName);
      docPersons.forEach((dp) => identifiedPersons.push(dp));

      extractedDocuments.push({
        id: doc.id,
        fileName: doc.fileName,
        fileCategory: doc.fileCategory || "DOCUMENT",
        isReadable: true,
        extractedText: res.text,
        identifiedPersonsCount: docPersons.length,
      });
    } else {
      const reason = res.unreadableReason || "Unable to read text layer from file.";
      unreadableDocuments.push({
        fileName: doc.fileName,
        reason,
      });

      extractedDocuments.push({
        id: doc.id,
        fileName: doc.fileName,
        fileCategory: doc.fileCategory || "DOCUMENT",
        isReadable: false,
        unreadableReason: reason,
        identifiedPersonsCount: 0,
      });
    }
  }

  // 4. Deduplicate identified persons by normalized name
  const deduplicatedPersons: IdentifiedPerson[] = [];
  const seenNames = new Map<string, IdentifiedPerson>();

  for (const person of identifiedPersons) {
    const key = normalizeName(person.name);
    if (!key) continue;

    if (!seenNames.has(key)) {
      seenNames.set(key, person);
      deduplicatedPersons.push(person);
    } else {
      // Merge richer info into existing person
      const existing = seenNames.get(key)!;
      if (!existing.fatherOrSpouse && person.fatherOrSpouse) existing.fatherOrSpouse = person.fatherOrSpouse;
      if (!existing.phone && person.phone) existing.phone = person.phone;
      if (!existing.address && person.address) existing.address = person.address;
      if (!existing.age && person.age) existing.age = person.age;
      if (!existing.gender && person.gender) existing.gender = person.gender;
      if (existing.role === "Other / Related" && person.role !== "Other / Related") existing.role = person.role;
    }
  }

  // 5. Flag Missing or Conflicting Information
  if (!complaint.incidentDate) {
    missingInformationFlags.push("Incident date is not specified in complaint intake.");
  }
  if (!complaint.incidentPlace) {
    missingInformationFlags.push("Incident place / occurrence location is not recorded.");
  }
  if (!complaint.complainantMobile) {
    missingInformationFlags.push("Complainant phone number is missing.");
  }

  const primaryAccused = complaint.accusedList?.[0];
  if (primaryAccused && !primaryAccused.phone) {
    missingInformationFlags.push(`Opposite party "${primaryAccused.name}" phone number is not available.`);
  }

  // Conflicting dates check
  if (complaint.incidentDate && complaint.createdAt) {
    const incDate = new Date(complaint.incidentDate);
    const crDate = new Date(complaint.createdAt);
    if (incDate > crDate) {
      conflictingInformationFlags.push(
        `Incident date (${complaint.incidentDate}) is recorded after registration date (${complaint.createdAt.split("T")[0]}).`
      );
    }
  }

  return {
    complaintId: complaint.id,
    complaintNumber: complaint.complaintNumber,
    shortTitle,
    overviewSummary: complaint.incidentDetails || complaint.complaintDescription || "Complaint registered in Station General Registry.",
    identifiedPersons: deduplicatedPersons,
    extractedDocuments,
    unreadableDocuments,
    missingInformationFlags,
    conflictingInformationFlags,
    incidentDate: complaint.incidentDate || complaint.createdAt?.split("T")[0],
    incidentPlace: complaint.incidentPlace,
    allegationsBrief: complaint.complaintDescription || complaint.incidentDetails,
    sectionsOfLaw: complaint.firSections || "Section 173(3) BNSS, 2023",
    policeStation: complaint.policeStation,
    district: complaint.district,
  };
}
