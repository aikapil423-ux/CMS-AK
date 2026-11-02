export interface CaseSource {
  id: string;
  name: string;
  kind: 'FIR' | 'DIARY' | 'EVIDENCE';
  date: string;
  text: string;
  facts: Record<string, string>;
  documentUrl?: string;
  entityDetails?: Record<string, { label?: string; page?: number | string; quote?: string }>;
  investigation?: import('./investigation').InvestigationExtraction;
}
export interface CaseConflict {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  explanation: string;
  oldSourceId: string;
  newSourceId: string;
  oldValue: string;
  newValue: string;
  method: 'AI' | 'FIELD_COMPARISON';
}
export interface CaseGraphCitation { sourceId: string; page?: number | string; quote?: string; date?: string; time?: string }
export interface CaseGraphNode { id: string; label: string; type: string; sourceIds: string[]; properties?: Record<string, unknown>; citations?: CaseGraphCitation[]; confidence?: number }
export interface CaseGraphLink { id: string; source: string; target: string; label: string; sourceIds: string[]; citations?: CaseGraphCitation[]; properties?: Record<string, unknown> }
export interface CaseAnalysis {
  firId: string;
  fingerprint: string;
  analyzedAt: string;
  sources: CaseSource[];
  conflicts: CaseConflict[];
  nodes: CaseGraphNode[];
  links: CaseGraphLink[];
  aiStatus: 'COMPLETED' | 'PARTIAL' | 'UNAVAILABLE' | 'FAILED';
  aiProgress?: { completed: number; total: number };
  aiMessage?: string;
  model?: string;
  pendingEvidence: number;
}
