import { z } from 'zod';
const text = z.string().max(100000);
const choice = z.enum(['Yes', 'No']);
export const finalReportSchema = z.object({
  schemaVersion: z.literal(1), reportNo: text.min(1), reportDate: text.min(1),
  formType: z.enum(['CHARGESHEET', 'CLOSURE', 'UNTRACED', 'CANCELLED']), chargeSheetType: z.enum(['', 'Complete', 'Partial']),
  finalReportReason: text, finalReportReasonDetails: text,
  judicialCustody: choice, pendingAccused: z.string().regex(/^\d+$/), pendingDocuments: z.enum(['FSL Report Pending', 'Other Documents', 'NIL']),
  limitationPeriod: text, investigationStatus: z.enum(['Completed', 'Pending / Further Investigation']), dispatchDate: text,
  courtType: text.min(1), judgeName: text.min(1), caseType: text.min(1), labAnalysis: text, briefFacts: text.min(1),
  prosecutorApproved: choice, approvalDate: text, noticeServed: choice, noticeDate: text, enclosureNotes: text,
  accused: z.array(z.object({ accusedId: text.min(1), name: text.min(1), relation: text, relativeName: text, action: z.enum(['ChargeSheeted', 'Not ChargeSheeted']), status: text })).max(500),
  witnesses: z.array(z.object({ selected: z.boolean(), name: text, relation: text, relativeName: text, dob: text, occupation: text, evidence: text, address: text, statement: text })).max(1000),
  properties: z.array(z.object({ type: text, description: text, value: text, recoveredFrom: text, disposal: text })).max(1000),
  enclosures: z.array(z.object({ selected: z.boolean(), fileName: text, module: text, registrationNo: text, date: text, documentId: text.optional() })).max(1000),
});

export const finalReportRequestSchema = z.object({
  id: z.string().min(1).max(200), expectedVersion: z.number().int().nonnegative(),
  author: z.object({ id: text.min(1), name: text.min(1) }),
  data: finalReportSchema,
  fir: z.object({ id: text.min(1), firNumber: text.min(1), firDate: text, firYear: z.number(), district: text, policeStation: text,
    complainantName: text, complainantRelationType: text.optional(), complainantRelativeName: text.optional(), complainantFatherSpouse: text.optional(),
    actsAndSections: text, majorAct: text.optional(), assignedIoName: text.optional(), assignedIoRank: text.optional(),
    accusedList: z.array(z.object({ id: text.optional(), name: text, address: text.optional() })),
  }).passthrough(),
  previewHtml: z.string().min(100).max(2000000),
});
