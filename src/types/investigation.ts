export interface InvestigationCitation {
  documentId: string;
  page?: number | string;
  verbatimQuote: string;
  verification: 'MATCHED_TEXT' | 'REVIEW_REQUIRED';
}
export interface InvestigationEntity {
  id: string;
  type: string;
  primaryName: string;
  aliases: string[];
  role: string;
  attributes: Record<string, unknown>;
  confidence?: number;
  source: InvestigationCitation;
}
export interface InvestigationRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
  date?: string;
  time?: string;
  source: InvestigationCitation;
}
export interface InvestigationEvent {
  id: string;
  type: string;
  title: string;
  date: string;
  time: string;
  participantEntityIds: string[];
  locationEntityId?: string;
  source: InvestigationCitation;
}
export interface InvestigationExtraction {
  entities: InvestigationEntity[];
  relationships: InvestigationRelationship[];
  events: InvestigationEvent[];
  evidence: Record<string, unknown>[];
  statements: Record<string, unknown>[];
  caseHeader: Record<string, unknown>;
  validationWarnings: string[];
  promptAudit: { extractionHash: string; resolutionHash: string; sourceCommit: string };
}
