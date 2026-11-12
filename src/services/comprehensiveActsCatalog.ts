import { BUILTIN_LEGAL_ACTS } from "./actsService";
import { CCTNS_ACTS_CATALOG } from "@/lib/cctnsActsData";
import { LegalActItem, LegalSectionItem } from "@/types";

interface PdfMeta {
  fileName: string;
  fileSize: string;
  actNumber: string;
  enactmentDate: string;
  effectiveDate: string;
  totalChapters?: number;
  description?: string;
  preambleVerbatim?: string;
}

const PDF_METADATA_MAP: Record<string, PdfMeta> = {
  act_crpc_1973: {
    fileName: "the_code_of_criminal_procedure,_1973.pdf",
    fileSize: "1.8 MB",
    actNumber: "Act No. 2 of 1974",
    enactmentDate: "25th January, 1974",
    effectiveDate: "1st April, 1974",
    totalChapters: 37,
    description: "An Act to consolidate and amend the law relating to Criminal Procedure (pre-July 2024 legacy code).",
  },
  act_dv_2005: {
    fileName: "Domestic violence act.pdf",
    fileSize: "261.0 KB",
    actNumber: "Act No. 43 of 2005",
    enactmentDate: "13th September, 2005",
    effectiveDate: "26th October, 2006",
    totalChapters: 5,
    description: "An Act to provide for more effective protection of the rights of women guaranteed under the Constitution who are victims of violence.",
  },
  act_dowry_1961: {
    fileName: "dowry prohibition act 1961.pdf",
    fileSize: "181.6 KB",
    actNumber: "Act No. 28 of 1961",
    enactmentDate: "20th May, 1961",
    effectiveDate: "1st July, 1961",
    totalChapters: 1,
    description: "An Act to prohibit the giving or taking of dowry and related offences.",
  },
  act_it_2000: {
    fileName: "IT ACT 2000.pdf",
    fileSize: "812.8 KB",
    actNumber: "Act No. 21 of 2000",
    enactmentDate: "9th June, 2000",
    effectiveDate: "17th October, 2000",
    totalChapters: 13,
    description: "An Act to provide legal recognition for transactions carried out by means of electronic data interchange and cyber offences.",
  },
  act_mv_1988: {
    fileName: "motor vehicle act 1988.pdf",
    fileSize: "1.2 MB",
    actNumber: "Act No. 59 of 1988",
    enactmentDate: "14th October, 1988",
    effectiveDate: "1st July, 1989",
    totalChapters: 14,
    description: "An Act to consolidate and amend the law relating to motor vehicles, road safety, and licensing.",
  },
  act_ndps_1985: {
    fileName: "ndps act 1985.pdf",
    fileSize: "702.7 KB",
    actNumber: "Act No. 61 of 1985",
    enactmentDate: "16th September, 1985",
    effectiveDate: "14th November, 1985",
    totalChapters: 6,
    description: "An Act to consolidate and amend the law relating to narcotic drugs, psychotropic substances and forfeiture of property.",
  },
  act_pmla_2002: {
    fileName: "prevention of money laundering act 2002.pdf",
    fileSize: "492.3 KB",
    actNumber: "Act No. 15 of 2003",
    enactmentDate: "17th January, 2003",
    effectiveDate: "1st July, 2005",
    totalChapters: 10,
    description: "An Act to prevent money-laundering and to provide for confiscation of property derived from, or involved in, money-laundering.",
  },
  act_sc_st_1989: {
    fileName: "sc & st act.pdf",
    fileSize: "475.2 KB",
    actNumber: "Act No. 33 of 1989",
    enactmentDate: "11th September, 1989",
    effectiveDate: "30th January, 1990",
    totalChapters: 5,
    description: "An Act to prevent the commission of offences of atrocities against the members of the Scheduled Castes and the Scheduled Tribes.",
  },
  act_disaster_management_2005: {
    fileName: "The Disaster Management Act, 2005.pdf",
    fileSize: "483.9 KB",
    actNumber: "Act No. 53 of 2005",
    enactmentDate: "23rd December, 2005",
    effectiveDate: "26th December, 2005",
    totalChapters: 11,
    description: "An Act to provide for the effective management of disasters and for matters connected therewith or incidental thereto.",
  },
  act_drugs_cosmetics_1940: {
    fileName: "THE DRUGS AND COSMETICS ACT, 1940.pdf",
    fileSize: "559.9 KB",
    actNumber: "Act No. 23 of 1940",
    enactmentDate: "10th April, 1940",
    effectiveDate: "1st April, 1947",
    totalChapters: 5,
    description: "An Act to regulate the import, manufacture, distribution and sale of drugs and cosmetics.",
  },
  act_epa_1986: {
    fileName: "THE ENVIRONMENT (PROTECTION) ACT, 1986.pdf",
    fileSize: "206.7 KB",
    actNumber: "Act No. 29 of 1986",
    enactmentDate: "23rd May, 1986",
    effectiveDate: "19th November, 1986",
    totalChapters: 4,
    description: "An Act to provide for the protection and improvement of environment and for matters connected therewith.",
  },
  act_explosives_1908: {
    fileName: "the explosive act, 1884.pdf",
    fileSize: "250.0 KB",
    actNumber: "Act No. 6 of 1908",
    enactmentDate: "8th June, 1908",
    effectiveDate: "8th June, 1908",
    totalChapters: 1,
    description: "An Act to further amend the law relating to explosive substances and penalties for malicious explosion.",
  },
  act_fssai_2006: {
    fileName: "THE FOOD SAFETY AND STANDARDS ACT, 2006.pdf",
    fileSize: "438.8 KB",
    actNumber: "Act No. 34 of 2006",
    enactmentDate: "23rd August, 2006",
    effectiveDate: "5th August, 2011",
    totalChapters: 12,
    description: "An Act to consolidate the laws relating to food and to establish the Food Safety and Standards Authority of India.",
  },
  act_itpa_1956: {
    fileName: "THE IMMORAL TRAFFIC (PREVENTION) ACT, 1956.pdf",
    fileSize: "299.5 KB",
    actNumber: "Act No. 104 of 1956",
    enactmentDate: "30th December, 1956",
    effectiveDate: "1st May, 1958",
    totalChapters: 1,
    description: "An Act to provide in pursuance of the International Convention signed at New York for the prevention of immoral traffic.",
  },
  act_jj_2015: {
    fileName: "THE JUVENILE JUSTICE (CARE AND PROTECTION OF CHILDREN) ACT, 2015.pdf",
    fileSize: "455.4 KB",
    actNumber: "Act No. 2 of 2016",
    enactmentDate: "31st December, 2015",
    effectiveDate: "15th January, 2016",
    totalChapters: 10,
    description: "An Act to consolidate and amend the law relating to children alleged and found to be in conflict with law and children in need of care and protection.",
  },
  act_nsa_1980: {
    fileName: "THE NATIONAL SECURITY ACT, 1980.pdf",
    fileSize: "81.4 KB",
    actNumber: "Act No. 65 of 1980",
    enactmentDate: "27th December, 1980",
    effectiveDate: "27th December, 1980",
    totalChapters: 1,
    description: "An Act to provide for preventive detention in certain cases and for matters connected therewith.",
  },
  act_official_secrets_1923: {
    fileName: "THE OFFICIAL SECRETS ACT, 1923.pdf",
    fileSize: "334.5 KB",
    actNumber: "Act No. 19 of 1923",
    enactmentDate: "2nd April, 1923",
    effectiveDate: "2nd April, 1923",
    totalChapters: 1,
    description: "An Act to consolidate and amend the law relating to official secrets, espionage, and wrongful communication.",
  },
  act_passports_1967: {
    fileName: "THE PASSPORTS ACT, 1967.pdf",
    fileSize: "249.0 KB",
    actNumber: "Act No. 15 of 1967",
    enactmentDate: "24th June, 1967",
    effectiveDate: "24th June, 1967",
    totalChapters: 1,
    description: "An Act to provide for the issue of passports and travel documents to regulate departure from India.",
  },
  act_pc_1988: {
    fileName: "The Prevention of Corruption Act, 1988.pdf",
    fileSize: "389.9 KB",
    actNumber: "Act No. 49 of 1988",
    enactmentDate: "9th September, 1988",
    effectiveDate: "9th September, 1988",
    totalChapters: 5,
    description: "An Act to consolidate and amend the law relating to the prevention of corruption and for matters connected therewith.",
  },
  act_pocso_2012: {
    fileName: "THE PROTECTION OF CHILDREN FROM SEXUAL OFFENCES ACT, 2012.pdf",
    fileSize: "202.9 KB",
    actNumber: "Act No. 32 of 2012",
    enactmentDate: "19th June, 2012",
    effectiveDate: "14th November, 2012",
    totalChapters: 9,
    description: "An Act to protect children from offences of sexual assault, sexual harassment and pornography.",
  },
  act_gambling_1867: {
    fileName: "THE PUBLIC GAMBLING ACT, 1867.pdf",
    fileSize: "189.9 KB",
    actNumber: "Act No. 3 of 1867",
    enactmentDate: "25th January, 1867",
    effectiveDate: "25th January, 1867",
    totalChapters: 1,
    description: "An Act to provide for the punishment of public gambling and the keeping of common gaming-houses.",
  },
  act_telecom_2023: {
    fileName: "THE TELECOMMUNICATIONS ACT, 2023.pdf",
    fileSize: "125.6 KB",
    actNumber: "Act No. 44 of 2023",
    enactmentDate: "24th December, 2023",
    effectiveDate: "26th June, 2024",
    totalChapters: 11,
    description: "An Act to amend and consolidate the law relating to development, expansion and operation of telecommunication services and telecommunication networks.",
  },
  act_uapa_1967: {
    fileName: "THE UNLAWFUL ACTIVITIES (PREVENTION) ACT, 1967.pdf",
    fileSize: "418.2 KB",
    actNumber: "Act No. 37 of 1967",
    enactmentDate: "30th December, 1967",
    effectiveDate: "30th December, 1967",
    totalChapters: 7,
    description: "An Act to provide for the more effective prevention of certain unlawful activities of individuals and associations.",
  },
};

