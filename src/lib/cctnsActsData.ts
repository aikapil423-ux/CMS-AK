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
import { ELECTRICITY_ACT_2003_SECTIONS } from "./electricitySectionsData";
import { DPPA_ACT_1984_SECTIONS } from "./dppaSectionsData";
import { PASSPORTS_ACT_1967_SECTIONS } from "./passportsSectionsData";
import { ESSENTIAL_COMMODITIES_1955_SECTIONS } from "./essentialCommoditiesSectionsData";
import { IT_ACT_2000_SECTIONS } from "./itActSectionsData";
import { POCSO_ACT_2012_SECTIONS } from "./pocsoSectionsData";
import { MOTOR_VEHICLES_ACT_1988_SECTIONS } from "./motorVehiclesSectionsData";
import { PC_ACT_1988_SECTIONS } from "./pcActSectionsData";
import { BENAMI_ACT_1988_SECTIONS } from "./benamiSectionsData";
import { IPC_1860_SECTIONS } from "./ipcSectionsData";
import { CRPC_1973_SECTIONS } from "./crpcSectionsData";
import { IEA_1872_SECTIONS } from "./ieaSectionsData";

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
    sections: IT_ACT_2000_SECTIONS,
  },
  {
    id: "act_pocso_2012",
    title: "The Protection of Children from Sexual Offences Act, 2012",
    shortName: "Protection of Children from Sexual Offences Act, 2012 (POCSO)",
    category: "Child Protection",
    sections: POCSO_ACT_2012_SECTIONS,
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
    sections: MOTOR_VEHICLES_ACT_1988_SECTIONS,
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
    sections: PC_ACT_1988_SECTIONS,
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
    sections: ELECTRICITY_ACT_2003_SECTIONS,
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
    sections: DPPA_ACT_1984_SECTIONS,
  },
  {
    id: "act_passports_1967",
    title: "The Passports Act, 1967",
    shortName: "Passports Act, 1967",
    category: "Special & Local Laws",
    sections: PASSPORTS_ACT_1967_SECTIONS,
  },
  {
    id: "act_essential_1955",
    title: "The Essential Commodities Act, 1955",
    shortName: "Essential Commodities Act, 1955",
    category: "Special & Local Laws",
    sections: ESSENTIAL_COMMODITIES_1955_SECTIONS,
  },
  {
    id: "act_benami_1988",
    title: "The Prohibition of Benami Property Transactions Act, 1988",
    shortName: "The Prohibition of Benami Property Transactions Act, 1988",
    category: "Economic & Property Law",
    sections: BENAMI_ACT_1988_SECTIONS,
  },
  {
    id: "act_ipc_1860",
    title: "The Indian Penal Code, 1860 (Pre-July 2024 / Legacy Matters)",
    shortName: "Indian Penal Code, 1860 (IPC)",
    category: "Legacy Penal Code",
    sections: IPC_1860_SECTIONS,
  },
  {
    id: "act_crpc_1973",
    title: "The Code of Criminal Procedure, 1973 (Pre-July 2024 / Legacy)",
    shortName: "Code of Criminal Procedure, 1973 (CrPC)",
    category: "Legacy Procedural Code",
    sections: CRPC_1973_SECTIONS,
  },
  {
    id: "act_iea_1872",
    title: "The Indian Evidence Act, 1872 (Legacy)",
    shortName: "Indian Evidence Act, 1872 (IEA)",
    category: "Legacy Evidence Law",
    sections: IEA_1872_SECTIONS,
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
    if (cAct.id === "act_electricity_2003") {
      map.set(normalizeKey("Electricity Act, 2003"), actOption);
      map.set(normalizeKey("Electricity Act,2003"), actOption);
      map.set(normalizeKey("The Electricity Act, 2003"), actOption);
      map.set(normalizeKey("The Electricity Act,2003"), actOption);
      map.set(normalizeKey("Electricity Act"), actOption);
    }
    if (cAct.id === "act_dppa_1984") {
      map.set(normalizeKey("Prevention of Damage to Public Property Act, 1984"), actOption);
      map.set(normalizeKey("Prevention of Damage to Public Property Act,1984"), actOption);
      map.set(normalizeKey("The Prevention of Damage to Public Property Act, 1984"), actOption);
      map.set(normalizeKey("The Prevention of Damage to Public Property Act,1984"), actOption);
      map.set(normalizeKey("Prevention of Damage to Public Property Act"), actOption);
      map.set(normalizeKey("PDPP Act"), actOption);
      map.set(normalizeKey("DPPA Act"), actOption);
    }
    if (cAct.id === "act_passports_1967") {
      map.set(normalizeKey("Passports Act, 1967"), actOption);
      map.set(normalizeKey("Passports Act,1967"), actOption);
      map.set(normalizeKey("The Passports Act, 1967"), actOption);
      map.set(normalizeKey("The Passports Act,1967"), actOption);
      map.set(normalizeKey("Passports Act"), actOption);
      map.set(normalizeKey("Passport Act"), actOption);
    }
    if (cAct.id === "act_essential_1955") {
      map.set(normalizeKey("Essential Commodities Act, 1955"), actOption);
      map.set(normalizeKey("Essential Commodities Act,1955"), actOption);
      map.set(normalizeKey("The Essential Commodities Act, 1955"), actOption);
      map.set(normalizeKey("The Essential Commodities Act,1955"), actOption);
      map.set(normalizeKey("Essential Commodities Act"), actOption);
      map.set(normalizeKey("EC Act"), actOption);
      map.set(normalizeKey("E.C. Act"), actOption);
    }
    if (cAct.id === "act_it_2000") {
      map.set(normalizeKey("Information Technology Act, 2000"), actOption);
      map.set(normalizeKey("Information Technology Act,2000"), actOption);
      map.set(normalizeKey("The Information Technology Act, 2000"), actOption);
      map.set(normalizeKey("The Information Technology Act,2000"), actOption);
      map.set(normalizeKey("Information Technology Act"), actOption);
      map.set(normalizeKey("IT Act, 2000"), actOption);
      map.set(normalizeKey("IT Act,2000"), actOption);
      map.set(normalizeKey("IT Act"), actOption);
      map.set(normalizeKey("I.T. Act"), actOption);
      map.set(normalizeKey("Information Technology Act, 2000 (IT Act)"), actOption);
    }
    if (cAct.id === "act_pocso_2012") {
      map.set(normalizeKey("Protection of Children from Sexual Offences Act, 2012"), actOption);
      map.set(normalizeKey("Protection of Children from Sexual Offences Act,2012"), actOption);
      map.set(normalizeKey("Protection of Children from Sexual Offences Act, 2012 (POCSO)"), actOption);
      map.set(normalizeKey("The Protection of Children from Sexual Offences Act, 2012"), actOption);
      map.set(normalizeKey("The Protection of Children from Sexual Offences Act,2012"), actOption);
      map.set(normalizeKey("POCSO Act, 2012"), actOption);
      map.set(normalizeKey("POCSO Act,2012"), actOption);
      map.set(normalizeKey("POCSO Act"), actOption);
      map.set(normalizeKey("POCSO"), actOption);
    }
    if (cAct.id === "act_mv_1988") {
      map.set(normalizeKey("Motor Vehicles Act, 1988"), actOption);
      map.set(normalizeKey("Motor Vehicles Act,1988"), actOption);
      map.set(normalizeKey("The Motor Vehicles Act, 1988"), actOption);
      map.set(normalizeKey("The Motor Vehicles Act,1988"), actOption);
      map.set(normalizeKey("Motor Vehicles Act"), actOption);
      map.set(normalizeKey("Motor Vehicles Act 1988"), actOption);
      map.set(normalizeKey("MV Act, 1988"), actOption);
      map.set(normalizeKey("MV Act,1988"), actOption);
      map.set(normalizeKey("MV Act 1988"), actOption);
      map.set(normalizeKey("MV Act"), actOption);
      map.set(normalizeKey("M.V. Act"), actOption);
      map.set(normalizeKey("M.V. Act, 1988"), actOption);
      map.set(normalizeKey("M.V. Act,1988"), actOption);
      map.set(normalizeKey("Motor Vehicle Act"), actOption);
      map.set(normalizeKey("Motor Vehicle Act, 1988"), actOption);
      map.set(normalizeKey("Motor Vehicle Act,1988"), actOption);
    }
    if (cAct.id === "act_pc_1988") {
      map.set(normalizeKey("Prevention of Corruption Act, 1988"), actOption);
      map.set(normalizeKey("Prevention of Corruption Act,1988"), actOption);
      map.set(normalizeKey("Prevention of Corruption Act 1988"), actOption);
      map.set(normalizeKey("Prevention of Corruption Act"), actOption);
      map.set(normalizeKey("The Prevention of Corruption Act, 1988"), actOption);
      map.set(normalizeKey("The Prevention of Corruption Act,1988"), actOption);
      map.set(normalizeKey("The Prevention of Corruption Act"), actOption);
      map.set(normalizeKey("PC Act, 1988"), actOption);
      map.set(normalizeKey("PC Act,1988"), actOption);
      map.set(normalizeKey("PC Act"), actOption);
      map.set(normalizeKey("P.C. Act"), actOption);
      map.set(normalizeKey("P.C. Act, 1988"), actOption);
      map.set(normalizeKey("Corruption Act"), actOption);
      map.set(normalizeKey("भ्रष्टाचार निवारण अधिनियम"), actOption);
    }

    if (cAct.id === "act_benami_1988") {
      map.set(normalizeKey("The The Prohibition of Benami Property Transactions Act, 1988"), actOption);
      map.set(normalizeKey("The Prohibition of Benami Property Transactions Act, 1988"), actOption);
      map.set(normalizeKey("The Prohibition of Benami Property Transactions Act"), actOption);
      map.set(normalizeKey("Prohibition of Benami Property Transactions Act, 1988"), actOption);
      map.set(normalizeKey("Prohibition of Benami Property Transactions Act"), actOption);
      map.set(normalizeKey("Benami Act, 1988"), actOption);
      map.set(normalizeKey("Benami Act,1988"), actOption);
      map.set(normalizeKey("Benami Act"), actOption);
      map.set(normalizeKey("The Benami Transactions (Prohibition) Act, 1988"), actOption);
      map.set(normalizeKey("The Benami Transactions Act, 1988"), actOption);
      map.set(normalizeKey("बेनामी संपत्ति लेन-देन प्रतिषेध अधिनियम"), actOption);
      map.set(normalizeKey("बेनामी संपत्ति लेनदेन प्रतिषेध अधिनियम, 1988"), actOption);
    }

    if (cAct.id === "act_ipc_1860") {
      map.set(normalizeKey("The Indian Penal Code, 1860 (Pre-July 2024 / Legacy Matters)"), actOption);
      map.set(normalizeKey("The Indian Penal Code, 1860"), actOption);
      map.set(normalizeKey("Indian Penal Code, 1860"), actOption);
      map.set(normalizeKey("Indian Penal Code Act, 1860"), actOption);
      map.set(normalizeKey("Indian Penal Code Act, 1860 57 sections"), actOption);
      map.set(normalizeKey("Indian Penal Code"), actOption);
      map.set(normalizeKey("The Indian Penal Code"), actOption);
      map.set(normalizeKey("IPC, 1860"), actOption);
      map.set(normalizeKey("IPC,1860"), actOption);
      map.set(normalizeKey("IPC 1860"), actOption);
      map.set(normalizeKey("IPC"), actOption);
      map.set(normalizeKey("I.P.C."), actOption);
      map.set(normalizeKey("I.P.C., 1860"), actOption);
      map.set(normalizeKey("भारतीय दंड संहिता, 1860"), actOption);
      map.set(normalizeKey("भारतीय दंड संहिता"), actOption);
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
        // If it's act_electricity_2003, preserve the authoritative complete 1,159 sections catalog
        if (existing.id === "act_electricity_2003") {
          continue;
        }
        // If it's act_dppa_1984, preserve the authoritative complete 27 sections catalog
        if (existing.id === "act_dppa_1984") {
          continue;
        }
        // If it's act_passports_1967, preserve the authoritative complete 144 sections catalog
        if (existing.id === "act_passports_1967") {
          continue;
        }
        // If it's act_essential_1955, preserve the authoritative complete 183 sections catalog
        if (existing.id === "act_essential_1955") {
          continue;
        }
        // If it's act_it_2000, preserve the authoritative complete 544 sections catalog
        if (existing.id === "act_it_2000") {
          continue;
        }
        // If it's act_pocso_2012, preserve the authoritative complete 236 sections catalog
        if (existing.id === "act_pocso_2012") {
          continue;
        }
        // If it's act_mv_1988, preserve the authoritative complete 1,932 sections catalog
        if (existing.id === "act_mv_1988") {
          continue;
        }
        // If it's act_pc_1988, preserve the authoritative complete 190 sections catalog
        if (existing.id === "act_pc_1988") {
          continue;
        }
        // If it's act_benami_1988, preserve the authoritative complete 413 sections catalog
        if (existing.id === "act_benami_1988") {
          continue;
        }
        // If it's act_ipc_1860, preserve the authoritative complete 997 sections catalog
        if (existing.id === "act_ipc_1860") {
          continue;
        }
        // If it's act_crpc_1973, preserve the authoritative complete 1552 sections catalog
        if (existing.id === "act_crpc_1973") {
          continue;
        }
        // If it's act_iea_1872, preserve the authoritative complete 359 sections catalog
        if (existing.id === "act_iea_1872") {
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

