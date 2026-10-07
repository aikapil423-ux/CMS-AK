import { ComplaintItem } from "@/types";

export interface BuilderTemplateItem {
  id: string;
  name: string;
  description?: string | null;
  content: string;
  documentStructure?: string | null;
  customFields?: string | null;
  createdBy: string;
  createdByName?: string | null;
  createdByRank?: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    drafts: number;
  };
}

export interface BuilderDraftItem {
  id: string;
  name: string;
  description?: string | null;
  content: string;
  documentStructure?: string | null;
  customFields?: string | null;
  caseId?: string | null;
  complaintNumber?: string | null;
  templateId?: string | null;
  template?: { id: string; name: string } | null;
  createdBy: string;
  createdByName?: string | null;
  createdByRank?: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicFieldDef {
  key: string;
  token: string;
  label: string;
  category: "Case Info" | "Officer" | "Parties" | "Location & Date" | "Legal";
  example: string;
}

export const CMS_DYNAMIC_FIELDS: DynamicFieldDef[] = [
  // Case Info
  { key: "CASE_NUMBER", token: "{{CASE_NUMBER}}", label: "Case / Complaint Number", category: "Case Info", example: "HAR-PNP-2026-CMP-00482" },
  { key: "FIR_NUMBER", token: "{{FIR_NUMBER}}", label: "FIR Number", category: "Case Info", example: "FIR No. 128/2026" },
  { key: "CASE_STATUS", token: "{{CASE_STATUS}}", label: "Case Status", category: "Case Info", example: "UNDER_ENQUIRY" },

  // Location & Date
  { key: "POLICE_STATION", token: "{{POLICE_STATION}}", label: "Police Station Name", category: "Location & Date", example: "Police Station City Panipat" },
  { key: "DISTRICT", token: "{{DISTRICT}}", label: "District Name", category: "Location & Date", example: "Panipat" },
  { key: "DATE", token: "{{DATE}}", label: "Current Date", category: "Location & Date", example: new Date().toLocaleDateString("en-GB") },
  { key: "TIME", token: "{{TIME}}", label: "Current Time", category: "Location & Date", example: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
  { key: "INCIDENT_DATE", token: "{{INCIDENT_DATE}}", label: "Incident Date", category: "Location & Date", example: "18-09-2026" },
  { key: "INCIDENT_PLACE", token: "{{INCIDENT_PLACE}}", label: "Incident Place / Address", category: "Location & Date", example: "GT Road Near Bus Stand, Panipat" },
  { key: "ENQUIRY_DATE", token: "{{ENQUIRY_DATE}}", label: "Enquiry Conduct Date", category: "Location & Date", example: new Date().toLocaleDateString("en-GB") },
  { key: "ENQUIRY_LOCATION", token: "{{ENQUIRY_LOCATION}}", label: "Enquiry Location / Venue", category: "Location & Date", example: "Police Station Panipat / Spot Verification" },

  // Officer
  { key: "OFFICER_NAME", token: "{{OFFICER_NAME}}", label: "Investigating Officer Name", category: "Officer", example: "Surender Pal" },
  { key: "OFFICER_RANK", token: "{{OFFICER_RANK}}", label: "Officer Rank", category: "Officer", example: "Sub-Inspector" },
  { key: "OFFICER_BELT_NUMBER", token: "{{OFFICER_BELT_NUMBER}}", label: "Officer Belt / PNO Number", category: "Officer", example: "PNO-23841" },

  // Parties
  { key: "COMPLAINANT_NAME", token: "{{COMPLAINANT_NAME}}", label: "Complainant Full Name", category: "Parties", example: "Rajesh Kumar" },
  { key: "COMPLAINANT_MOBILE", token: "{{COMPLAINANT_MOBILE}}", label: "Complainant Mobile Number", category: "Parties", example: "9812044551" },
  { key: "COMPLAINANT_ADDRESS", token: "{{COMPLAINANT_ADDRESS}}", label: "Complainant Full Address", category: "Parties", example: "House No. 412, Sector 7, Panipat" },
  { key: "ACCUSED_NAME", token: "{{ACCUSED_NAME}}", label: "Accused / Opposite Party Name", category: "Parties", example: "Vikas Sharma" },
  { key: "ACCUSED_ADDRESS", token: "{{ACCUSED_ADDRESS}}", label: "Accused Address", category: "Parties", example: "Ward 12, Assandh Road, Panipat" },
  { key: "WITNESS_NAME", token: "{{WITNESS_NAME}}", label: "Key Witness Name", category: "Parties", example: "Ramesh Chand" },
  { key: "PERSON_NAME", token: "{{PERSON_NAME}}", label: "Selected Person Full Name", category: "Parties", example: "Rajesh Kumar" },
  { key: "PERSON_ROLE", token: "{{PERSON_ROLE}}", label: "Selected Person Role", category: "Parties", example: "Complainant / Witness / Accused" },
  { key: "PERSON_FATHER", token: "{{PERSON_FATHER}}", label: "Selected Person Father/Spouse", category: "Parties", example: "Sh. Dharam Singh" },
  { key: "PERSON_MOBILE", token: "{{PERSON_MOBILE}}", label: "Selected Person Mobile", category: "Parties", example: "9812044551" },
  { key: "PERSON_ADDRESS", token: "{{PERSON_ADDRESS}}", label: "Selected Person Address", category: "Parties", example: "Assandh Road, Panipat" },

  // Legal
  { key: "SECTIONS_OF_LAW", token: "{{SECTIONS_OF_LAW}}", label: "Sections of Law (BNS / IPC)", category: "Legal", example: "Section 318(4), 316(2) BNS, 2023" },
];

/**
 * Replace all dynamic placeholders in content with actual case data
 */
export function resolveDynamicPlaceholders(
  content: string,
  complaint?: ComplaintItem | null,
  customFieldValues?: Record<string, string>,
  person?: {
    name?: string;
    role?: string;
    fatherOrSpouse?: string;
    phone?: string;
    address?: string;
    age?: string | number;
  } | null
): string {
  if (!content) return "";
  let resolved = content;

  const todayStr = new Date().toLocaleDateString("en-GB").replace(/\//g, ".");
  const timeStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const values: Record<string, string> = {
    "{{CASE_NUMBER}}": complaint?.complaintNumber || "HAR-PNP-2026-CMP-00482",
    "{{FIR_NUMBER}}": (complaint as any)?.firNumber || complaint?.complaintNumber || "FIR No. 128/2026",
    "{{CASE_STATUS}}": complaint?.status || "UNDER_ENQUIRY",
    "{{POLICE_STATION}}": complaint?.policeStation || "Police Station City Panipat",
    "{{DISTRICT}}": complaint?.district || "Panipat",
    "{{DATE}}": todayStr,
    "{{TIME}}": timeStr,
    "{{INCIDENT_DATE}}": complaint?.incidentDate ? new Date(complaint.incidentDate).toLocaleDateString("en-GB") : todayStr,
    "{{INCIDENT_PLACE}}": complaint?.incidentPlace || "Panipat",
    "{{ENQUIRY_DATE}}": todayStr,
    "{{ENQUIRY_LOCATION}}": complaint?.policeStation || "Police Station City Panipat",
    "{{OFFICER_NAME}}": complaint?.assignedEoName || "Surender Pal",
    "{{OFFICER_RANK}}": complaint?.assignedEoRank || "Sub-Inspector",
    "{{OFFICER_BELT_NUMBER}}": complaint?.assignedEoPno || complaint?.assignedEoBeltNumber || "PNO-23841",
    "{{COMPLAINANT_NAME}}": (person && person.role === "Complainant" ? person.name : "") || complaint?.complainantName || "Rajesh Kumar",
    "{{COMPLAINANT_MOBILE}}": (person && person.role === "Complainant" ? person.phone : "") || complaint?.complainantMobile || "98120XXXXX",
    "{{COMPLAINANT_ADDRESS}}": (person && person.role === "Complainant" ? person.address : "") || complaint?.complainantAddress || "Panipat, Haryana",
    "{{ACCUSED_NAME}}": (person && person.role === "Respondent / Accused" ? person.name : "") || complaint?.accusedList?.[0]?.name || "Vikas Sharma",
    "{{ACCUSED_ADDRESS}}": (person && person.role === "Respondent / Accused" ? person.address : "") || complaint?.accusedList?.[0]?.address || "Panipat, Haryana",
    "{{WITNESS_NAME}}": (person && person.role === "Witness" ? person.name : "") || "Sh. Ramesh Chand",
    "{{PERSON_NAME}}": person?.name || complaint?.complainantName || "",
    "{{PERSON_ROLE}}": person?.role || "Complainant",
    "{{PERSON_FATHER}}": person?.fatherOrSpouse || "",
    "{{PERSON_MOBILE}}": person?.phone || "",
    "{{PERSON_ADDRESS}}": person?.address || "",
    "{{SECTIONS_OF_LAW}}": (complaint as any)?.sectionsOfLaw || "Section 318(4), 316(2) BNS, 2023",
  };

  // Merge custom field values if provided
  if (customFieldValues) {
    for (const [k, v] of Object.entries(customFieldValues)) {
      const tokenKey = k.startsWith("{{") ? k : `{{${k}}}`;
      values[tokenKey] = v;
    }
  }

  // Replace each token
  for (const [token, val] of Object.entries(values)) {
    const reg = new RegExp(token.replace(/([{}])/g, "\\$1"), "g");
    resolved = resolved.replace(reg, val);
  }

  return resolved;
}

// Client-side API Service
export const BuilderService = {
  // ================= TEMPLATES =================
  async getTemplates(params?: { search?: string; sortBy?: string; sortOrder?: string }): Promise<BuilderTemplateItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.sortBy) query.set("sortBy", params.sortBy);
      if (params?.sortOrder) query.set("sortOrder", params.sortOrder);

      const res = await fetch(`/api/builder/templates?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      return data.templates || [];
    } catch (err) {
      console.warn("BuilderService.getTemplates fallback:", err);
      return [];
    }
  },

  async getTemplateById(id: string): Promise<BuilderTemplateItem | null> {
    try {
      const res = await fetch(`/api/builder/templates/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.template || null;
    } catch (err) {
      console.warn(`BuilderService.getTemplateById fallback for ${id}:`, err);
      return null;
    }
  },

  async createTemplate(data: {
    name: string;
    description?: string;
    content: string;
    documentStructure?: string;
    customFields?: string;
    createdBy?: string;
    createdByName?: string;
    createdByRank?: string;
  }): Promise<BuilderTemplateItem> {
    const res = await fetch("/api/builder/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to create template");
    }
    return result.template;
  },

