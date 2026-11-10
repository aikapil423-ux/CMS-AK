export const bailReplyTypes = { REGULAR: "Regular Bail", ANTICIPATORY: "Anticipatory Bail", INTERIM: "Interim Bail", OTHER: "Other Bail Reply" } as const;
export const statusReportTypes = { BAIL: "Bail Status Report", ANTICIPATORY_BAIL: "Anticipatory Bail Status Report", QUASHING: "Quashing Petition Reply", INVESTIGATION: "Investigation Status Report", ADDITIONAL: "Additional Status Report", COMPLIANCE: "Court Order Compliance Report", APPEAL: "Appeal / Sentence Suspension Status Report", REVISION: "Criminal Revision Reply", COMPLAINT: "Complaint / Enquiry Reply", OTHER: "Other Court Report / Reply" } as const;

export const affidavitLabels = {
  from: "Forwarding officer", to: "Recipient", memo: "Memo number", memoDate: "Memo date", subject: "Subject",
  forwarding: "Forwarding memo text", court: "Court heading", petition: "Petition / application number",
  petitioner: "Petitioner / applicant", father: "Father / spouse name", respondent: "Respondent", title: "Affidavit title", intro: "Opening declaration",
  fir: "FIR number", firDate: "FIR date", station: "Police station", sections: "FIR sections on record", hearing: "Petition hearing date",
  petitionSection: "Provision cited in petition", relief: "Relief sought in petition",
  complaint: "Complaint reference and date", partyRole: "Party role in caption", priorFiling: "Earlier reply / filing reference", compliance: "Action on court directions",
  capacity: "Deponent acting on behalf of", preliminary: "Preliminary submissions", paraWise: "Para-wise reply",
  order: "Court direction and order date", facts: "Case facts and investigation chronology",
  role: "Role of petitioner and co-accused", custody: "Arrest / custody status", stage: "Investigation / trial stage",
  trial: "Trial progress and separate trial hearing date", antecedents: "Other cases / antecedents",
  grounds: "Grounds of reply", prayer: "Prayer", verification: "Verification text",
  deponent: "Deponent / designation", place: "Place", date: "Affidavit date", indexPages: "Affidavit pages in index",
} as const;

export type AffidavitField = keyof typeof affidavitLabels;
export type AffidavitFields = Partial<Record<AffidavitField, string>>;
export type CourtAnnexure = { number: string; description: string; date: string; pages: string; text: string; sourceId?: string; sourcePages?: string; vernacular?: boolean };
export type AffidavitBlock = { heading: string; text: string; table: string; afterFacts?: boolean };
export type CourtAffidavit = {
  firId: string;
  fields: AffidavitFields;
  annexures: CourtAnnexure[];
  sources: Partial<Record<AffidavitField, { id: string; name: string }>>;
  blocks?: AffidavitBlock[];
  customType?: string;
  promptVersion?: string;
};
