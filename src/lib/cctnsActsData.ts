// src/lib/cctnsActsData.ts
// Comprehensive CCTNS & Statutory Acts and Sections Directory for Haryana Police

import { BNS_2023_SECTIONS } from "./bnsSectionsData";
import { BNSS_2023_SECTIONS } from "./bnssSectionsData";
import { ARMS_ACT_1959_SECTIONS } from "./armsActSectionsData";
import { PUNJAB_EXCISE_1914_SECTIONS } from "./punjabExciseSectionsData";
import { HARYANA_POLICE_2007_SECTIONS } from "./haryanaPoliceSectionsData";
import { GAUVANSH_ACT_2015_SECTIONS } from "./gauvanshSectionsData";
import { NDPS_ACT_1985_SECTIONS } from "./ndpsSectionsData";
import { SC_ST_ACT_1989_SECTIONS } from "./scstSectionsData";
import { DOWRY_ACT_1961_SECTIONS } from "./dowrySectionsData";
import { GAMBLING_ACT_1867_SECTIONS } from "./gamblingSectionsData";
import { EXPLOSIVES_ACT_1908_SECTIONS } from "./explosivesSectionsData";

export interface CCTNSSectionItem {
  sectionNumber: string;
  title?: string;
  description?: string;
  punishment?: string;
  isPopular?: boolean;
}

export interface CCTNSActItem {
  id: string;
  title: string;
  shortName: string;
  category: string;
  sections: CCTNSSectionItem[];
}

