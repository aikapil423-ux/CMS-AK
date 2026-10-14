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
  | "KALANDRA"
  | "STAFF"
  | "ACTS_SECTIONS"
  | "SETTINGS"
  | "UNIVERSAL";

export interface FrontendAction {
  type: "NAVIGATE" | "OPEN_MODAL" | "CLOSE_MODAL" | "SWITCH_TAB" | "PREFILL_FORM" | "TRIGGER_PRINT";
  target: string;
  payload?: Record<string, any>;
}

export interface BackendAction {
  service: "FIR" | "COMPLAINTS" | "GENERAL_DIARY" | "ACTS" | "EVIDENCE" | "STAFF" | "BUILDER" | "KALANDRA";
  operation: string;
  parameters: Record<string, any>;
}

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

export interface ExecutionVerification {
  isVerified: boolean;
  verifiedAt: string;
  verifiedRecordId?: string;
  verifiedRecordLabel?: string;
  verificationDetails: string[];
}

export interface AgentActionPlan {
  id: string;
  title: string;
  understoodIntent: string;
  confidenceScore: number;
  primaryModule: AgentModule;
  isMultiStep?: boolean;
  targetRecords: Array<{
    type: string;
    id: string;
    label: string;
    url?: string;
  }>;
  steps: AgentActionItem[];
  missingInformation?: string[];
  proposedDocuments?: ProposedDocument[];
  frontendActions?: FrontendAction[];
  backendActions?: BackendAction[];
  status: "AWAITING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED" | "PARTIALLY_EXECUTED";
  rejectionReason?: string;
  createdAt: string;
  executedAt?: string;
  executablePayload?: {
    toolName: string;
    parameters: Record<string, any>;
  };
  verification?: ExecutionVerification;
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
    activeEoName?: string;
  };
}

export interface AgentSessionContext {
  activeFirId?: string;
  activeFirNumber?: string;
  activeComplaintId?: string;
  activeComplaintNumber?: string;
  activePersonName?: string;
  activeEoName?: string;
  activePoliceStation?: string;
  activeDistrict?: string;
  lastGeneratedDocType?: string;
  lastActionPlanId?: string;
  activeActionPlan?: AgentActionPlan;
  attachments?: AgentAttachment[];
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

export type OperationClassification = "READ_ONLY" | "PREPARATION" | "STATE_CHANGING";

export interface FieldMetadata {
  id: string;
  formId: string;
  fieldName: string;
  label: string;
  semanticMeaning: string;
  dataType: "string" | "number" | "date" | "time" | "datetime" | "select" | "file" | "array";
  validFormat?: string;
  isRequired: boolean;
  defaultValue?: any;
  validationRules: string[];
  optionsSource?: string;
  dependencies?: string[];
  databaseMapping: {
    entity: string;
    field: string;
  };
  aiAutofillable: boolean;
  requiresOfficerVerification: boolean;
  synonyms: string[];
}

export interface ActionMetadata {
  id: string;
  label: string;
  module: AgentModule;
  route: string;
  componentId?: string;
  operationType: OperationClassification;
  description: string;
  invokes: {
    handler: string;
    service: string;
    apiEndpoint?: string;
  };
  enabledWhen?: string;
  backendEffects: string;
  databaseEntities: string[];
  requiredRoles?: string[];
  confirmationRequired: boolean;
  requiresOfficialApproval?: boolean;
  synonyms: string[];
}

export interface WorkflowStepMetadata {
  stepNumber: number;
  actionId: string;
  description: string;
  isStateChanging: boolean;
  handler: string;
}

export interface WorkflowMetadata {
  id: string;
  title: string;
  description: string;
  primaryModule: AgentModule;
  steps: WorkflowStepMetadata[];
  prerequisites: string[];
  synonyms: string[];
}

export interface UIContextState {
  currentPath: string;
  activeDialog?: string;
  selectedRecordId?: string;
  selectedRecordType?: "FIR" | "COMPLAINT" | "GD" | "OFFICER";
  activeTab?: string;
  activeFormId?: string;
  filledFields: Record<string, any>;
  hasUnsavedChanges?: boolean;
}

export interface CandidateCapabilityMatch {
  capabilityId: string;
  type: "ACTION" | "ROUTE" | "FIELD" | "WORKFLOW";
  title: string;
  confidenceScore: number;
  matchedSynonym?: string;
  operationType: OperationClassification;
  requiresApproval: boolean;
  reasoning: string;
}

export interface PageSchema {
  route: string;
  title: string;
  category: string;
  description: string;
  forms: Array<{
    formId: string;
    title: string;
    fields: FieldMetadata[];
  }>;
  availableActions: ActionMetadata[];
  supportedRoles?: string[];
}