  async updateTemplate(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      documentStructure?: string;
      customFields?: string;
      status?: string;
    }
  ): Promise<BuilderTemplateItem> {
    const res = await fetch(`/api/builder/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to update template");
    }
    return result.template;
  },

  async deleteTemplate(id: string): Promise<void> {
    const res = await fetch(`/api/builder/templates/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to delete template");
    }
  },

  async duplicateTemplate(id: string): Promise<BuilderTemplateItem> {
    const original = await this.getTemplateById(id);
    if (!original) throw new Error("Original template not found");

    return await this.createTemplate({
      name: `${original.name} (Copy)`,
      description: original.description || undefined,
      content: original.content,
      documentStructure: original.documentStructure || undefined,
      customFields: original.customFields || undefined,
      createdBy: original.createdBy,
      createdByName: original.createdByName || undefined,
      createdByRank: original.createdByRank || undefined,
    });
  },

  // ================= DRAFTS =================
  async getDrafts(params?: { search?: string; caseId?: string; sortBy?: string; sortOrder?: string }): Promise<BuilderDraftItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.search) query.set("search", params.search);
      if (params?.caseId) query.set("caseId", params.caseId);
      if (params?.sortBy) query.set("sortBy", params.sortBy);
      if (params?.sortOrder) query.set("sortOrder", params.sortOrder);

      const res = await fetch(`/api/builder/drafts?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch drafts");
      const data = await res.json();
      return data.drafts || [];
    } catch (err) {
      console.warn("BuilderService.getDrafts fallback:", err);
      return [];
    }
  },

  async getDraftById(id: string): Promise<BuilderDraftItem | null> {
    try {
      const res = await fetch(`/api/builder/drafts/${id}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.draft || null;
    } catch (err) {
      console.warn(`BuilderService.getDraftById fallback for ${id}:`, err);
      return null;
    }
  },

  async createDraft(data: {
    name: string;
    description?: string;
    content: string;
    documentStructure?: string;
    customFields?: string;
    caseId?: string;
    complaintNumber?: string;
    templateId?: string;
    createdBy?: string;
    createdByName?: string;
    createdByRank?: string;
    status?: string;
  }): Promise<BuilderDraftItem> {
    const res = await fetch("/api/builder/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to create draft");
    }
    return result.draft;
  },

  async updateDraft(
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      documentStructure?: string;
      customFields?: string;
      caseId?: string;
      complaintNumber?: string;
      status?: string;
    }
  ): Promise<BuilderDraftItem> {
    const res = await fetch(`/api/builder/drafts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to update draft");
    }
    return result.draft;
  },

  async deleteDraft(id: string): Promise<void> {
    const res = await fetch(`/api/builder/drafts/${id}`, {
      method: "DELETE",
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Failed to delete draft");
    }
  },

  async duplicateDraft(id: string): Promise<BuilderDraftItem> {
    const original = await this.getDraftById(id);
    if (!original) throw new Error("Original draft not found");

    return await this.createDraft({
      name: `${original.name} (Copy)`,
      description: original.description || undefined,
      content: original.content,
      documentStructure: original.documentStructure || undefined,
      customFields: original.customFields || undefined,
      caseId: original.caseId || undefined,
      complaintNumber: original.complaintNumber || undefined,
      templateId: original.templateId || undefined,
      createdBy: original.createdBy,
      createdByName: original.createdByName || undefined,
      createdByRank: original.createdByRank || undefined,
      status: "DRAFT",
    });
  },
};