export const CCTNS_ACTS_CATALOG: CCTNSActItem[] = [
  {
    id: "act_bns_2023",
    title: "The Bharatiya Nyaya Sanhita, 2023",
    shortName: "Bharatiya Nyaya Sanhita, 2023 (BNS)",
    category: "Substantive Criminal Law",
    sections: BNS_2023_SECTIONS,
  },
  {
    id: "act_punjab_excise_1914",
    title: "The Punjab Excise Act, 1914 (Haryana Amendment)",
    shortName: "Punjab Excise Act, 1914 (Haryana Amendment)",
    category: "State Acts (Haryana)",
    sections: PUNJAB_EXCISE_1914_SECTIONS,
  },
  {
    id: "act_ndps_1985",
    title: "The Narcotic Drugs and Psychotropic Substances Act, 1985",
    shortName: "Narcotic Drugs and Psychotropic Substances Act, 1985 (NDPS)",
    category: "Special & Local Laws",
    sections: NDPS_ACT_1985_SECTIONS,
  },
  {
    id: "act_it_2000",
    title: "The Information Technology Act, 2000",
    shortName: "Information Technology Act, 2000 (IT Act)",
    category: "Cyber Crime",
    sections: [
      { sectionNumber: "43", title: "Penalty and compensation for damage to computer, computer system, etc." },
      { sectionNumber: "65", title: "Tampering with computer source documents" },
      { sectionNumber: "66", title: "Computer related offences (Hacking)" },
      { sectionNumber: "66B", title: "Punishment for dishonestly receiving stolen computer resource or communication device" },
      { sectionNumber: "66C", title: "Punishment for identity theft (Impersonation, stolen passwords/OTP/signature)" },
      { sectionNumber: "66D", title: "Punishment for cheating by personation by using computer resource" },
      { sectionNumber: "66E", title: "Punishment for violation of privacy (Capturing/transmitting private images)" },
      { sectionNumber: "66F", title: "Punishment for cyber terrorism" },
      { sectionNumber: "67", title: "Punishment for publishing or transmitting obscene material in electronic form" },
      { sectionNumber: "67A", title: "Punishment for publishing or transmitting material containing sexually explicit act" },
      { sectionNumber: "67B", title: "Punishment for publishing or transmitting child pornography / CSAM in electronic form" },
      { sectionNumber: "69A", title: "Power to issue directions for blocking public access of information" },
      { sectionNumber: "72", title: "Penalty for breach of confidentiality and privacy" },
      { sectionNumber: "72A", title: "Punishment for disclosure of information in breach of lawful contract" },
    ],
  },
  {
    id: "act_pocso_2012",
    title: "The Protection of Children from Sexual Offences Act, 2012",
    shortName: "Protection of Children from Sexual Offences Act, 2012 (POCSO)",
    category: "Child Protection",
    sections: [
      { sectionNumber: "3", title: "Penetrative sexual assault defined" },
      { sectionNumber: "4(1)", title: "Punishment for penetrative sexual assault" },
      { sectionNumber: "4(2)", title: "Enhanced punishment for penetrative sexual assault on child under 16 years" },
      { sectionNumber: "5", title: "Aggravated penetrative sexual assault defined" },
      { sectionNumber: "6(1)", title: "Punishment for aggravated penetrative sexual assault" },
      { sectionNumber: "6(2)", title: "Aggravated penetrative sexual assault on child under 12 years (Death or Life)" },
      { sectionNumber: "7", title: "Sexual assault defined" },
      { sectionNumber: "8", title: "Punishment for sexual assault" },
      { sectionNumber: "9", title: "Aggravated sexual assault defined" },
      { sectionNumber: "10", title: "Punishment for aggravated sexual assault" },
      { sectionNumber: "11", title: "Sexual harassment of a child defined" },
      { sectionNumber: "12", title: "Punishment for sexual harassment of a child" },
      { sectionNumber: "14(1)", title: "Punishment for using child for pornographic purposes" },
      { sectionNumber: "15(1)", title: "Punishment for storage of child pornographic material" },
      { sectionNumber: "19(1)", title: "Mandatory reporting of POCSO offences to Special Juvenile Police Unit" },
      { sectionNumber: "21(1)", title: "Punishment for failure to report or record a case under POCSO" },
      { sectionNumber: "23(1)", title: "Punishment for media disclosure of identity of victim child" },
    ],
  },
  {
    id: "act_arms_1959",
    title: "The Arms Act, 1959",
    shortName: "The Arms Act, 1959",
    category: "Special & Local Laws",
    sections: ARMS_ACT_1959_SECTIONS,
  },
  {
    id: "act_mv_1988",
    title: "The Motor Vehicles Act, 1988",
    shortName: "Motor Vehicles Act, 1988 (MV Act)",
    category: "Traffic & Transport",
    sections: [
      { sectionNumber: "3/181", title: "Driving without driving licence" },
      { sectionNumber: "5/180", title: "Allowing unauthorized person to drive vehicle" },
      { sectionNumber: "39/192(1)", title: "Driving unregistered vehicle / without registration mark" },
      { sectionNumber: "66/192A", title: "Using vehicle without permit / contravention of permit conditions" },
      { sectionNumber: "112/183", title: "Driving at excessive speed / Over-speeding" },
      { sectionNumber: "113/194", title: "Overloading vehicle exceeding permissible axle weight" },
      { sectionNumber: "128/177", title: "Triple riding on two-wheeler" },
      { sectionNumber: "129/194D", title: "Riding without protective headgear (Helmet)" },
      { sectionNumber: "134(a)", title: "Duty of driver in case of accident to secure medical attention" },
      { sectionNumber: "134(b)", title: "Duty of driver to report accident details to police station" },
      { sectionNumber: "146/196", title: "Driving uninsured vehicle without third party insurance" },
      { sectionNumber: "177", title: "General provision for punishment of offences" },
      { sectionNumber: "184", title: "Driving dangerously / Rash driving endangering life" },
      { sectionNumber: "185", title: "Driving by a drunken person or by a person under the influence of drugs" },
      { sectionNumber: "187", title: "Punishment for offences relating to accident (Hit and Run failure to assist)" },
      { sectionNumber: "189", title: "Speed trials and racing on public roads without authorization" },
      { sectionNumber: "192A", title: "Using vehicle without permit" },
      { sectionNumber: "194B", title: "Driving without seat belt" },
      { sectionNumber: "194C", title: "Overloading of two-wheelers" },
      { sectionNumber: "196", title: "Driving uninsured vehicle" },
      { sectionNumber: "207", title: "Power of Police Officer to seize and detain vehicle without documents" },
    ],
  },
  {
    id: "act_sc_st_1989",
    title: "The Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act, 1989",
    shortName: "SC/ST (Prevention of Atrocities) Act, 1989",
    category: "Special & Local Laws",
    sections: SC_ST_ACT_1989_SECTIONS,
  },
  {
    id: "act_dowry_1961",
    title: "The Dowry Prohibition Act, 1961",
    shortName: "Dowry Prohibition Act, 1961",
    category: "Special & Local Laws",
    sections: DOWRY_ACT_1961_SECTIONS,
  },
  {
    id: "act_pc_1988",
    title: "The Prevention of Corruption Act, 1988",
    shortName: "Prevention of Corruption Act, 1988",
    category: "Anti-Corruption",
    sections: [
      { sectionNumber: "7(a)", title: "Public servant taking undue advantage for improper performance of duty" },
      { sectionNumber: "7(b)", title: "Obtaining undue advantage without public duty" },
      { sectionNumber: "7A", title: "Taking undue advantage to influence public servant by corrupt or illegal means" },
      { sectionNumber: "8", title: "Offence relating to bribing of a public servant" },
      { sectionNumber: "9", title: "Offence relating to bribing of a public servant by a commercial organisation" },
      { sectionNumber: "11", title: "Public servant obtaining undue advantage without consideration from person concerned" },
      { sectionNumber: "12", title: "Punishment for abetment of offences" },
      { sectionNumber: "13(1)(a)", title: "Criminal misconduct: Dishonestly or fraudulently converting property" },
      { sectionNumber: "13(1)(b)", title: "Criminal misconduct: Intentionally enriching illicitly during tenure" },
      { sectionNumber: "13(2)", title: "Punishment for criminal misconduct by public servant (4 to 10 years)" },
      { sectionNumber: "17A", title: "Enquiry or investigation of offences relatable to recommendations by public servant" },
    ],
  },
  {
    id: "act_gambling_1867",
    title: "The Public Gambling Act, 1867",
    shortName: "Public Gambling Act, 1867",
    category: "Special & Local Laws",
    sections: GAMBLING_ACT_1867_SECTIONS,
  },
  {
    id: "act_explosives_1908",
    title: "The Explosive Substances Act, 1908",
    shortName: "Explosive Substances Act, 1908",
    category: "Special & Local Laws",
    sections: EXPLOSIVES_ACT_1908_SECTIONS,
  },
  {
    id: "act_electricity_2003",
    title: "The Electricity Act, 2003",
    shortName: "Electricity Act, 2003",
    category: "Special & Local Laws",
    sections: [
      { sectionNumber: "135(1)(a)", title: "Theft of electricity by tapping or making unauthorized connection" },
      { sectionNumber: "135(1)(b)", title: "Theft of electricity by tampering with meter or installing device" },
      { sectionNumber: "135(1)(c)", title: "Theft of electricity by damaging meter or preventing recording" },
      { sectionNumber: "136", title: "Theft of electric lines and materials (Conductor/Transformer wire)" },
      { sectionNumber: "137", title: "Receiving stolen property of electric lines and materials" },
      { sectionNumber: "138", title: "Interference with meters or works of licensee" },
      { sectionNumber: "150", title: "Abetment of electricity theft offences" },
    ],
  },
  {
    id: "act_haryana_police_2007",
    title: "The Haryana Police Act, 2007",
    shortName: "Haryana Police Act, 2007",
    category: "State Acts (Haryana)",
    sections: HARYANA_POLICE_2007_SECTIONS,
  },
  {
    id: "act_gauvansh_2015",
    title: "The Haryana Gauvansh Sanrakshan and Gausamvardhan Act, 2015",
    shortName: "Haryana Gauvansh Sanrakshan Act, 2015",
    category: "State Acts (Haryana)",
    sections: GAUVANSH_ACT_2015_SECTIONS,
  },
  {
    id: "act_dppa_1984",
    title: "The Prevention of Damage to Public Property Act, 1984",
    shortName: "Prevention of Damage to Public Property Act, 1984",
    category: "Special & Local Laws",
    sections: [
      { sectionNumber: "3(1)", title: "Mischief causing damage to public property" },
      { sectionNumber: "3(2)(i)", title: "Damage to public property: Water, light, power installation" },
      { sectionNumber: "3(2)(ii)", title: "Damage to public property: Public transport or telecommunication" },
      { sectionNumber: "4", title: "Mischief causing damage to public property by fire or explosive substance" },
    ],
  },
  {
    id: "act_passports_1967",
    title: "The Passports Act, 1967",
    shortName: "Passports Act, 1967",
    category: "Special & Local Laws",
    sections: [
      { sectionNumber: "3", title: "Departure from India without passport or travel document prohibited" },
      { sectionNumber: "12(1)(a)", title: "Contravenes the provisions of Section 3" },
      { sectionNumber: "12(1)(b)", title: "Knowingly furnishes false information or suppresses material information" },
      { sectionNumber: "12(1)(c)", title: "Fails to produce passport or travel document on demand" },
      { sectionNumber: "12(2)", title: "Alters or tampers with passport or travel document" },
    ],
  },
  {
    id: "act_essential_1955",
    title: "The Essential Commodities Act, 1955",
    shortName: "Essential Commodities Act, 1955",
    category: "Special & Local Laws",
    sections: [
      { sectionNumber: "3", title: "Powers to control production, supply, distribution of essential commodities" },
      { sectionNumber: "7(1)(a)(i)", title: "Penalties for contravention of order under Section 3" },
      { sectionNumber: "7(1)(a)(ii)", title: "Penalties for contravention involving hoarding or black-marketing" },
      { sectionNumber: "8", title: "Attempts and abetment of offences under Section 3" },
    ],
  },
  {
    id: "act_benami_1988",
    title: "The Prohibition of Benami Property Transactions Act, 1988",
    shortName: "The Prohibition of Benami Property Transactions Act, 1988",
    category: "Economic & Property Law",
    sections: [
      { sectionNumber: "3(1)", title: "Prohibition of benami transactions" },
      { sectionNumber: "5", title: "Property held benami liable to confiscation by Central Government" },
      { sectionNumber: "6", title: "Prohibition on re-transfer of property by benamidar" },
      { sectionNumber: "53(1)", title: "Penalty for benami transaction: Rigorous imprisonment 1 to 7 years" },
      { sectionNumber: "54", title: "Penalty for false information: Imprisonment 6 months to 5 years" },
      { sectionNumber: "55A", title: "Power to tender immunity from prosecution to benamidar" },
    ],
  },
  {
    id: "act_ipc_1860",
    title: "The Indian Penal Code, 1860 (Pre-July 2024 / Legacy Matters)",
    shortName: "Indian Penal Code, 1860 (IPC)",
    category: "Legacy Penal Code",
    sections: [
      { sectionNumber: "34", title: "Acts done by several persons in furtherance of common intention" },
      { sectionNumber: "120B", title: "Punishment of criminal conspiracy" },
      { sectionNumber: "147", title: "Punishment for rioting" },
      { sectionNumber: "148", title: "Rioting, armed with deadly weapon" },
      { sectionNumber: "149", title: "Every member of unlawful assembly guilty of offence committed in prosecution of common object" },
      { sectionNumber: "186", title: "Obstructing public servant in discharge of public functions" },
      { sectionNumber: "188", title: "Disobedience to order duly promulgated by public servant" },
      { sectionNumber: "279", title: "Rash driving or riding on a public way" },
      { sectionNumber: "302", title: "Punishment for murder" },
      { sectionNumber: "304", title: "Punishment for culpable homicide not amounting to murder" },
      { sectionNumber: "304A", title: "Causing death by negligence" },
      { sectionNumber: "304B", title: "Dowry death" },
      { sectionNumber: "306", title: "Abetment of suicide" },
      { sectionNumber: "307", title: "Attempt to murder" },
      { sectionNumber: "308", title: "Attempt to commit culpable homicide" },
      { sectionNumber: "323", title: "Punishment for voluntarily causing hurt" },
      { sectionNumber: "324", title: "Voluntarily causing hurt by dangerous weapons or means" },
      { sectionNumber: "325", title: "Punishment for voluntarily causing grievous hurt" },
      { sectionNumber: "326", title: "Voluntarily causing grievous hurt by dangerous weapons or means" },
      { sectionNumber: "341", title: "Punishment for wrongful restraint" },
      { sectionNumber: "342", title: "Punishment for wrongful confinement" },
      { sectionNumber: "354", title: "Assault or criminal force to woman with intent to outrage her modesty" },
      { sectionNumber: "354A", title: "Sexual harassment" },
      { sectionNumber: "354B", title: "Assault or use of criminal force to woman with intent to disrobe" },
      { sectionNumber: "354C", title: "Voyeurism" },
      { sectionNumber: "354D", title: "Stalking" },
      { sectionNumber: "363", title: "Punishment for kidnapping" },
      { sectionNumber: "365", title: "Kidnapping or abducting with intent secretly and wrongfully to confine person" },
      { sectionNumber: "366", title: "Kidnapping, abducting or inducing woman to compel her marriage" },
      { sectionNumber: "376", title: "Punishment for rape" },
      { sectionNumber: "376D", title: "Gang rape" },
      { sectionNumber: "379", title: "Punishment for theft" },
      { sectionNumber: "380", title: "Theft in dwelling house, etc." },
      { sectionNumber: "381", title: "Theft by clerk or servant of property in possession of master" },
      { sectionNumber: "384", title: "Punishment for extortion" },
      { sectionNumber: "392", title: "Punishment for robbery" },
      { sectionNumber: "394", title: "Voluntarily causing hurt in committing robbery" },
      { sectionNumber: "395", title: "Punishment for dacoity" },
      { sectionNumber: "397", title: "Robbery, or dacoity, with attempt to cause death or grievous hurt" },
      { sectionNumber: "406", title: "Punishment for criminal breach of trust" },
      { sectionNumber: "409", title: "Criminal breach of trust by public servant, or by banker, merchant or agent" },
      { sectionNumber: "411", title: "Dishonestly receiving stolen property" },
      { sectionNumber: "419", title: "Punishment for cheating by personation" },
      { sectionNumber: "420", title: "Cheating and dishonestly inducing delivery of property" },
      { sectionNumber: "427", title: "Mischief causing damage to the amount of fifty rupees" },
      { sectionNumber: "447", title: "Punishment for criminal trespass" },
      { sectionNumber: "448", title: "Punishment for house-trespass" },
      { sectionNumber: "452", title: "House-trespass after preparation for hurt, assault or wrongful restraint" },
      { sectionNumber: "457", title: "Lurking house-trespass or house-breaking by night in order to commit offence" },
      { sectionNumber: "467", title: "Forgery of valuable security, will, etc." },
      { sectionNumber: "468", title: "Forgery for purpose of cheating" },
      { sectionNumber: "471", title: "Using as genuine a forged document or electronic record" },
      { sectionNumber: "498A", title: "Husband or relative of husband of a woman subjecting her to cruelty" },
      { sectionNumber: "504", title: "Intentional insult with intent to provoke breach of the peace" },
      { sectionNumber: "506", title: "Punishment for criminal intimidation" },
      { sectionNumber: "509", title: "Word, gesture or act intended to insult the modesty of a woman" },
      { sectionNumber: "511", title: "Punishment for attempting to commit offences" },
    ],
  },
  {
    id: "act_crpc_1973",
    title: "The Code of Criminal Procedure, 1973 (Pre-July 2024 / Legacy)",
    shortName: "Code of Criminal Procedure, 1973 (CrPC)",
    category: "Legacy Procedural Code",
    sections: [
      { sectionNumber: "41", title: "When police may arrest without warrant" },
      { sectionNumber: "41A", title: "Notice of appearance before police officer" },
      { sectionNumber: "91", title: "Summons to produce document or other thing" },
      { sectionNumber: "100", title: "Persons in charge of closed place to allow search" },
      { sectionNumber: "102", title: "Power of police officer to seize certain property" },
      { sectionNumber: "107", title: "Security for keeping the peace in other cases" },
      { sectionNumber: "151", title: "Arrest to prevent the commission of cognizable offences" },
      { sectionNumber: "154", title: "Information in cognizable cases (Registration of FIR)" },
      { sectionNumber: "156(3)", title: "Any Magistrate empowered under Section 190 may order investigation" },
      { sectionNumber: "160", title: "Police officer's power to require attendance of witnesses" },
      { sectionNumber: "161", title: "Examination of witnesses by police" },
      { sectionNumber: "164", title: "Recording of confessions and statements by Magistrate" },
      { sectionNumber: "167", title: "Procedure when investigation cannot be completed in 24 hours" },
      { sectionNumber: "173(2)", title: "Report of police officer on completion of investigation (Chargesheet / Final Form)" },
      { sectionNumber: "173(8)", title: "Further investigation after submission of police report" },
      { sectionNumber: "174", title: "Police to enquire and report on suicide, etc. (Inquest Report)" },
    ],
  },
  {
    id: "act_iea_1872",
    title: "The Indian Evidence Act, 1872 (Legacy)",
    shortName: "Indian Evidence Act, 1872 (IEA)",
    category: "Legacy Evidence Law",
    sections: [
      { sectionNumber: "24", title: "Confession caused by inducement, threat or promise, when irrelevant" },
      { sectionNumber: "25", title: "Confession to police-officer not to be proved" },
      { sectionNumber: "26", title: "Confession by accused while in custody of police not to be proved" },
      { sectionNumber: "27", title: "How much of information received from accused may be proved (Recovery Memo)" },
      { sectionNumber: "32", title: "Cases in which statement of relevant fact by person who is dead is relevant (Dying Declaration)" },
      { sectionNumber: "45", title: "Opinions of experts (FSL / Ballistics / Handwriting / DNA)" },
      { sectionNumber: "65B", title: "Admissibility of electronic records (Certificate under Section 65B)" },
      { sectionNumber: "113A", title: "Presumption as to abetment of suicide by a married woman" },
      { sectionNumber: "113B", title: "Presumption as to dowry death" },
    ],
  },
  {
    id: "act_bnss_2023",
    title: "The Bharatiya Nagarik Suraksha Sanhita, 2023",
    shortName: "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
    category: "Procedural Criminal Law",
    sections: BNSS_2023_SECTIONS,
  },
  {
    id: "act_bsa_2023",
    title: "The Bharatiya Sakshya Adhiniyam, 2023",
    shortName: "Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
    category: "Law of Evidence",
    sections: [
      { sectionNumber: "22", title: "Confession to police officer not to be proved (replaces 25 IEA)" },
      { sectionNumber: "23(1)", title: "Confession by accused while in custody of police not to be proved (replaces 26 IEA)" },
      { sectionNumber: "23(2)", title: "Information received from accused leading to discovery / Recovery Memo (replaces 27 IEA)" },
      { sectionNumber: "26", title: "Cases in which statement of relevant fact by person who is dead is relevant (Dying Declaration)" },
      { sectionNumber: "39", title: "Opinions of experts (FSL, Ballistics, Handwriting, DNA)" },
      { sectionNumber: "61", title: "Electronic or digital record as admissible evidence" },
      { sectionNumber: "63", title: "Admissibility of electronic records and Certificate under Section 63 (replaces 65B IEA)" },
      { sectionNumber: "117", title: "Presumption as to abetment of suicide by a married woman" },
      { sectionNumber: "118", title: "Presumption as to dowry death" },
    ],
  },
];

