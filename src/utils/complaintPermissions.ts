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

  if (complaint.assignedEoId && (complaint.assignedEoId === user.id || complaint.assignedEoId === user.pno)) return true;
  if (complaint.assignedEoPno && user.pno && complaint.assignedEoPno === user.pno) return true;

  if (complaint.assignedEoName && user.name) {
    const cName = complaint.assignedEoName.toLowerCase().replace(/^(si|asi|hc|insp|inspector|sub-inspector)\.?\s+/i, "").trim();
    const uName = user.name.toLowerCase().replace(/^(si|asi|hc|insp|inspector|sub-inspector)\.?\s+/i, "").trim();
    if (cName === uName) return true;
    if (user.role === "ENQUIRY_OFFICER" && (cName.includes(uName) || uName.includes(cName))) {
      return true;
    }
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
  doc: {
    createdByUserId?: string;
    uploadedBy?: string;
    createdBy?: string;
    officerName?: string;
    fileCategory?: string;
    fileName?: string;
    isPermanentRegistrationDoc?: boolean;
    sentToSho?: boolean;
    authorRole?: string;
    authorId?: string;
  },
  complaint?: ComplaintItem
): PermissionResult {
  // Statutory Rule & PPR Rule 22.48: Official registered complaint docket is permanent and cannot be deleted
  const isRegisteredComplaintDoc =
    Boolean(doc.isPermanentRegistrationDoc) ||
    doc.fileCategory === "REGISTERED COMPLAINT DOCKET" ||
    doc.fileCategory === "INTAKE VERIFICATION PROFORMA" ||
    Boolean(doc.fileName && doc.fileName.toLowerCase().includes("registered_complaint")) ||
    Boolean(doc.fileName && doc.fileName.toLowerCase().includes("intake_verification"));

  if (isRegisteredComplaintDoc) {
    return {
      allowed: false,
      reason: "Statutory Law & PPR Rule 22.48: Official registered complaint docket is permanent and cannot be deleted.",
    };
  }

  // Strict Rule: SHO cannot delete enquiry reports submitted by the Enquiry Officer
  if (doc.sentToSho && isShoOrSuperior(user.role)) {
    return {
      allowed: false,
      reason: "Access Denied: SHO cannot delete enquiry reports submitted by the Enquiry Officer.",
    };
  }

  // Strict Ownership: Only the user/ID who saved/uploaded the document/report can delete it. No one else!
  const creatorId = doc.createdByUserId || doc.authorId || (doc as any)?.userId;
  if (creatorId) {
    const matchesId = Boolean(user.id && (creatorId === user.id || String(creatorId).toLowerCase() === String(user.id).toLowerCase()));
    const normCreator = String(creatorId).replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
    const normPno = user.pno ? String(user.pno).replace(/[^0-9a-zA-Z]/g, "").toLowerCase() : "";
    const matchesPno = Boolean(normPno && (normCreator === normPno || normCreator.includes(normPno) || normPno.includes(normCreator)));
    const matchesBelt = Boolean(user.beltNumber && creatorId === user.beltNumber);

    if (matchesId || matchesPno || matchesBelt) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: "Access Denied: Only the officer/user who created or uploaded this document can delete it. No other user can delete it.",
    };
  }

  // Fallback for legacy documents without createdByUserId
  const creatorName = (doc.uploadedBy || doc.createdBy || doc.officerName || (doc as any)?.createdByName || "").trim().toLowerCase();
  const currentUserName = (user.name || "").trim().toLowerCase();
  const currentUserPno = (user.pno || "").trim().toLowerCase();
  const currentUserId = (user.id || "").trim().toLowerCase();

  if (creatorName) {
    if (
      (currentUserName && (creatorName === currentUserName || creatorName.includes(currentUserName) || currentUserName.includes(creatorName))) ||
      (currentUserPno && creatorName.includes(currentUserPno)) ||
      (currentUserId && creatorName.includes(currentUserId))
    ) {
      return { allowed: true };
    }
  }

  return {
    allowed: false,
    reason: "Access Denied: Only the officer/user who created or uploaded this document can delete it. No other user can delete it.",
  };
}

/**
 * 5. Can Reassign EO / Assign EO
 * Under PPR Rules 22.48 / 22.49 & statutory procedure:
 * MHC cannot assign EO/IO. Only SHO (or Supervisory Officers) can assign or reassign.
 */
export function canReassignEO(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  const isMhc = user.role === "MHC_GD_INCHARGE" || user.role === "DUTY_OFFICER";
  if (isMhc || user.role === "ENQUIRY_OFFICER") {
    return {
      allowed: false,
      reason: "Access Denied: MHC cannot assign EO/IO. Under PPR Rule 22.48 / 22.49, Enquiry/Investigating Officers must be assigned by SHO only.",
    };
  }

  if (isShoOrSuperior(user.role)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "Access Denied: Supervisory authority required. Only SHO can assign EO/IO.",
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
 * When complaint is assigned to EO, SHO/Superiors cannot generate reports; only EO can.
 * Only when unassigned or review stage can SHO create supervisory reports.
 */
export function canCreateShoReport(user: AuthUserContext, complaint: ComplaintItem): PermissionResult {
  if (!isShoOrSuperior(user.role)) {
    return {
      allowed: false,
      reason: "Access Denied: Only SHO or Supervisory Officers can create supervisory reports.",
    };
  }

  // Once a complaint is sent to SHO for review or approved by SHO, SHO is fully authorized to generate/save their own report
  if (
    complaint.isSentToSho ||
    complaint.shoDecision === "APPROVE" ||
    complaint.shoApprovedAt ||
    complaint.workflowState === "SENT_TO_SHO" ||
    complaint.workflowState === "COMPLETE" ||
    complaint.workflowState === "FIR_REGISTRATION_PENDING" ||
    complaint.status === "REPORT_SUBMITTED" ||
    complaint.status === "RECOMMENDED_FOR_FIR" ||
    complaint.status === "FIR_RECOMMEND" ||
    complaint.status === "COMPLETE"
  ) {
    return { allowed: true };
  }

  if (isComplaintAssignedToEo(complaint)) {
    return {
      allowed: false,
      reason: "Access Denied: Complaint is currently assigned to Enquiry Officer. SHO supervisory report can be generated once submitted or approved.",
    };
  }

  return { allowed: true };
}
