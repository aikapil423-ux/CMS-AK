// Dropdown Manager Service - Haryana Police CMS
// Manages all dynamic dropdowns across Complaints, FIR, Roznamcha GD, and Common modules with persistent storage and system defaults.

export type DropdownModule = "Complaints" | "FIR" | "Roznamcha (GD)" | "Common";

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
  module: DropdownModule;
  description: string;
  iconName?: string;
  usageLocation: string;
  supportsColors?: boolean;
  defaultItems: Omit<DropdownItem, "id" | "categoryKey">[];
}

export const DROPDOWN_CATEGORIES: DropdownCategory[] = [
  // ==========================================
  // 1. COMPLAINTS MODULE DROPDOWNS
  // ==========================================
  {
    key: "complaint_categories",
    name: "Complaint Categories",
    module: "Complaints",
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
    module: "Complaints",
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
    key: "enquiry_officers",
    name: "Enquiry Officers (EO Roster)",
    module: "Complaints",
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
    key: "direction_templates",
    name: "Supervisory Direction Templates",
    module: "Complaints",
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
  {
    key: "eo_recommendation_categories",
    name: "EO Recommendation to SHO",
    module: "Complaints",
    description: "Statutory enquiry recommendation categories selected by EO when dispatching report to SHO.",
    usageLocation: "Send to SHO Modal, Enquiry Reports Tab",
    supportsColors: true,
    defaultItems: [
      { code: "FIR_RECOMMEND", label: "FIR Recommendation (प्राथमिकी दर्ज)", description: "Cognizable offence substantiated; recommending formal registration of FIR", badgeColor: "bg-red-100 text-red-800 border-red-200", isActive: true },
      { code: "NCR", label: "NCR Recommendation (गैर-संज्ञेय रिपोर्ट)", description: "Non-cognizable dispute; recommended for entry under Section 174 BNSS", badgeColor: "bg-blue-100 text-blue-800 border-blue-200", isActive: true },
      { code: "CLOSURE", label: "Closure / Cancellation (निस्तारण / समझौता)", description: "Amicable mutual settlement, false/civil matter, or lack of substance", badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200", isActive: true },
    ],
  },
  {
    key: "disposition_types",
    name: "Disposition Outcomes",
    module: "Complaints",
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

  // ==========================================
  // 2. FIR MODULE DROPDOWNS
  // ==========================================
  {
    key: "fir_source_of_complaint",
    name: "FIR Source of Information",
    module: "FIR",
    description: "Source from which criminal information was received at the police station (CCTNS Standard).",
    usageLocation: "FIR Registration Tab 1 (General Information)",
    defaultItems: [
      { code: "CITIZEN_PUBLIC", label: "Citizen/General Public", description: "Direct complaint submitted by affected citizen", isActive: true },
      { code: "CITIZEN_CSC", label: "Citizen Service Center", description: "Forwarded via Saral/CSC police desk", isActive: true },
      { code: "POLICE_COGNIZANCE", label: "Cognizance by Police", description: "Spot arrest, patrol detection, or officer information", isActive: true },
      { code: "COURT", label: "Court / Judicial Magistrate", description: "Directed by court under Section 175(3) BNSS", isActive: true },
      { code: "DGP_OFFICE", label: "DGP Office", description: "Headquarters DGP reference", isActive: true },
      { code: "HIGHER_OFFICES", label: "Higher Offices / SP Office", description: "District SP or Range IG office endorsement", isActive: true },
      { code: "HOME_MINISTRY", label: "Home Ministry Office", description: "State or Central Home Department reference", isActive: true },
      { code: "INFORMER", label: "Informer / Source", description: "Confidential police source tip", isActive: true },
      { code: "NHRC", label: "National Human Rights Commission", description: "Statutory rights commission notice", isActive: true },
      { code: "NCW", label: "National Women Commission", description: "National or State Commission for Women reference", isActive: true },
      { code: "DIRECT_EMAIL", label: "Direct Email / Electronic", description: "Electronic FIR intimation under BNSS 173(1)", isActive: true },
      { code: "OTHER_PS", label: "Other Police Stations", description: "Zero FIR transfer or inter-district transfer", isActive: true },
      { code: "OTHERS", label: "Others", description: "Miscellaneous external source", isActive: true },
    ],
  },
  {
    key: "fir_direction_from_ps",
    name: "FIR Incident Direction from PS",
    module: "FIR",
    description: "Cardinal direction of place of occurrence from the police station.",
    usageLocation: "FIR Registration Tab 2 (Place of Occurrence)",
    defaultItems: [
      { code: "NORTH", label: "NORTH", description: "Towards North of Station", isActive: true },
      { code: "EAST", label: "EAST", description: "Towards East of Station", isActive: true },
      { code: "WEST", label: "WEST", description: "Towards West of Station", isActive: true },
      { code: "SOUTH", label: "SOUTH", description: "Towards South of Station", isActive: true },
      { code: "NORTH_EAST", label: "NORTH-EAST", description: "Towards North-East of Station", isActive: true },
      { code: "NORTH_WEST", label: "NORTH-WEST", description: "Towards North-West of Station", isActive: true },
      { code: "SOUTH_EAST", label: "SOUTH-EAST", description: "Towards South-East of Station", isActive: true },
      { code: "SOUTH_WEST", label: "SOUTH-WEST", description: "Towards South-West of Station", isActive: true },
    ],
  },
  {
    key: "fir_action_taken",
    name: "FIR Action Taken by Police",
    module: "FIR",
    description: "Statutory disposition ordered under Section 173 BNSS upon FIR registration.",
    usageLocation: "FIR Registration Tab 1 (Action Taken)",
    supportsColors: true,
    defaultItems: [
      { code: "INVESTIGATION_ASSIGN_IO", label: "Investigation/Assign IO", description: "Detailed investigation ordered; IO assigned", badgeColor: "bg-blue-100 text-blue-800 border-blue-200", isActive: true },
      { code: "SELF_INVESTIGATION", label: "Self Investigation", description: "SHO undertaking investigation personally", badgeColor: "bg-purple-100 text-purple-800 border-purple-200", isActive: true },
      { code: "REFUSED", label: "Refused", description: "Investigation refused under statutory proviso", badgeColor: "bg-red-100 text-red-800 border-red-200", isActive: true },
      { code: "TRANSFERRED", label: "Transferred", description: "Zero FIR transferred to competent jurisdictional police station", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", isActive: true },
    ],
  },
  {
    key: "fir_major_heads",
    name: "FIR Major Crime Heads",
    module: "FIR",
    description: "High-level statutory crime classification heads.",
    usageLocation: "FIR Registration Tab 1 (Major Head)",
    defaultItems: [
      { code: "PROPERTY", label: "Crime Against Property", description: "Theft, burglary, robbery, extortion, criminal trespass", isActive: true },
      { code: "BODY", label: "Crime Against Body", description: "Murder, attempt to murder, hurt, kidnapping, assault", isActive: true },
      { code: "WOMEN", label: "Crime Against Women", description: "Rape, outraging modesty, dowry, domestic violence", isActive: true },
      { code: "ECONOMIC", label: "Economic Offences", description: "Cheating, embezzlement, bank fraud, forgery", isActive: true },
      { code: "CYBER", label: "Cyber Crime", description: "Financial cyber fraud, identity theft, unauthorized access", isActive: true },
      { code: "DRUGS", label: "Narcotic Drugs", description: "NDPS violations, trafficking, illegal possession", isActive: true },
      { code: "PEACE_ORDER", label: "Public Peace & Order", description: "Rioting, unlawful assembly, obstruction, affray", isActive: true },
      { code: "SPECIAL_LAWS", label: "Special & Local Laws", description: "Arms Act, Excise Act, Gambling Act violations", isActive: true },
      { code: "TRAFFIC", label: "Traffic & Motor Vehicles", description: "Rash driving, fatal accident, hit and run", isActive: true },
    ],
  },
  {
    key: "fir_property_categories",
    name: "FIR Property Categories",
    module: "FIR",
    description: "Categories of property involved, stolen, or recovered in case.",
    usageLocation: "FIR Registration Tab 8 (Property of Interest)",
    defaultItems: [
      { code: "AUTOMOBILES", label: "AUTOMOBILES AND OTHERS", description: "Motorcycles, cars, commercial vehicles, non-motorized", isActive: true },
      { code: "COIN_CURRENCY", label: "COIN AND CURRENCY", description: "Cash, foreign currency, FICN counterfeit notes", isActive: true },
      { code: "CYBER_DEVICES", label: "CYBER CRIME", description: "Mobile phones, laptops, hard drives, SIM cards, routers", isActive: true },
      { code: "JEWELLERY", label: "JEWELLERY", description: "Gold, silver, diamonds, ornaments, precious metals", isActive: true },
      { code: "DOCUMENTS", label: "DOCUMENTS AND VALUABLE SECURITIES", description: "Passports, cheques, property deeds, stamp papers", isActive: true },
      { code: "ARMS_AMMO", label: "ARMS AND AMMUNITION", description: "Firearms, cartridges, country-made pistols, swords", isActive: true },
      { code: "DRUGS", label: "DRUGS/NARCOTIC DRUGS", description: "Commercial/intermediate NDPS contraband substances", isActive: true },
      { code: "ELECTRONICS", label: "ELECTRICAL AND ELECTRONIC GOODS", description: "Televisions, ACs, copper cables, transformers", isActive: true },
      { code: "AGRICULTURE", label: "AGRICULTURE EQUIPMENT", description: "Tractors, pump sets, agricultural produce, tools", isActive: true },
      { code: "EXPLOSIVES", label: "EXPLOSIVES", description: "Detonators, crude bombs, chemical substances", isActive: true },
      { code: "CULTURAL", label: "CULTURAL PROPERTY", description: "Idols, statues, antiquities, heritage artifacts", isActive: true },
      { code: "WILDLIFE", label: "WILD LIFE", description: "Animal skin, tusks, rare birds, contraband timber", isActive: true },
      { code: "OTHERS", label: "OTHERS", description: "General household, scrap, or miscellaneous items", isActive: true },
    ],
  },
  {
    key: "fir_weapon_used",
    name: "FIR Weapon Used (Hurt Case)",
    module: "FIR",
    description: "Weapon, implement, or force employed during incident.",
    usageLocation: "FIR Registration Tab 9 (Hurt Detail)",
    defaultItems: [
      { code: "PHYSICAL_BLUNT", label: "Physical assault / Blunt", description: "Fists, kicks, blunt wooden stick, rods", isActive: true },
      { code: "SHARP_WEAPON", label: "Sharp edged weapon / Knife / Lathi", description: "Knife, dagger, sword, gandasi, sharp implement", isActive: true },
      { code: "FIREARM", label: "Firearm / Gunshot", description: "Pistol, revolver, country-made firearm, rifle", isActive: true },
      { code: "ACID_CORROSIVE", label: "Acid / Corrosive substance", description: "Acid or chemical substance", isActive: true },
      { code: "POISON_CHEMICAL", label: "Poison / Chemical", description: "Toxic substance, sedative, or poisonous food", isActive: true },
      { code: "VEHICULAR", label: "Vehicular collision", description: "Intentional or reckless vehicular impact", isActive: true },
      { code: "NONE", label: "None / Non-physical", description: "Threat, intimidation, or verbal extortion", isActive: true },
    ],
  },

  // ==========================================
  // 3. ROZNAMCHA (GD) MODULE DROPDOWNS
  // ==========================================
  {
    key: "gd_types",
    name: "General Diary (GD) Entry Types",
    module: "Roznamcha (GD)",
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
    key: "gd_urgency",
    name: "GD Urgency Levels",
    module: "Roznamcha (GD)",
    description: "Urgency classifications for daily station diary entries.",
    usageLocation: "New GD Entry Form, Filter",
    supportsColors: true,
    defaultItems: [
      { code: "ROUTINE", label: "Routine", description: "Standard daily administrative occurrence", badgeColor: "bg-slate-100 text-slate-700 border-slate-200", isActive: true },
      { code: "URGENT", label: "Urgent", description: "Requires prompt attention by next shift sentry/officer", badgeColor: "bg-amber-100 text-amber-800 border-amber-200", isActive: true },
      { code: "HIGH_PRIORITY", label: "High Priority / Law & Order", description: "Immediate supervisory attention required", badgeColor: "bg-red-100 text-red-800 border-red-200", isActive: true },
    ],
  },

  // ==========================================
  // 4. COMMON / MASTER DROPDOWNS
  // ==========================================
  {
    key: "gender_options",
    name: "Gender Options",
    module: "Common",
    description: "Gender choices for citizens, victims, complainants, and accused.",
    usageLocation: "Complaint Registration, FIR Accused/Victim Forms",
    defaultItems: [
      { code: "MALE", label: "Male", description: "Male", isActive: true },
      { code: "FEMALE", label: "Female", description: "Female", isActive: true },
      { code: "TRANSGENDER", label: "Transgender", description: "Transgender", isActive: true },
      { code: "UNKNOWN", label: "Unknown", description: "Unidentified or anonymous persona", isActive: true },
    ],
  },
  {
    key: "marital_status",
    name: "Marital Status",
    module: "Common",
    description: "Marital status choices for citizens and accused records.",
    usageLocation: "FIR Complainant/Victim/Accused Details",
    defaultItems: [
      { code: "MARRIED", label: "Married", description: "Married", isActive: true },
      { code: "UNMARRIED", label: "Un Married", description: "Unmarried / Single", isActive: true },
      { code: "WIDOW", label: "Widow", description: "Widowed female", isActive: true },
      { code: "WIDOWER", label: "Widower", description: "Widowed male", isActive: true },
      { code: "SEPARATED", label: "Separated", description: "Living separately", isActive: true },
      { code: "DIVORCEE", label: "Divorcee", description: "Legally divorced", isActive: true },
      { code: "LIVE_IN", label: "Live In relation", description: "Cohabiting partnership", isActive: true },
    ],
  },
  {
    key: "caste_category",
    name: "Caste / Social Category",
    module: "Common",
    description: "Statutory demographic categories required for CCTNS reports.",
    usageLocation: "FIR Victim / Accused Details",
    defaultItems: [
      { code: "GENERAL", label: "GENERAL", description: "General category", isActive: true },
      { code: "OBC", label: "OTHER BACKWARD CLASSES (OBC)", description: "Other Backward Classes", isActive: true },
      { code: "SCHEDULED_CASTE", label: "SCHEDULED CASTE", description: "Scheduled Castes (SC)", isActive: true },
      { code: "SCHEDULED_TRIBE", label: "SCHEDULED TRIBE", description: "Scheduled Tribes (ST)", isActive: true },
    ],
  },
  {
    key: "identification_type",
    name: "Identification Document Types",
    module: "Common",
    description: "Official identity proof documents accepted at police desks.",
    usageLocation: "Complaint & FIR ID Verification",
    defaultItems: [
      { code: "AADHAAR", label: "Aadhar Card", description: "12-digit Unique Identification Authority of India UID", isActive: true },
      { code: "VOTER_ID", label: "Voter Card", description: "Election Commission of India EPIC Card", isActive: true },
      { code: "DRIVING_LICENSE", label: "Driving License", description: "State Transport Authority DL", isActive: true },
      { code: "PAN_CARD", label: "Income Tax (PAN) Card", description: "Permanent Account Number Card", isActive: true },
      { code: "PASSPORT", label: "Passport", description: "Indian or Foreign National Passport", isActive: true },
      { code: "RATION_CARD", label: "Ration Card", description: "Department of Food & Supplies Family Card", isActive: true },
      { code: "ARMS_LICENSE", label: "Arms License", description: "District Magistrate Arms License Booklet", isActive: true },
      { code: "VISA", label: "Visa", description: "Valid Indian Immigration Visa for foreign nationals", isActive: true },
      { code: "ANY_OTHER", label: "Any Other", description: "Other government/institutional identity card", isActive: true },
    ],
  },
  {
    key: "relation_types",
    name: "Relative Relation Types",
    module: "Common",
    description: "Parental/Spousal relations for complainant and accused records.",
    usageLocation: "Complainant Details, Accused Details, Victims",
    defaultItems: [
      { code: "SO", label: "S/o (Son of)", description: "Son of", isActive: true },
      { code: "DO", label: "D/o (Daughter of)", description: "Daughter of", isActive: true },
      { code: "WO", label: "W/o (Wife of)", description: "Wife of", isActive: true },
      { code: "CO", label: "C/o (Care of)", description: "Care of / Ward of", isActive: true },
      { code: "FATHER", label: "Father", description: "Father", isActive: true },
      { code: "MOTHER", label: "Mother", description: "Mother", isActive: true },
      { code: "HUSBAND", label: "Husband", description: "Husband", isActive: true },
      { code: "WIFE", label: "Wife", description: "Wife", isActive: true },
      { code: "GUARDIAN", label: "Guardian", description: "Legal Guardian", isActive: true },
    ],
  },
  {
    key: "police_stations",
    name: "Police Stations & Posts",
    module: "Common",
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
    module: "Common",
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
    key: "officer_ranks",
    name: "Officer Ranks",
    module: "Common",
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
];

const STORAGE_KEY = "haryana_police_cms_dropdowns_v4";

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
    let parsed: Record<string, DropdownItem[]> = {};
    
    if (raw) {
      parsed = JSON.parse(raw);
    } else {
      // Migrate from v2 if available
      try {
        const oldV2 = window.localStorage.getItem("haryana_police_cms_dropdowns_v2");
        if (oldV2) {
          parsed = JSON.parse(oldV2);
        }
      } catch {}
    }

    let changed = false;
    for (const cat of DROPDOWN_CATEGORIES) {
      if (!parsed[cat.key] || !Array.isArray(parsed[cat.key]) || parsed[cat.key].length === 0) {
        parsed[cat.key] = cat.defaultItems.map((item, idx) => ({
          ...item,
          id: `dd_${cat.key}_${idx + 1}`,
          categoryKey: cat.key,
          isSystem: true,
        }));
        changed = true;
      }
    }

    if (changed || !raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch (e) {
    console.error("Failed to read dropdowns from localStorage:", e);
  }

  // Fallback defaults
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

  // Get distinct module names
  getModules(): ("All" | DropdownModule)[] {
    return ["All", "Complaints", "FIR", "Roznamcha (GD)", "Common"];
  },

  // Get categories filtered by module
  getCategoriesByModule(module: string): DropdownCategory[] {
    if (!module || module === "All") return DROPDOWN_CATEGORIES;
    return DROPDOWN_CATEGORIES.filter((c) => c.module === module);
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

  // Helper returning just string labels for quick dropdown option binding
  getOptionsList(categoryKey: string, fallback: string[] = []): string[] {
    try {
      const items = this.getItems(categoryKey, true);
      if (items && items.length > 0) {
        return items.map((i) => i.label);
      }
    } catch {}
    return fallback;
  },

  // Add a new dropdown item
  addItem(categoryKey: string, itemData: Omit<DropdownItem, "id" | "categoryKey">): DropdownItem {
    const store = loadFromStorage();
    const list = store[categoryKey] || [];

    // Check duplicate code or label
    const existingCode = list.find((i) => i.code.trim().toUpperCase() === itemData.code.trim().toUpperCase());
    if (existingCode) {
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
      categoryKey: cat.key,
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
