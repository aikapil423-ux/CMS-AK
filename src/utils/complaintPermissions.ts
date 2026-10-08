import {
  UserSession,
  ComplaintItem,
  ComplaintDocumentItem,
  ComplaintReportItem,
  SystemRole,
} from "@/types";

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export type AuthUserContext = {
  id?: string;
  pno?: string;
  name?: string;
  role?: SystemRole | string;
  [key: string]: any;
};

/**
 * Checks if a user is superior to SHO in the police hierarchy
 * (SUPER_ADMIN, SP_DISTRICT, DSP_SUBDIV)
 */
export function isSuperiorToSho(role?: SystemRole | string): boolean {
  return role === "SUPER_ADMIN" || role === "SP_DISTRICT" || role === "DSP_SUBDIV";
}

/**
 * Checks if a user is SHO or superior
 */
export function isShoOrSuperior(role?: SystemRole | string): boolean {
  return role === "SHO" || isSuperiorToSho(role);
}

/**
 * Checks if the complaint is currently assigned to an EO
 */
export function isComplaintAssignedToEo(complaint: ComplaintItem): boolean {
  return Boolean(
    (complaint.assignedEoId && complaint.assignedEoId.trim().length > 0) ||
    (complaint.assignedEoName && complaint.assignedEoName.trim().length > 0)
  );
}

/**
 * Checks if the user is the currently assigned Enquiry Officer (EO)
 */
export function isUserAssignedEo(user: AuthUserContext, complaint: ComplaintItem): boolean {
  if (!isComplaintAssignedToEo(complaint)) return false;

  if (complaint.assignedEoId && complaint.assignedEoId === user.id) return true;
  if (complaint.assignedEoPno && user.pno && complaint.assignedEoPno === user.pno) return true;
  if (
    complaint.assignedEoName &&
    user.name &&
    complaint.assignedEoName.toLowerCase().trim() === user.name.toLowerCase().trim()
  ) {
    return true;
  }
  return false;
}

/**
 * Gets the current Complaint Owner ID.
 * When assigned to an EO, the assigned EO is the owner.
 */
export function getCurrentComplaintOwnerId(complaint: ComplaintItem): string | null {
  return complaint.currentComplaintOwnerId || complaint.assignedEoId || null;
}

/**
 * 1. Can View Complaint:
 * Assigned EO, SHO, Superiors, MHC, and authorized viewers
 */
export function canViewComplaint(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  return { allowed: true };
}

/**
 * 2. Can Create / Upload / Generate Document against Complaint
 * Strict rule:
 * - When complaint is currently assigned to an EO:
 *   ONLY the assigned EO can create / upload / generate documents / drafts.
 *   SHO and superiors are strictly denied.
 * - If unassigned or at special intake stage:
 *   Authorized officer can proceed.
 */
export function canCreateDocument(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  if (isComplaintAssignedToEo(complaint)) {
    if (isUserAssignedEo(user, complaint)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Access Denied: Complaint is currently assigned to Enquiry Officer ${complaint.assignedEoName || ""}. Only the assigned EO can upload or generate documents.`,
    };
  }

  // If complaint is unassigned, SHO or Super Admin or Duty Officer can upload intake documents
  if (isShoOrSuperior(user.role) || user.role === "DUTY_OFFICER") {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: You do not have permission to upload or generate documents for this complaint.",
  };
}

/**
 * 3. Can Edit Document / Report
 * Strict rule: document.createdByUserId === user.id
 * Only the creator can edit their own document/report.
 */
export function canEditDocument(
  user: AuthUserContext,
  doc: { createdByUserId?: string; uploadedBy?: string; createdBy?: string; officerName?: string },
  complaint?: ComplaintItem
): PermissionResult {
  const creatorId = doc.createdByUserId;
  if (creatorId && (creatorId === user.id || (user.pno && creatorId === user.pno))) {
    return { allowed: true };
  }

  // Fallback for legacy documents without createdByUserId
  const creatorName = doc.uploadedBy || doc.createdBy || doc.officerName || "";
  if (!creatorId && creatorName && user.name && creatorName.toLowerCase().includes(user.name.toLowerCase())) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: Only the original creator/uploader of this document can edit it.",
  };
}

/**
 * 4. Can Delete Document / Report
 * Strict rule: document.createdByUserId === user.id
 * No other user (even SHO or Superiors) can delete another user's document!
 */
export function canDeleteDocument(
  user: AuthUserContext,
  doc: { createdByUserId?: string; uploadedBy?: string; createdBy?: string; officerName?: string },
  complaint?: ComplaintItem
): PermissionResult {
  const creatorId = doc.createdByUserId;
  if (creatorId && (creatorId === user.id || (user.pno && creatorId === user.pno))) {
    return { allowed: true };
  }

  // Fallback for legacy documents without createdByUserId
  const creatorName = doc.uploadedBy || doc.createdBy || doc.officerName || "";
  if (!creatorId && creatorName && user.name && creatorName.toLowerCase().includes(user.name.toLowerCase())) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: Only the officer who created or uploaded this document can delete it.",
  };
}

/**
 * 5. Can Reassign EO
 * Available to SHO and Superior users when EO is assigned or needs assignment.
 */
export function canReassignEO(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  if (user.role === "MHC_GD_INCHARGE" || user.role === "ENQUIRY_OFFICER") {
    return {
      allowed: false,
      reason: "Access Denied: Only SHO or Supervisory Officers can reassign Enquiry Officers.",
    };
  }

  if (isShoOrSuperior(user.role)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: Supervisory authority required to reassign officer.",
  };
}

/**
 * 6. Can Ask Progress Report
 * Available to SHO and Superior users when complaint is assigned to an EO.
 */
export function canAskProgressReport(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  if (!isComplaintAssignedToEo(complaint)) {
    return {
      allowed: false,
      reason: "Cannot request progress report: No Enquiry Officer is currently assigned.",
    };
  }

  if (isShoOrSuperior(user.role)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: Only SHO or Supervisory Officers can request progress reports.",
  };
}

/**
 * 7. Can Transfer Justification
 * When EO is assigned:
 * EO -> NOT ALLOWED
 * MHC -> NOT ALLOWED
 * SHO -> ALLOWED
 * Superior to SHO -> ALLOWED
 */
export function canTransferJustification(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  if (user.role === "ENQUIRY_OFFICER" || user.role === "MHC_GD_INCHARGE") {
    return {
      allowed: false,
      reason: "Access Denied: Transfer Justification is only available to SHO and Supervisory Officers.",
    };
  }

  if (isShoOrSuperior(user.role)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: Only SHO and superior officers can submit transfer justifications.",
  };
}

/**
 * 8. Can Create SHO's Own Report (Separate from EO's report)
 * When complaint workflow is with SHO or review stage.
 */
export function canCreateShoReport(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  if (isShoOrSuperior(user.role)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: "Access Denied: Only SHO or Supervisory Officers can create supervisory reports.",
  };
}
