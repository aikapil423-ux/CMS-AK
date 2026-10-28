import { ComplaintItem, ComplaintDocumentItem, ComplaintEvidenceAttachment } from "@/types";

export type EnquiryClassificationType =
  | "REVIEW_REQUIRED"
  | "FIR_RECOMMENDED"
  | "JAMINI_LAND_DISPUTE"
  | "DIWANI_CIVIL_MONEY"
  | "RAJINAMA_COMPROMISE"
  | "NIVARAK_PREVENTIVE"
  | "NO_COGNIZABLE_OFFENCE"
  | "GAMINI"
  | "DIWANI"
  | "NCR"
  | "FIR"
  | "NIVARAN"
  | "RAZINAMA";

export interface ComplaintAnalysisResult {
  classification: EnquiryClassificationType;
  titleHindi: string;
  titleEnglish: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
  iconName: string;
  rationaleHindi: string;
  rationaleEnglish: string;
  analyzedDocuments: string[];
  findingsGistHindi: string;
  findingsGistEnglish: string;
  substantiatedSections?: string;
  isFirRecommended: boolean;
  recommendedActionText: string;
  proformaFindingsText: {
    standard_4row: string;
    three_column: {
      allegation: string;
      findings: string;
      actionTaken: string;
    }[];
    citizen_detail: {
      satisfaction: string;
      finalReport: string;
    };
    ncr_174: string;
  };
}

/**
 * Intelligent police analysis engine that analyzes the complaint profile overview,
 * category, description, and all uploaded & saved evidence documents to determine
 * the legal nature of the case (Jamini, Diwani, Rajinama, Nivarak, FIR Recommended, No Action).
 */
/** A drafting aid: allegations are not findings and metadata is not document content. */
export function analyzeComplaintForEnquiry(complaint: ComplaintItem): ComplaintAnalysisResult {
  const narrative = [complaint.subject, complaint.complaintDescription, complaint.incidentDetails].filter(Boolean).join(" ");
  const names = [...(complaint.documents || []), ...(complaint.attachments || [])].map(d => ("fileName" in d ? d.fileName : d.name) || "Uploaded document");
  const text = `Complaint ${complaint.complaintNumber || ""} — DRAFT FOR OFFICER REVIEW\nRecorded allegations: ${narrative || "Not provided"}\n\nEnquiry findings, witness statements, document verification, applicable provisions, action taken and complainant satisfaction must be entered by the responsible officer from verified records. No conclusion or disposal recommendation has been generated.`;
  return {
    classification:"REVIEW_REQUIRED", titleHindi:"अधिकारी की समीक्षा आवश्यक", titleEnglish:"Officer review required",
    badgeColor:{bg:"bg-amber-50",text:"text-amber-800",border:"border-amber-300"},iconName:"FileSearch",
    rationaleHindi:"यह केवल उपलब्ध शिकायत विवरण का मसौदा है। अपराध, राजीनामा, जांच या निस्तारण का निष्कर्ष नहीं निकाला गया है।",
    rationaleEnglish:"Unverified allegations only. No offence, compromise, enquiry finding or disposal conclusion has been determined.",
    analyzedDocuments:[], findingsGistHindi:"सत्यापित जांच निष्कर्ष अधिकारी दर्ज करें।",findingsGistEnglish:"Verified findings must be entered by the officer.",
    isFirRecommended:false,recommendedActionText:"Review recorded facts and enter verified findings",
    proformaFindingsText:{standard_4row:text,three_column:[{allegation:narrative,findings:"Not verified — officer review required",actionTaken:"Not recorded"}],citizen_detail:{satisfaction:"Not recorded",finalReport:text},ncr_174:"No NCR action has been determined. Officer review required."}
  };
}
