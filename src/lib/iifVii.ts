export const appealTypes = ["Appeal Against Acquittal", "Appeal Against Sentence", "Appeal Against Enhancement of Sentence"];
export const appealOutcomes = [
  "Upheld on appeal", "Acquitted on appeal", "Sentence reduced on appeal", "Sentence increased on appeal",
  "Convicted on appeal against acquittal", "Upheld after revision", "Acquitted after revision",
  "Sentence reduced after revision", "Sentence increased after revision",
];
export const fileTypes = ["Photograph", "IIF Form", "Report", "Fingerprints", "Documents", "Other", "Psychotropic Substances"];
export const reportSubtypes = [
  "Case Diary", "Case Progress Report", "Inquiry Report", "Officer-in-Charge of Police Station’s Recommendation",
  "Superintendent / Deputy Commissioner of Police’s Recommendation", "Forensic Science Laboratory Report", "Post-Mortem Report",
];
export const fileFormats = "jpg,jpeg,png,gif,bitmap,doc,docx,ppt,pptx,pdf,xlsx,xls,txt,avi,mp3,mp4,mpg,mpeg,wav,wmv".split(",");
export const maxFileSize = 200 * 1024;
export const maxTotalSize = 1024 * 1024;

export type AppealField = {
  label: string;
  required?: boolean;
  kind?: "date" | "area" | "number" | "radio";
  options?: readonly string[];
  custom?: boolean;
};
export const appealFields: AppealField[] = [
  { label: "Court Type", required: true, options: ["Chief Judicial Magistrate (CJM)"], custom: true },
  { label: "Court Name", required: true },
  { label: "Appellant Party", required: true, kind: "radio", options: ["State", "Accused"] },
  { label: "Appeal Type", required: true, options: appealTypes },
  { label: "Court Strictures", kind: "area" },
  { label: "Judgment Date", required: true, kind: "date" },
  { label: "Judge’s Name", required: true },
  { label: "Appeal No.", required: true },
  { label: "Appeal Date", required: true, kind: "date" },
  { label: "Key Observations", required: true, kind: "area" },
  { label: "Remarks on Further Appeal, if any" },
];
export const identityFields: AppealField[] = [
  "UID / Other Identification", "First Name", "Middle Name", "Surname / Last Name", "NPR",
  "Relationship Type", "Relative’s Name", "Religion",
].map(label => ({ label }));
export const outcomeFields: AppealField[] = [
  { label: "Nature of Disposal", options: ["Sentence / Punishment"], custom: true },
  { label: "Sentence Upheld?", required: true, kind: "radio", options: ["Yes", "No"] },
  { label: "Public Prosecutor’s Name", required: true },
  { label: "Regular Criminal No." },
  { label: "Punishment Type", required: true, options: ["Fine"], custom: true },
  { label: "Bond Amount (₹)", kind: "number" },
  { label: "Appeal Outcome", required: true, options: appealOutcomes },
  ...["Imprisonment Period", "Bond Period"].flatMap(period => ["Years", "Months", "Days"].map(unit => ({
    label: `${period} (${unit})`, kind: "number" as const,
  }))),
  { label: "Fine Amount (₹)", kind: "number" },
];

export type Values = Record<string, string>;
export type AppealAttachment = { id: string; name: string; fileType: string; subtype: string; description: string; size: number; data?: string };
export type AccusedOutcome = { personId: string; values: Values; compensation: Values[]; acts: Values[] };
export type AppealDraft = { values: Values; accused: AccusedOutcome[]; attachments: AppealAttachment[] };
export type Appeal = AppealDraft & { id: string; revision: string; updatedAt: string; updatedBy: string };
export type AppealableFir = { id: string; number: string; date: string; station: string; district: string; caseNo: string; caseType: string };
export type AppealCase = AppealableFir & {
  court: string; courtType: string; decisionDate: string; decisionType: string; chargeSheet: string; chargeSheetDate: string;
  accused: { id: string; name: string; relativeName: string; relation: string; currentAddress: string; permanentAddress: string }[];
  acts: Values[];
};
export type AppealRegisterRow = AppealableFir & {
  appealId: string; appealNo: string; appealDate: string; appealType: string; court: string;
  outcomes: string[]; updatedAt: string; updatedBy: string;
};
