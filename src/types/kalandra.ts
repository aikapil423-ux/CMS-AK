export type KalandraLegalStatus =
  | "VERIFIED_STATUTORY"
  | "NEEDS_LEGAL_MAPPING_VERIFICATION";

export type KalandraWorkflowStatus =
  | "DRAFT"
  | "PENDING_VERIFICATION"
  | "APPROVED"
  | "FINALISED"
  | "SUBMITTED";

export type KalandraTypeCode =
  | "107_151"
  | "107_150"
  | "217_BNS"
  | "248_BNS"
  | "145"
  | "72_IPC"
  | "7_16"
  | "OTHER";

export interface KalandraFieldConfig {
  id: string;
  name: string;
  labelHi: string;
  labelEn: string;
  type: "text" | "textarea" | "date" | "time" | "number" | "select";
  isRequired: boolean;
  placeholderHi?: string;
  placeholderEn?: string;
  options?: string[];
  defaultValue?: string;
}

export interface KalandraTemplate {
  id: string;
  code: KalandraTypeCode | string;
  titleEn: string;
  titleHi: string;
  actEn: string;
  actHi: string;
  section: string;
  legalStatus: KalandraLegalStatus;
  legalNoticeEn?: string;
  legalNoticeHi?: string;
  proceduralContext: string;
  defaultCourtEn: string;
  defaultCourtHi: string;
  fields: KalandraFieldConfig[];
  defaultNarrativeTemplateHi: string;
  defaultNarrativeTemplateEn: string;
  supportingDocumentsList: string[];
  version: string;
  isApproved: boolean;
  isCustom?: boolean;
  isArchived?: boolean;
}

export interface KalandraWitness {
  id: string;
  name: string;
  fatherName?: string;
  address: string;
  mobile?: string;
}

export interface KalandraSupportingDoc {
  id: string;
  title: string;
  documentType: string;
  isAttached: boolean;
  referenceNumber?: string;
}

export interface KalandraRecord {
  id: string;
  kalandraNumber: string;
  typeCode: KalandraTypeCode | string;
  templateId: string;
  templateTitle: string;
  actAndSection: string;
  policeStation: string;
  district: string;
  caseType: "DIRECT" | "FROM_FIR" | "FROM_COMPLAINT" | "FROM_GD";
  relatedFirId?: string;
  relatedFirNumber?: string;
  relatedComplaintId?: string;
  relatedComplaintNumber?: string;
  relatedGdNumber?: string;
  respondentName: string;
  respondentFather?: string;
  respondentAddress: string;
  respondentAge?: number | string;
  respondentGender?: string;
  respondentMobile?: string;
  secondPartyName?: string;
  secondPartyFather?: string;
  secondPartyAddress?: string;
  incidentDate: string;
  incidentTime?: string;
  incidentPlace: string;
  reportingOfficer: string;
  officerRank: string;
  officerBelt?: string;
  magistrateCourt: string;
  factsAndCircumstances: string;
  witnesses: KalandraWitness[];
  supportingDocuments: KalandraSupportingDoc[];
  proposedAction: string;
  remarks?: string;
  status: KalandraWorkflowStatus;
  language: "hi" | "en";
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  finalisedAt?: string;
}

export interface KalandraDocumentPackage {
  mainKalandraHtml: string;
  forwardingLetterHtml: string;
  policeReportHtml: string;
  witnessListHtml: string;
  annexureListHtml: string;
}