export interface UnifiedSectionOption {
  sectionNumber: string;
  title?: string;
  description?: string;
}

export interface UnifiedActOption {
  id: string;
  name: string; // The canonical name for the FIR (e.g. "Bharatiya Nyaya Sanhita, 2023 (BNS)")
  title: string;
  category: string;
  isCustom?: boolean;
  sections: UnifiedSectionOption[];
}

/**
 * Combines acts from ActsService (user custom uploads + built-ins) with CCTNS_ACTS_CATALOG
 * Deduplicates by canonical name/id and merges their section arrays seamlessly.
 */
export function getUnifiedActsCatalog(userActs: any[] = []): UnifiedActOption[] {
  const map = new Map<string, UnifiedActOption>();

  const normalizeKey = (str: string) => {
    return str
      .toLowerCase()
      .replace(/^(the\s+)/i, "")
      .replace(/[^a-z0-9]/g, "");
  };

  // 1. Seed with CCTNS_ACTS_CATALOG
  for (const cAct of CCTNS_ACTS_CATALOG) {
    const key = normalizeKey(cAct.title || cAct.shortName || cAct.id);
    const actOption: UnifiedActOption = {
      id: cAct.id,
      name: cAct.shortName || cAct.title,
      title: cAct.title,
      category: cAct.category,
      isCustom: false,
      sections: (cAct.sections || []).map((s) => ({
        sectionNumber: s.sectionNumber,
        title: s.title,
        description: s.description,
      })),
    };
    map.set(key, actOption);
    if (cAct.id) map.set(normalizeKey(cAct.id), actOption);
    if (cAct.shortName) map.set(normalizeKey(cAct.shortName), actOption);
    if (cAct.id === "act_bnss_2023") {
      map.set(normalizeKey("Bharatiya Nyaya Suraksha Sanhita, 2023 BNSS"), actOption);
      map.set(normalizeKey("The Bharatiya Nyaya Suraksha Sanhita, 2023"), actOption);
      map.set(normalizeKey("BNSS, 2023"), actOption);
    }
    if (cAct.id === "act_arms_1959") {
      map.set(normalizeKey("The Arms Act,1959"), actOption);
      map.set(normalizeKey("The Arms Act, 1959"), actOption);
      map.set(normalizeKey("Arms Act, 1959"), actOption);
      map.set(normalizeKey("Arms Act 1959"), actOption);
    }
    if (cAct.id === "act_punjab_excise_1914") {
      map.set(normalizeKey("Punjab Excise Act,1914"), actOption);
      map.set(normalizeKey("Punjab Excise Act, 1914"), actOption);
      map.set(normalizeKey("The Punjab Excise Act, 1914"), actOption);
      map.set(normalizeKey("Punjab Excise Act"), actOption);
    }
    if (cAct.id === "act_haryana_police_2007") {
      map.set(normalizeKey("Haryana Police Act,2007"), actOption);
      map.set(normalizeKey("Haryana Police Act, 2007"), actOption);
      map.set(normalizeKey("The Haryana Police Act, 2007"), actOption);
      map.set(normalizeKey("Haryana Police Act"), actOption);
    }
    if (cAct.id === "act_gauvansh_2015") {
      map.set(normalizeKey("Haryana Gauvansh sanrakshan Act,2015"), actOption);
      map.set(normalizeKey("Haryana Gauvansh sanrakshan Act, 2015"), actOption);
      map.set(normalizeKey("Haryana Gauvansh Sanrakshan Act, 2015"), actOption);
      map.set(normalizeKey("Haryana Gauvansh Sanrakshan Act,2015"), actOption);
      map.set(normalizeKey("The Haryana Gauvansh Sanrakshan and Gausamvardhan Act, 2015"), actOption);
      map.set(normalizeKey("The Haryana Gauvansh Sanrakshan and Gausamvardhan Act,2015"), actOption);
      map.set(normalizeKey("Haryana Gauvansh Sanrakshan Act"), actOption);
    }
    if (cAct.id === "act_ndps_1985") {
      map.set(normalizeKey("Narcotic Drugs and Psychotropic Substances Act, 1985"), actOption);
      map.set(normalizeKey("Narcotic Drugs and Psychotropic Substances Act,1985"), actOption);
      map.set(normalizeKey("The Narcotic Drugs and Psychotropic Substances Act, 1985"), actOption);
      map.set(normalizeKey("The Narcotic Drugs and Psychotropic Substances Act,1985"), actOption);
      map.set(normalizeKey("NDPS Act, 1985"), actOption);
      map.set(normalizeKey("NDPS Act,1985"), actOption);
      map.set(normalizeKey("NDPS Act"), actOption);
      map.set(normalizeKey("NDPS"), actOption);
      map.set(normalizeKey("Narcotic Drugs and Psychotropic Substances Act"), actOption);
    }
    if (cAct.id === "act_sc_st_1989") {
      map.set(normalizeKey("SC/ST (Prevention of Atrocities) Act, 1989"), actOption);
      map.set(normalizeKey("SC/ST (Prevention of Atrocities) Act,1989"), actOption);
      map.set(normalizeKey("SC/ST (Prevention of Atrocities) Act"), actOption);
      map.set(normalizeKey("The Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act, 1989"), actOption);
      map.set(normalizeKey("The Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act,1989"), actOption);
      map.set(normalizeKey("The Scheduled Castes and the Scheduled Tribes (Prevention of Atrocities) Act"), actOption);
      map.set(normalizeKey("SC/ST Act, 1989"), actOption);
      map.set(normalizeKey("SC/ST Act,1989"), actOption);
      map.set(normalizeKey("SC/ST Act"), actOption);
      map.set(normalizeKey("SC ST Act"), actOption);
      map.set(normalizeKey("SC ST (Prevention of Atrocities) Act"), actOption);
    }
    if (cAct.id === "act_dowry_1961") {
      map.set(normalizeKey("Dowry Prohibition Act, 1961"), actOption);
      map.set(normalizeKey("Dowry Prohibition Act,1961"), actOption);
      map.set(normalizeKey("The Dowry Prohibition Act, 1961"), actOption);
      map.set(normalizeKey("The Dowry Prohibition Act,1961"), actOption);
      map.set(normalizeKey("Dowry Prohibition Act"), actOption);
    }
    if (cAct.id === "act_gambling_1867") {
      map.set(normalizeKey("Public Gambling Act, 1867"), actOption);
      map.set(normalizeKey("Public Gambling Act,1867"), actOption);
      map.set(normalizeKey("The Public Gambling Act, 1867"), actOption);
      map.set(normalizeKey("The Public Gambling Act,1867"), actOption);
      map.set(normalizeKey("Public Gambling Act"), actOption);
      map.set(normalizeKey("Gambling Act"), actOption);
    }
    if (cAct.id === "act_explosives_1908") {
      map.set(normalizeKey("Explosive Substances Act, 1908"), actOption);
      map.set(normalizeKey("Explosive Substances Act,1908"), actOption);
      map.set(normalizeKey("The Explosive Substances Act, 1908"), actOption);
      map.set(normalizeKey("The Explosive Substances Act,1908"), actOption);
      map.set(normalizeKey("Explosive Substances Act"), actOption);
      map.set(normalizeKey("Explosives Act"), actOption);
    }
  }

  // 2. Merge with Acts from ActsService (user's custom uploaded bare acts + built-ins)
  if (Array.isArray(userActs)) {
    for (const uAct of userActs) {
      if (!uAct || (!uAct.title && !uAct.shortName)) continue;
      const key = normalizeKey(uAct.title || uAct.shortName || uAct.id || "");
      const existing = map.get(key) || (uAct.id ? map.get(normalizeKey(uAct.id)) : undefined);

      const userSections: UnifiedSectionOption[] = [];
      if (Array.isArray(uAct.keySections)) {
        for (const ks of uAct.keySections) {
          if (ks && ks.sectionNumber) {
            userSections.push({
              sectionNumber: String(ks.sectionNumber).trim(),
              title: ks.title,
              description: ks.description,
            });
          }
        }
      }

      if (existing) {
        // If it's act_bns_2023, preserve the authoritative complete 956 sections catalog
        if (existing.id === "act_bns_2023") {
          continue;
        }
        // If it's act_bnss_2023, preserve the authoritative complete 2,489 sections catalog
        if (existing.id === "act_bnss_2023") {
          continue;
        }
        // If it's act_arms_1959, preserve the authoritative complete 328 sections catalog
        if (existing.id === "act_arms_1959") {
          continue;
        }
        // If it's act_punjab_excise_1914, preserve the authoritative complete 498 sections catalog
        if (existing.id === "act_punjab_excise_1914") {
          continue;
        }
        // If it's act_haryana_police_2007, preserve the authoritative complete 320 sections catalog
        if (existing.id === "act_haryana_police_2007") {
          continue;
        }
        // If it's act_gauvansh_2015, preserve the authoritative complete 99 sections catalog
        if (existing.id === "act_gauvansh_2015") {
          continue;
        }
        // If it's act_ndps_1985, preserve the authoritative complete 595 sections catalog
        if (existing.id === "act_ndps_1985") {
          continue;
        }
        // If it's act_sc_st_1989, preserve the authoritative complete 196 sections catalog
        if (existing.id === "act_sc_st_1989") {
          continue;
        }
        // If it's act_dowry_1961, preserve the authoritative complete 66 sections catalog
        if (existing.id === "act_dowry_1961") {
          continue;
        }
        // If it's act_gambling_1867, preserve the authoritative complete 18 sections catalog
        if (existing.id === "act_gambling_1867") {
          continue;
        }
        // If it's act_explosives_1908, preserve the authoritative complete 19 sections catalog
        if (existing.id === "act_explosives_1908") {
          continue;
        }
        // Merge sections: append any new sections from userAct that aren't already in existing
        const existingSecNums = new Set(existing.sections.map((s) => s.sectionNumber.toLowerCase().trim()));
        for (const s of userSections) {
          if (!existingSecNums.has(s.sectionNumber.toLowerCase().trim())) {
            existing.sections.push(s);
            existingSecNums.add(s.sectionNumber.toLowerCase().trim());
          }
        }
      } else {
        // Brand new custom act uploaded in the acts-sections module
        map.set(key, {
          id: uAct.id,
          name: uAct.title || uAct.shortName,
          title: uAct.title || uAct.shortName,
          category: uAct.categoryLabel || uAct.category || "Custom / User Uploaded Acts",
          isCustom: Boolean(uAct.isCustomUpload),
          sections: userSections,
        });
      }
    }
  }

  // Deduplicate by act.id
  const seenIds = new Set<string>();
  const result: UnifiedActOption[] = [];
  for (const act of map.values()) {
    if (!seenIds.has(act.id)) {
      seenIds.add(act.id);
      result.push(act);
    }
  }
  return result;
}

