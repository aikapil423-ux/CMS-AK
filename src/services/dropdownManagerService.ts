// Dropdown Manager Service - Haryana Police CMS
// Manages all dynamic dropdowns across the application with persistent storage and system defaults.

export interface DropdownItem {
  id: string;
  code: string;
  label: string;
  description?: string;
  categoryKey: string;
  badgeColor?: string;
  isSystem?: boolean;
  isActive: boolean;
  order?: number;
  metadata?: Record<string, any>;
}

export interface DropdownCategory {
  key: string;
  name: string;
  description: string;
  iconName?: string;
  usageLocation: string;
  supportsColors?: boolean;
  defaultItems: Omit<DropdownItem, "id" | "categoryKey">[];
}

export const DROPDOWN_CATEGORIES: DropdownCategory[] = [
  {
    key: "complaint_categories",
    name: "Complaint Categories",
    description: "Legal classifications for registered complaints under BNS/BNSS.",
    usageLocation: "Complaint Registration, Filter, Profiling",
    supportsColors: true,
    defaultItems: [
      { code: "FINANCIAL_FRAUD_CHEATING", label: "Financial Fraud / Cheating", description: "Fraudulent schemes, embezzlement, dishonoured cheques", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", isActive: true },
      { code: "CYBER_CRIME", label: "Cyber Crime / Online Fraud", description: "Online scams, phishing, unauthorized financial transactions", badgeColor: "bg-blue-100 text-blue-800 border-blue-200", isActive: true },
      { code: "LAND_PROPERTY_DISPUTE", label: "Land / Boundary Dispute", description: "Demarcation dispute, unauthorized possession, passage rights", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200", isActive: true },
      { code: "PHYSICAL_ASSAULT_AFFRAY", label: "Physical Assault / Affray", description: "Brawls, fights, voluntarily causing hurt, scuffles", badgeColor: "bg-red-100 text-red-800 border-red-200", isActive: true },
      { code: "PROPERTY_THEFT_BURGLARY", label: "Theft / Burglary", description: "House break-in, theft of personal belongings, vehicle theft", badgeColor: "bg-purple-100 text-purple-800 border-purple-200", isActive: true },
      { code: "DOMESTIC_VIOLENCE_DOWRY", label: "Domestic Violence / Dowry", description: "Matrimonial disputes, harassment for dowry, cruelty", badgeColor: "bg-pink-100 text-pink-800 border-pink-200", isActive: true },
      { code: "PUBLIC_NUISANCE", label: "Public Nuisance / Street Brawl", description: "Noise pollution, drunken disorder, public obstruction", badgeColor: "bg-slate-100 text-slate-800 border-slate-200", isActive: true },
      { code: "MISSING_PERSON", label: "Missing Person", description: "Untraced children, runaway youth, missing elderly persons", badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200", isActive: true },
      { code: "NARCOTICS_DRUGS_INFO", label: "Narcotics / Drugs Information", description: "Substance trafficking tips, peddling, illicit possession", badgeColor: "bg-rose-100 text-rose-800 border-rose-200", isActive: true },
      { code: "HARASSMENT_STALKING", label: "Harassment / Stalking", description: "Eve-teasing, phone harassment, cyber stalking", badgeColor: "bg-orange-100 text-orange-800 border-orange-200", isActive: true },
      { code: "OTHER_GENERAL", label: "Other General Matter", description: "Miscellaneous non-criminal matters or petitions", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", isActive: true },
    ],
  },
  {
    key: "source_channels",
    name: "Complaint Source Channels",
    description: "Channels through which complaints are received at the station.",
    usageLocation: "Complaint Registration Form",
    defaultItems: [
      { code: "WALK_IN", label: "Direct Walk-in / Counter", description: "Complainant reported in person at the police station desk", isActive: true },
      { code: "SP_OFFICE_REF", label: "SP Office / Senior Officer Reference", description: "Official reference endorsed by District SP or DSP Office", isActive: true },
      { code: "CM_WINDOW", label: "CM Window Reference", description: "Grievance received through Haryana CM Window Portal", isActive: true },
      { code: "EMERGENCY_112", label: "Emergency 112 Call / Dispatch", description: "Dispatched from Haryana Dial 112 CAD Center", isActive: true },
      { code: "WOMEN_HELPLINE_1091", label: "Women Helpline 1091", description: "Dedicated women distress helpline reference", isActive: true },
      { code: "CYBER_PORTAL", label: "Cyber Crime Portal (NCRP)", description: "Received via National Cyber Crime Reporting Portal", isActive: true },
      { code: "POST_REGISTERED", label: "Post / Registered Mail", description: "Physical petition delivered through postal service", isActive: true },
    ],
  },
  {
    key: "gd_types",
    name: "General Diary (GD) Entry Types",
    description: "Statutory entry types for Roznamcha GD (PPR 1934 Rule 22.48).",
    usageLocation: "Smart General Diary (New Entry & Filter)",
    supportsColors: true,
    defaultItems: [
      { code: "OPENING_OF_GD", label: "Opening of GD", description: "Formal opening of station daily register (official CCTNS type)", badgeColor: "bg-blue-100 text-blue-800 border-blue-200", isActive: true },
      { code: "ROLL_CALL", label: "Roll Call", description: "Morning roll call, parade, and staff muster check (official CCTNS type)", badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200", isActive: true },
      { code: "DEPARTURE", label: "Departure", description: "Officer departure for field investigation, raid, or duty (official CCTNS type)", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", isActive: true },
      { code: "ARRIVAL_RETURN", label: "Arrival/Return", description: "Officer return to station after completion of field duty (official CCTNS type)", badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200", isActive: true },
      { code: "CLOSE_OF_GD", label: "Close of GD", description: "24-hour cycle lock and Day Close of General Diary (official CCTNS type)", badgeColor: "bg-slate-100 text-slate-800 border-slate-200", isActive: true },
      { code: "CRIMINAL_CASE", label: "Criminal case", description: "Criminal case entry (official CCTNS type)", badgeColor: "bg-red-100 text-red-800 border-red-200", isActive: true },
      { code: "NAKABANDI", label: "Nakabandi", description: "Check point / barricade operation (official CCTNS type)", badgeColor: "bg-violet-100 text-violet-800 border-violet-200", isActive: true },
      { code: "PATROLLING", label: "Patrolling", description: "Beat patrolling, night round, and checking (official CCTNS type)", badgeColor: "bg-teal-100 text-teal-800 border-teal-200", isActive: true },
      { code: "PROPERTY_DEPOSITED_IN_MALKHANA", label: "Property Deposited in Malkhana", description: "Deposit of seized property in Malkhana (official CCTNS type)", badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200", isActive: true },
      { code: "REMAND", label: "Remand", description: "Remand of accused (official CCTNS type)", badgeColor: "bg-orange-100 text-orange-800 border-orange-200", isActive: true },
      { code: "NON_COGNIZABLE_REPORT", label: "Non-Cognizable Report", description: "NCR entry (official CCTNS type)", badgeColor: "bg-sky-100 text-sky-800 border-sky-200", isActive: true },
      { code: "OTHERS", label: "Others", description: "Any other entry not covered by a specific type (official CCTNS type)", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200", isActive: true },
    ],
  },
  {
    key: "enquiry_officers",
    name: "Enquiry Officers (EO Roster)",
    description: "Officers available for complaint enquiry and investigation assignment.",
    usageLocation: "Assign EO Modal, Officer Dropdown",
    defaultItems: [
      { code: "SI_MALKEET", label: "SI Malkeet", description: "Belt: 512/KKR · PNO: 08192841 · Sub-Inspector", metadata: { rank: "Sub-Inspector", beltNumber: "512/KKR", pno: "08192841" }, isActive: true },
      { code: "SI_VIKRAM_SINGH", label: "SI Vikram Singh", description: "Belt: 742/KKR · PNO: 07182930 · Sub-Inspector", metadata: { rank: "Sub-Inspector", beltNumber: "742/KKR", pno: "07182930" }, isActive: true },
      { code: "ASI_RAMESH_CHANDER", label: "ASI Ramesh Chander", description: "Belt: 614/KKR · PNO: 06281923 · Assistant Sub-Inspector", metadata: { rank: "ASI", beltNumber: "614/KKR", pno: "06281923" }, isActive: true },
      { code: "SI_POOJA_RANI", label: "SI Pooja Rani", description: "Belt: 819/KKR · PNO: 07291845 · Sub-Inspector", metadata: { rank: "Sub-Inspector", beltNumber: "819/KKR", pno: "07291845" }, isActive: true },
      { code: "ASI_SURENDER_PAL", label: "ASI Surender Pal", description: "Belt: 419/KKR · PNO: 09384712 · Assistant Sub-Inspector", metadata: { rank: "ASI", beltNumber: "419/KKR", pno: "09384712" }, isActive: true },
      { code: "HC_DEVINDER_KUMAR", label: "HC Devinder Kumar", description: "Belt: 889/KKR · PNO: 05192834 · Head Constable (MHC)", metadata: { rank: "Head Constable", beltNumber: "889/KKR", pno: "05192834" }, isActive: true },
    ],
  },
  {
    key: "police_stations",
    name: "Police Stations & Posts",
    description: "Jurisdictional police stations and posts across the district.",
    usageLocation: "Station Switcher, Transfer Modal, Registration",
    defaultItems: [
      { code: "PS_CITY_THANESAR", label: "PS City Thanesar", description: "Station Code: HAR-KKR-PS-01 · Urban Area", isActive: true },
      { code: "PS_SADAR_THANESAR", label: "PS Sadar Thanesar", description: "Station Code: HAR-KKR-PS-02 · Rural & GT Road", isActive: true },
      { code: "PS_KRISHNA_GATE", label: "PS Krishna Gate", description: "Station Code: HAR-KKR-PS-03 · Old City / Mandir Area", isActive: true },
      { code: "PS_SHAHABAD", label: "PS Shahabad", description: "Station Code: HAR-KKR-PS-04 · Shahabad Sub-Division", isActive: true },
      { code: "PS_PEHOWA", label: "PS Pehowa", description: "Station Code: HAR-KKR-PS-05 · Pehowa Sub-Division", isActive: true },
      { code: "PS_LADWA", label: "PS Ladwa", description: "Station Code: HAR-KKR-PS-06 · Ladwa Sub-Division", isActive: true },
      { code: "PS_CYBER_CRIME", label: "PS Cyber Crime Kurukshetra", description: "District Cyber Crime Police Station", isActive: true },
      { code: "PS_WOMEN", label: "PS Women Kurukshetra", description: "Specialized Women Police Station", isActive: true },
      { code: "PP_SECTOR_7", label: "Police Post Sector 7", description: "Sub-post under PS City Thanesar", isActive: true },
      { code: "PP_UNIVERSITY", label: "Police Post KUK Campus", description: "University Campus Police Post", isActive: true },
    ],
  },
  {
    key: "priorities",
    name: "Priority Levels",
    description: "Severity levels for triage and alert workflows.",
    usageLocation: "Complaint Registration, Filter, GD Urgency",
    supportsColors: true,
    defaultItems: [
      { code: "LOW", label: "Low", description: "Routine, non-urgent matters with standard resolution cycle", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", isActive: true },
      { code: "MEDIUM", label: "Medium", description: "Standard inquiry matters requiring normal supervision", badgeColor: "bg-blue-100 text-blue-700 border-blue-200", isActive: true },
      { code: "HIGH", label: "High", description: "Urgent issues requiring prompt spot inspection within 48h", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", isActive: true },
      { code: "CRITICAL_SENSITIVE", label: "Critical / Sensitive", description: "Immediate threat to life or senior supervisory direction", badgeColor: "bg-red-100 text-red-800 border-red-200", isActive: true },
    ],
  },
  {
    key: "disposition_types",
    name: "Disposition Outcomes",
    description: "Final statutory resolution categories upon inquiry completion.",
    usageLocation: "Disposal Modal, Final Reports",
    defaultItems: [
      { code: "FIR_REGISTERED", label: "FIR Registered", description: "Cognizable offence substantiated; formal FIR drawn", isActive: true },
      { code: "NCR_FILED", label: "NCR Filed", description: "Non-cognizable report entered under BNSS Section 174", isActive: true },
      { code: "MUTUAL_COMPROMISE", label: "Mutual Compromise", description: "Parties arrived at amicable, lawful compromise without coercion", isActive: true },
      { code: "CIVIL_REFERRED", label: "Civil Court Referred", description: "Civil matter; parties directed to competent civil court", isActive: true },
      { code: "UNSUBSTANTIATED", label: "Unsubstantiated / False", description: "Inquiry revealed allegations were unfounded or fabricated", isActive: true },
      { code: "TRANSFERRED", label: "Transferred Out", description: "Transferred to correct police station having territorial jurisdiction", isActive: true },
    ],
  },
  {
    key: "officer_ranks",
    name: "Officer Ranks",
    description: "Police hierarchical ranks used in Haryana Police.",
    usageLocation: "User Roster, GD Entry, Officers",
    defaultItems: [
      { code: "INSPECTOR", label: "Inspector / SHO", description: "Station House Officer / Inspector of Police", isActive: true },
      { code: "SUB_INSPECTOR", label: "Sub-Inspector (SI)", description: "Enquiry Officer / IO", isActive: true },
      { code: "ASSISTANT_SUB_INSPECTOR", label: "Assistant Sub-Inspector (ASI)", description: "Duty Officer / Inquiry Officer", isActive: true },
      { code: "HEAD_CONSTABLE", label: "Head Constable (HC / MHC)", description: "Moharrir Head Constable / Section Incharge", isActive: true },
      { code: "CONSTABLE", label: "Constable", description: "Executive Staff / Sentry / Patrol Staff", isActive: true },
      { code: "DEPUTY_SP", label: "Deputy Superintendent of Police (DSP)", description: "Gazetted Supervisory Officer", isActive: true },
    ],
  },
  {
    key: "relation_types",
    name: "Relative Relation Types",
    description: "Parental/Spousal relations for complainant and accused records.",
    usageLocation: "Complainant Details, Accused Details",
    defaultItems: [
      { code: "S/O", label: "S/o (Son of)", description: "Son of", isActive: true },
      { code: "D/O", label: "D/o (Daughter of)", description: "Daughter of", isActive: true },
      { code: "W/O", label: "W/o (Wife of)", description: "Wife of", isActive: true },
      { code: "C/O", label: "C/o (Care of)", description: "Care of / Ward of", isActive: true },
    ],
  },
  {
    key: "direction_templates",
    name: "Supervisory Direction Templates",
    description: "Standard pre-approved supervisory orders issued by SHO upon EO assignment.",
    usageLocation: "Assign EO Modal",
    defaultItems: [
      { code: "SPOT_VERIFY", label: "Preliminary Spot Verification (BNSS 173(3))", description: "Conduct spot inspection within 48 hours and record witness statements", isActive: true },
      { code: "SECTION_35_NOTICE", label: "Notice to Accused (Section 35(3) BNSS)", description: "Issue formal appearance notice under Section 35(3) BNSS to suspect(s)", isActive: true },
      { code: "DIGITAL_CCTV", label: "Collect CCTV & Digital Evidence", description: "Preserve CCTV footage, UPI transaction receipts, and digital records", isActive: true },
      { code: "MEDIATION", label: "Mediation & Mutual Settlement", description: "Convene joint meeting at Station Helpdesk for lawful compromise", isActive: true },
      { code: "MEDICAL_MLR", label: "Hospital MLR & Medical Verification", description: "Obtain formal Medico-Legal Report from Civil Hospital", isActive: true },
      { code: "REVENUE_LAND", label: "Revenue Patwari Land Demarcation", description: "Coordinate with Halqa Patwari for Khasra/Khatoni demarcation", isActive: true },
    ],
  },
];

const STORAGE_KEY = "haryana_police_cms_dropdowns_v2";

function loadFromStorage(): Record<string, DropdownItem[]> {
  if (typeof window === "undefined") {
    // Return defaults on server
    const defaults: Record<string, DropdownItem[]> = {};
    for (const cat of DROPDOWN_CATEGORIES) {
      defaults[cat.key] = cat.defaultItems.map((item, idx) => ({
        ...item,
        id: `dd_${cat.key}_${idx + 1}`,
        categoryKey: cat.key,
        isSystem: true,
      }));
    }
    return defaults;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all categories exist
      let changed = false;
      for (const cat of DROPDOWN_CATEGORIES) {
        if (!parsed[cat.key] || !Array.isArray(parsed[cat.key])) {
          parsed[cat.key] = cat.defaultItems.map((item, idx) => ({
            ...item,
            id: `dd_${cat.key}_${idx + 1}`,
            categoryKey: cat.key,
            isSystem: true,
          }));
          changed = true;
        }
      }
      if (changed) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to read dropdowns from localStorage:", e);
  }

  // Initialize fresh defaults
  const initial: Record<string, DropdownItem[]> = {};
  for (const cat of DROPDOWN_CATEGORIES) {
    initial[cat.key] = cat.defaultItems.map((item, idx) => ({
      ...item,
      id: `dd_${cat.key}_${idx + 1}`,
      categoryKey: cat.key,
      isSystem: true,
    }));
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch (e) {}
  return initial;
}

function saveToStorage(data: Record<string, DropdownItem[]>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Trigger custom event so all open views immediately update
    window.dispatchEvent(new CustomEvent("cms-dropdowns-updated", { detail: data }));
  } catch (e) {
    console.error("Failed to save dropdowns to localStorage:", e);
  }
}

export const DropdownManagerService = {
  // Get all registered category definitions
  getCategories(): DropdownCategory[] {
    return DROPDOWN_CATEGORIES;
  },

  // Get category by key
  getCategory(key: string): DropdownCategory | undefined {
    return DROPDOWN_CATEGORIES.find((c) => c.key === key);
  },

  // Get items for a given category (active only or all)
  getItems(categoryKey: string, activeOnly: boolean = false): DropdownItem[] {
    const store = loadFromStorage();
    const items = store[categoryKey] || [];
    if (activeOnly) {
      return items.filter((i) => i.isActive);
    }
    return items;
  },

  // Add a new dropdown item
  addItem(categoryKey: string, itemData: Omit<DropdownItem, "id" | "categoryKey">): DropdownItem {
    const store = loadFromStorage();
    const list = store[categoryKey] || [];

    // Check duplicate code
    const existing = list.find((i) => i.code.trim().toUpperCase() === itemData.code.trim().toUpperCase());
    if (existing) {
      throw new Error(`An option with code "${itemData.code}" already exists in this dropdown category.`);
    }

    const newItem: DropdownItem = {
      id: `dd_${categoryKey}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      categoryKey,
      code: itemData.code.trim().toUpperCase(),
      label: itemData.label.trim(),
      description: itemData.description?.trim(),
      badgeColor: itemData.badgeColor,
      isActive: itemData.isActive !== false,
      isSystem: false,
      metadata: itemData.metadata,
    };

    list.push(newItem);
    store[categoryKey] = list;
    saveToStorage(store);
    return newItem;
  },

  // Update an existing item
  updateItem(categoryKey: string, itemId: string, updates: Partial<Omit<DropdownItem, "id" | "categoryKey">>): DropdownItem {
    const store = loadFromStorage();
    const list = store[categoryKey] || [];
    const index = list.findIndex((i) => i.id === itemId);

    if (index === -1) {
      throw new Error("Dropdown item not found.");
    }

    // Check code uniqueness if code changed
    if (updates.code) {
      const codeUpper = updates.code.trim().toUpperCase();
      const duplicate = list.find((i) => i.id !== itemId && i.code.toUpperCase() === codeUpper);
      if (duplicate) {
        throw new Error(`Another option with code "${updates.code}" already exists.`);
      }
      updates.code = codeUpper;
    }

    const updated: DropdownItem = {
      ...list[index],
      ...updates,
      label: updates.label ? updates.label.trim() : list[index].label,
      description: updates.description !== undefined ? updates.description.trim() : list[index].description,
    };

    list[index] = updated;
    store[categoryKey] = list;
    saveToStorage(store);
    return updated;
  },

  // Delete an item
  deleteItem(categoryKey: string, itemId: string): boolean {
    const store = loadFromStorage();
    const list = store[categoryKey] || [];
    const initialLength = list.length;
    const filtered = list.filter((i) => i.id !== itemId);

    if (filtered.length === initialLength) {
      return false;
    }

    store[categoryKey] = filtered;
    saveToStorage(store);
    return true;
  },

  // Toggle active status
  toggleItemStatus(categoryKey: string, itemId: string): boolean {
    const store = loadFromStorage();
    const list = store[categoryKey] || [];
    const item = list.find((i) => i.id === itemId);
    if (!item) return false;

    item.isActive = !item.isActive;
    store[categoryKey] = list;
    saveToStorage(store);
    return item.isActive;
  },

  // Reset a category to its original system defaults
  resetCategoryToDefault(categoryKey: string): void {
    const cat = DROPDOWN_CATEGORIES.find((c) => c.key === categoryKey);
    if (!cat) return;

    const store = loadFromStorage();
    store[categoryKey] = cat.defaultItems.map((item, idx) => ({
      ...item,
      id: `dd_${categoryKey}_${idx + 1}`,
      categoryKey,
      isSystem: true,
    }));
    saveToStorage(store);
  },

  // Reset all categories to defaults
  resetAllToDefault(): void {
    const initial: Record<string, DropdownItem[]> = {};
    for (const cat of DROPDOWN_CATEGORIES) {
      initial[cat.key] = cat.defaultItems.map((item, idx) => ({
        ...item,
        id: `dd_${cat.key}_${idx + 1}`,
        categoryKey: cat.key,
        isSystem: true,
      }));
    }
    saveToStorage(initial);
  },
};