function mapCategory(cat: string): LegalActItem["category"] {
  const c = (cat || "").toLowerCase();
  if (c.includes("substantive") || c.includes("criminal code") || c.includes("penal")) return "CRIMINAL_CODE";
  if (c.includes("procedur")) return "PROCEDURAL_CODE";
  if (c.includes("evidence")) return "EVIDENCE_CODE";
  if (c.includes("economic") || c.includes("property") || c.includes("corruption")) return "ECONOMIC_PROPERTY";
  if (c.includes("police")) return "POLICE_RULES";
  return "SPECIAL_ACT";
}

export function buildComprehensiveActsCatalog(): LegalActItem[] {
  const existingMap = new Map<string, LegalActItem>();
  BUILTIN_LEGAL_ACTS.forEach((act) => existingMap.set(act.id, act));

  CCTNS_ACTS_CATALOG.forEach((cctnsAct) => {
    const pdfMeta = PDF_METADATA_MAP[cctnsAct.id];

    if (existingMap.has(cctnsAct.id)) {
      const existing = existingMap.get(cctnsAct.id)!;
      if (pdfMeta && !existing.fileUrl) {
        existing.fileUrl = `/documents/acts/${encodeURIComponent(pdfMeta.fileName)}`;
        existing.fileName = pdfMeta.fileName;
        existing.fileSize = pdfMeta.fileSize;
      }
      return;
    }

    const sections: LegalSectionItem[] = (cctnsAct.sections || []).map((s: any) => ({
      sectionNumber: s.sectionNumber,
      title: s.title || `Section ${s.sectionNumber}`,
      description: s.description || s.title || `Section ${s.sectionNumber} of ${cctnsAct.title}`,
      punishment: s.punishment,
      cognizable: s.cognizable,
      bailable: s.bailable,
      triableBy: s.triableBy,
    }));

    const keySections = sections.slice(0, 150);

    const newAct: LegalActItem = {
      id: cctnsAct.id,
      title: cctnsAct.title,
      shortName: cctnsAct.shortName || cctnsAct.title,
      actNumber: pdfMeta?.actNumber || "Special Statutory Act",
      enactmentDate: pdfMeta?.enactmentDate || "In Force",
      effectiveDate: pdfMeta?.effectiveDate || "In Force",
      category: mapCategory(cctnsAct.category),
      categoryLabel: cctnsAct.category || "Special & Local Law",
      totalSections: sections.length || 1,
      totalChapters: pdfMeta?.totalChapters || 1,
      fileFormat: "PDF",
      fileName: pdfMeta ? pdfMeta.fileName : `${cctnsAct.title.replace(/\s+/g, "_")}.pdf`,
      fileSize: pdfMeta ? pdfMeta.fileSize : "Official Act",
      fileUrl: pdfMeta ? `/documents/acts/${encodeURIComponent(pdfMeta.fileName)}` : undefined,
      description: pdfMeta?.description || `Statutory provisions and regulatory procedures under ${cctnsAct.title}.`,
      preambleVerbatim: pdfMeta?.preambleVerbatim,
      keySections: keySections.length > 0 ? keySections : [
        {
          sectionNumber: "1",
          title: "Short title and application",
          description: `Application and jurisdiction of ${cctnsAct.title}.`,
        },
      ],
    };

    existingMap.set(cctnsAct.id, newAct);
  });

  return Array.from(existingMap.values());
}
