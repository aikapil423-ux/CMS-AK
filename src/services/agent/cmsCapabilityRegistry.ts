import { CMSCapability, AgentModule } from "@/types/cmsAgent";

export const CMS_CAPABILITIES: CMSCapability[] = [
  {
    id: "search_records",
    name: "Universal Record Search",
    module: "UNIVERSAL",
    description: "Search across FIRs, Complaints, General Diary entries, Accused persons, and Evidence records.",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["FIR 125 search karo", "Anil Kumar ko search karo", "Recent theft cases", "Pending complaints"],
  },
  {
    id: "get_fir_details",
    name: "Retrieve FIR & Case File",
    module: "FIR_CASES",
    description: "Fetch complete FIR details, accused list, complainant, acts/sections, timeline, and case documents.",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["FIR 125 kholo", "FIR 14 ki details dikhao", "FIR 125 ke documents"],
  },
  {
    id: "get_complaint_details",
    name: "Retrieve Complaint & Investigation File",
    module: "COMPLAINTS",
    description: "Retrieve citizen complaint facts, enquiry status, EO reports, and recommendation.",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["Complaint 142 dikhao", "Complaint summary check karo"],
  },
  {
    id: "prepare_arrest_documents",
    name: "Generate Arrest Documentation Suite",
    module: "ARREST_DOCS",
    description: "Create complete statutory arrest dossier: 4-Page Arrest Memo (Form 26.8), Fard Jamatalashi, Grounds of Arrest (BNSS 47), Intimation (BNSS 48), Medical Requisition (BNSS 53), and Remand Application.",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "Anil Kumar ko arrest karke laya hoon FIR 125 me, arrest documents bana do",
      "Arrest memo prepare karo",
      "Fard Jamatalashi aur grounds of arrest banao",
    ],
  },
  {
    id: "prepare_gd_draft",
    name: "Draft General Diary (Roznamcha) Entry",
    module: "GENERAL_DIARY",
    description: "Prepare General Diary (PPR 22.48 / BNSS) draft or auto-suggestion for arrest, departure, arrival, seizure, or case disposal.",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "Is arrest ki GD draft karo",
      "Roznamcha me entry dalo",
      "GD entry prepare karo",
    ],
  },
  {
    id: "prepare_zimni_draft",
    name: "Prepare Case Diary (Zimni) Draft",
    module: "ZIMNI",
    description: "Draft Zimni / Case Diary entry under Section 192 BNSS with investigation findings, witness statements, and spots visited.",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: [
      "FIR 125 ki Zimni draft karo",
      "Zimni number 2 likho",
      "Case diary prepare karo",
    ],
  },
  {
    id: "prepare_complaint_report",
    name: "Generate Enquiry Recommendation Report",
    module: "ENQUIRY_WORKSPACE",
    description: "Generate 8-section enquiry report with recommendation (FIR, NCR, or Closure) for SHO supervisory approval.",
    isMutation: true,
    requiresExplicitApproval: true,
    exampleQueries: ["Complaint enquiry report draft karo", "FIR recommendation report banao"],
  },
  {
    id: "navigate_to_module",
    name: "Guided Page Navigation",
    module: "UNIVERSAL",
    description: "Directly open the target page or workspace (e.g. Arrest Docs workspace, Register FIR, GD Desk) with prefilled query parameters.",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: [
      "Arrest docs page kholo",
      "General diary register par chalo",
      "FIR register form par jao",
    ],
  },
  {
    id: "get_acts_and_sections",
    name: "Legal Acts & Sections Assistant",
    module: "ACTS_SECTIONS",
    description: "Lookup legal sections, definitions, punishments, and bailable/cognizable nature under BNS, BNSS, BSA, and Special Acts.",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: [
      "BNS section 303(2) kya hai",
      "Grounds of arrest kis section me aate hain",
      "Theft sections in BNS",
    ],
  },
  {
    id: "get_staff_duty",
    name: "Police Station Staff & Duty Roster",
    module: "STAFF",
    description: "Retrieve on-duty officers, MHC, IOs, EOs, and duty roster.",
    isMutation: false,
    requiresExplicitApproval: false,
    exampleQueries: ["Duty officer koun hai", "MHC kon hai", "Staff list dikhao"],
  },
];

export class CmsCapabilityRegistry {
  public static getAll(): CMSCapability[] {
    return CMS_CAPABILITIES;
  }

  public static getByModule(module: AgentModule): CMSCapability[] {
    return CMS_CAPABILITIES.filter((c) => c.module === module || c.module === "UNIVERSAL");
  }

  public static findCapability(query: string): CMSCapability | null {
    const q = query.toLowerCase();
    if (q.includes("arrest") || q.includes("girftar") || q.includes("jamatalashi") || q.includes("memo")) {
      return CMS_CAPABILITIES.find((c) => c.id === "prepare_arrest_documents") || null;
    }
    if (q.includes("gd") || q.includes("roznamcha") || q.includes("rapat") || q.includes("general diary")) {
      return CMS_CAPABILITIES.find((c) => c.id === "prepare_gd_draft") || null;
    }
    if (q.includes("zimni") || q.includes("case diary") || q.includes("diaries")) {
      return CMS_CAPABILITIES.find((c) => c.id === "prepare_zimni_draft") || null;
    }
    if (q.includes("fir") && (q.includes("kholo") || q.includes("open") || q.includes("details") || q.includes("dekho"))) {
      return CMS_CAPABILITIES.find((c) => c.id === "get_fir_details") || null;
    }
    if (q.includes("complaint") || q.includes("shikayat") || q.includes("enquiry")) {
      return CMS_CAPABILITIES.find((c) => c.id === "get_complaint_details") || null;
    }
    if (q.includes("dhara") || q.includes("section") || q.includes("act") || q.includes("bns") || q.includes("bnss")) {
      return CMS_CAPABILITIES.find((c) => c.id === "get_acts_and_sections") || null;
    }
    return CMS_CAPABILITIES.find((c) => c.id === "search_records") || null;
  }
}
