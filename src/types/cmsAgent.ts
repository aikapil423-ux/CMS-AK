export type AgentSender = "user" | "agent" | "system";

export type AgentModule =
  | "FIR_WORKSPACE"
  | "FIR_CASES"
  | "GENERAL_DIARY"
  | "COMPLAINTS"
  | "ENQUIRY_WORKSPACE"
  | "EVIDENCE"
  | "ARREST_DOCS"
  | "ZIMNI"
  | "STAFF"
  | "ACTS_SECTIONS"
  | "SETTINGS"
  | "UNIVERSAL";

export interface AgentActionItem {
  id: string;
  stepNumber: number;
  module: AgentModule;
  actionTitle: string;
  actionDescription: string;
  targetRecordId?: string;
  targetRecordLabel?: string;
  isDestructive: boolean;
  requiresOfficialApproval: boolean;
  status: "PENDING" | "EXECUTING" | "COMPLETED" | "FAILED" | "CANCELLED";
  resultMessage?: string;
  resultData?: any;
}

export interface ProposedDocument {
  id: string;
  templateType: string;
  title: string;
  recipientOrSubject: string;
  previewHtml?: string;
  generatedData?: any;
  isEditable: boolean;
  status: "DRAFT" | "READY" | "SAVED";
}

export interface AgentActionPlan {
  id: string;
  title: string;
  understoodIntent: string;
  confidenceScore: number;
  primaryModule: AgentModule;
  targetRecords: Array<{
    type: string;
    id: string;
    label: string;
    url?: string;
  }>;
  steps: AgentActionItem[];
  missingInformation?: string[];
  proposedDocuments?: ProposedDocument[];
  status: "AWAITING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "PARTIALLY_EXECUTED";
  rejectionReason?: string;
  createdAt: string;
  executedAt?: string;
  executablePayload?: {
    toolName: string;
    parameters: Record<string, any>;
  };
}

export interface AgentAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface AgentMessage {
  id: string;
  sender: AgentSender;
  text: string;
  timestamp: string;
  audioUrl?: string;
  attachments?: AgentAttachment[];
  actionPlan?: AgentActionPlan;
  suggestedPrompts?: string[];
  moduleContext?: {
    currentPath?: string;
    moduleName?: string;
    activeFirId?: string;
    activeFirNumber?: string;
    activeComplaintId?: string;
    activeComplaintNumber?: string;
    activePersonName?: string;
  };
}

export interface AgentSessionContext {
  activeFirId?: string;
  activeFirNumber?: string;
  activeComplaintId?: string;
  activeComplaintNumber?: string;
  activePersonName?: string;
  activePoliceStation?: string;
  activeDistrict?: string;
  lastGeneratedDocType?: string;
  lastActionPlanId?: string;
  conversationHistory?: AgentMessage[];
}

export interface CMSCapability {
  id: string;
  name: string;
  module: AgentModule;
  description: string;
  requiredRoles?: string[];
  isMutation: boolean;
  requiresExplicitApproval: boolean;
  exampleQueries: string[];
}
