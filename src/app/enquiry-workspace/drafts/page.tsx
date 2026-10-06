"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FileCheck2,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Mic,
  Shield,
  FileText,
  UserCheck,
  Download,
  Edit3,
  Landmark,
  Home,
  HeartHandshake,
  Laptop,
  HelpCircle,
  BadgeAlert,
  ArrowLeft,
  Save,
  CheckCircle2,
  Building,
  User,
  Phone,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem } from "@/types";

export type PoliceReportCategory =
  | "financial_fraud"
  | "land_dispute"
  | "assault_ncr"
  | "matrimonial_dispute"
  | "cyber_crime"
  | "lost_property_ncr";

interface PoliceReportFormData {
  // Station & Dispatch
  dispatchNo: string;
  complaintRefNo: string;
  gdEntryNo: string;
  policeStation: string;
  district: string;
  reportDate: string;
  reportTime: string;

  // Complainant / Informant
  complainantName: string;
  complainantFather: string;
  complainantAge: string;
  complainantAddress: string;
  complainantPhone: string;

  // Accused / Opposite Party
  accusedName: string;
  accusedFather: string;
  accusedAddress: string;
  accusedPhone: string;

  // Incident & Category Specific
  incidentDate: string;
  incidentPlace: string;
  sectionsOfLaw: string;
  disputeSubject: string;
  amountOrPropertyDetails: string;
  complaintSubstance: string;

  // Enquiry & Investigation Process
  witnessesExamined: string;
  documentsVerified: string;
  enquiryFindings: string;

  // Final Conclusion & Recommendation
  finalConclusion: string;
  shoRecommendation: string;

  // Officer details
  officerName: string;
  officerRank: string;
  officerPno: string;
  officerPhone: string;
}

const CATEGORY_SAMPLE_DATA: Record<PoliceReportCategory, PoliceReportFormData> = {
  // 1. FINANCIAL FRAUD / CHEATING
  financial_fraud: {
    dispatchNo: "HP/KKR/CT/2026/ENQ-FIN-0198",
    complaintRefNo: "HAR-KKR-2026-CMP-00482",
    gdEntryNo: "GD Entry No. 021 dated 04-10-2026 (12:45 hrs)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: "12:45 PM",

    complainantName: "Rajesh Kumar",
    complainantFather: "Sh. Ram Bilas",
    complainantAge: "38 Years, Trader",
    complainantAddress: "House No. 124, Sector 7, Urban Estate, Thanesar, Kurukshetra",
    complainantPhone: "9812033441",

    accusedName: "Vikas Sharma (Director, Horizon Infra)",
    accusedFather: "Sh. Ramesh Chand Sharma",
    accusedAddress: "House No. 412, Sector 7, Urban Estate, Thanesar, Kurukshetra",
    accusedPhone: "9812044551",

    incidentDate: "18-09-2026 to 28-09-2026",
    incidentPlace: "Main Grain Market & Online Bank Transfer via HDFC Bank, Thanesar",
    sectionsOfLaw: "Section 318(4) (Cheating) & 316(2) (Criminal Breach of Trust) BNS, 2023",
    disputeSubject: "Cheating and Criminal Dishonesty in Supply of Building Construction Material",
    amountOrPropertyDetails: "₹4,50,000/- (Rupees Four Lakh Fifty Thousand Only) via RTGS",
    complaintSubstance:
      "Complainant paid an advance token amount of ₹4,50,000/- via RTGS into the bank account of the opposite party for supply of structural TMT steel. Accused failed to supply the agreed consignment, dishonestly misappropriated the fund, issued a dishonored cheque, and extended criminal intimidation when refund was sought.",

    witnessesExamined:
      "1. Complainant Rajesh Kumar s/o Sh. Ram Bilas\n2. Eye-witness Sh. Sunil Grover (Broker, Grain Market)\n3. Account Clerk Sh. Harish Verma",

    documentsVerified:
      "1. HDFC Bank Account statement of complainant confirming RTGS transfer of ₹4,50,000/-\n2. Written commercial contract dated 15-09-2026\n3. GST Invoice No. HI-984 dated 18-09-2026\n4. Cheque return memo dated 01-10-2026 with remark 'Funds Insufficient'",

    enquiryFindings:
      "Preliminary enquiry u/s 173(3) BNSS was conducted. Bank statements and commercial receipts verify that ₹4,50,000/- was debited from complainant's account and credited to accused's firm Horizon Infra. The opposite party failed to deliver the goods and had no inventory available at the stated godown. Dishonest intention from the inception is prima facie revealed.",

    finalConclusion:
      "Prima facie cognizable offences under Section 318(4) (Cheating) and Section 316(2) (Criminal Breach of Trust) of Bharatiya Nyaya Sanhita, 2023 are substantiated against the named suspect Vikas Sharma.",

    shoRecommendation:
      "Recommended to register regular First Information Report (FIR) under Sections 318(4), 316(2) BNS, 2023 and hand over investigation to Sub-Inspector Financial Crime Desk.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  // 2. LAND / PROPERTY DISPUTE (CIVIL)
  land_dispute: {
    dispatchNo: "HP/KKR/CT/2026/ENQ-LND-0245",
    complaintRefNo: "HAR-KKR-2026-CMP-00388",
    gdEntryNo: "GD Entry No. 034 dated 04-10-2026 (16:15 hrs)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: "04:15 PM",

    complainantName: "Kuldeep Singh",
    complainantFather: "Sh. Gurmel Singh",
    complainantAge: "48 Years, Agriculturist",
    complainantAddress: "Village Kirmach, Sub-Tehsil Thanesar, District Kurukshetra",
    complainantPhone: "9813088772",

    accusedName: "Baldev Singh (Real Brother of Complainant)",
    accusedFather: "Sh. Gurmel Singh",
    accusedAddress: "Village Kirmach, Sub-Tehsil Thanesar, District Kurukshetra",
    accusedPhone: "9813055443",

    incidentDate: "Ongoing boundary demarcation dispute since August 2026",
    incidentPlace: "Agricultural land comprised in Khewat No. 84, Khatoni No. 112, Village Kirmach",
    sectionsOfLaw: "Purely Civil Nature / Land Title & Partition Dispute (Section 173(3) BNSS Verification)",
    disputeSubject: "Dispute regarding agricultural passage (dol) and partition of ancestral land",
    amountOrPropertyDetails: "Joint ancestral agricultural land measuring 14 Kanals 12 Marlas",
    complaintSubstance:
      "Complainant alleged that the opposite party has unauthorizedly ploughed the common dol/rasta between their fields and attempted to restrict access of his tractor, apprehending breach of peace.",

    witnessesExamined:
      "1. Complainant Kuldeep Singh\n2. Opposite party Baldev Singh\n3. Sh. Naresh Kumar, Halqa Patwari, Village Kirmach\n4. Numberdar Sh. Joginder Singh",

    documentsVerified:
      "1. Jamabandi for the year 2023-24 showing land is joint and unpartitioned (Mustarka Malkan)\n2. Aks Shajra and field book of Khewat No. 84\n3. Copy of Partition Application No. 42/SDO pending before Assistant Collector 1st Grade Thanesar",

    enquiryFindings:
      "Spot inspection was conducted in the presence of Halqa Patwari and village respectables. The land is legally joint ancestral property. Neither party has obtained a final partition decree or court stay order. No physical violence or armed confrontation occurred. The controversy is exclusively related to boundaries of unpartitioned agricultural property.",

    finalConclusion:
      "The dispute between real brothers is purely of a CIVIL NATURE relating to immovable agricultural property partition, which is already sub-judice before the competent Revenue Court. No cognizable penal offence has been committed.",

    shoRecommendation:
      "Both parties have been bound down with warnings to maintain law and order and abide by the decision of the Revenue Court. Complaint is recommended for final disposal as 'DISPOSED - CIVIL NATURE' under Chapter XXII of Punjab Police Rules.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  // 3. PHYSICAL ASSAULT & NCR
  assault_ncr: {
    dispatchNo: "HP/KKR/CT/2026/NCR-0142/174",
    complaintRefNo: "HAR-KKR-2026-CMP-00491",
    gdEntryNo: "GD Entry No. 018 dated 04-10-2026 (14:30 hrs)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: "02:30 PM",

    complainantName: "Satish Kumar",
    complainantFather: "Sh. Om Prakash",
    complainantAge: "38 Years, Private Employee",
    complainantAddress: "H.No. 129, Gali No. 3, Mohan Nagar, Thanesar, Kurukshetra",
    complainantPhone: "9812033441",

    accusedName: "Rakesh alias Billu",
    accusedFather: "Sh. Jai Bhagwan",
    accusedAddress: "Gali No. 3, Mohan Nagar, Thanesar, Kurukshetra",
    accusedPhone: "9896022114",

    incidentDate: "03-10-2026 at about 07:15 PM",
    incidentPlace: "Outside House No. 129, Mohan Nagar, Thanesar",
    sectionsOfLaw: "Section 115(2) (Simple Hurt), 351(2) (Criminal Intimidation), 352 (Insult) BNS, 2023",
    disputeSubject: "Neighborhood Scuffle over Scooter Parking & Verbal Altercation (NCR)",
    amountOrPropertyDetails: "Simple hurt without deadly weapons (Non-Cognizable Offence)",
    complaintSubstance:
      "Informant stated that on 03-10-2026 in the evening, over parking of a two-wheeler in the narrow street, the accused hurled abuses, grabbed his collar, and gave a push causing simple pain on his shoulder, and threatened him with dire consequences if parked again.",

    witnessesExamined:
      "1. Statement of Informant Satish Kumar\n2. Statement of eyewitness Smt. Bimla Devi\n3. Examination of Non-applicant Rakesh Kumar",

    documentsVerified:
      "1. Medico-Legal Examination Report (MLR No. 142/26) from LNJP Civil Hospital Kurukshetra diagnosing simple blunt tenderness on left shoulder, no bone fracture or laceration\n2. Spot Inspection Memo",

    enquiryFindings:
      "Preliminary investigation shows it is a sudden altercation between neighbors without any premeditation or deadly weapon. The injury sustained is simple in nature. The allegations constitute non-cognizable offences punishable with imprisonment less than 3 years.",

    finalConclusion:
      "The facts disclose commission of NON-COGNIZABLE OFFENCES punishable under Section 115(2), 351(2), 352 BNS, 2023. Under Section 174(1) of Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, police cannot investigate without judicial order.",

    shoRecommendation:
      "Entered in Station General Diary as NCR No. 142/2026. A copy of this NCR report is delivered to the informant free of cost. Informant is advised to approach the Court of Learned Chief Judicial Magistrate under Section 174(2) BNSS, 2023 for seeking orders if he desires investigation.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  // 4. MATRIMONIAL / DOMESTIC DISPUTE
  matrimonial_dispute: {
    dispatchNo: "HP/KKR/CT/2026/ENQ-MAT-0112",
    complaintRefNo: "HAR-KKR-2026-CMP-00455",
    gdEntryNo: "GD Entry No. 029 dated 04-10-2026 (15:00 hrs)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: "03:00 PM",

    complainantName: "Smt. Neetu Rani",
    complainantFather: "d/o Sh. Rameshwar Dass (Wife)",
    complainantAge: "28 Years, Homemaker",
    complainantAddress: "H.No. 89, Patel Nagar, Thanesar, Kurukshetra",
    complainantPhone: "9812555444",

    accusedName: "Sandeep Kumar (Husband) & In-laws",
    accusedFather: "s/o Sh. Som Nath",
    accusedAddress: "H.No. 234, Ward 4, Shahabad Markanda, District Kurukshetra",
    accusedPhone: "9896333221",

    incidentDate: "Matrimonial friction ongoing since January 2026 (Married on 12-11-2023)",
    incidentPlace: "Matrimonial home at Shahabad Markanda",
    sectionsOfLaw: "Section 85, 351(2) BNS, 2023 / Women Cell Counseling & Mediation",
    disputeSubject: "Matrimonial Discord, Adjustment Issues & Allegations of Harassment",
    amountOrPropertyDetails: "Stridhan articles, gold jewelry, and domestic goods listed in inventory",
    complaintSubstance:
      "Complainant lodged application alleging mental harassment, taunts regarding insufficient dowry, non-cooperation by husband, and being sent back to parental home in July 2026.",

    witnessesExamined:
      "1. Complainant Smt. Neetu Rani & her father Sh. Rameshwar Dass\n2. Husband Sandeep Kumar & his mother Smt. Kamla Devi\n3. Lady Sub-Inspector / Counselor Women Cell",

    documentsVerified:
      "1. Marriage Certificate dated 12-11-2023\n2. Agreed inventory of Stridhan items\n3. Proceedings sheet of Women Cell counseling sessions held on 22-09-2026 and 02-10-2026",

    enquiryFindings:
      "Both husband and wife along with parents appeared before the Women Cell. Through constructive mediation and counseling, both sides discussed grievances. Husband admitted misunderstandings and tendered written apology with assurance of respectful treatment. Stridhan articles were verified intact. Both parties resolved to resume cohabitation amicably in a separate rented accommodation at Thanesar.",

    finalConclusion:
      "The matrimonial controversy has been successfully resolved through mutual consensus, counseling, and execution of a joint Compromise Deed signed in presence of respectable panch witnesses. The complainant has submitted an application withdrawing her complaint.",

    shoRecommendation:
      "In view of voluntary mutual compromise and preservation of matrimonial harmony, it is recommended that this complaint be closed as 'DISPOSED - MUTUAL ACCORD' without criminal prosecution.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  // 5. CYBER CRIME / ONLINE PHISHING
  cyber_crime: {
    dispatchNo: "HP/KKR/CT/2026/CYB-REP-0078",
    complaintRefNo: "HAR-KKR-2026-CMP-00467",
    gdEntryNo: "GD Entry No. 014 dated 04-10-2026 (11:00 hrs)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: "11:00 AM",

    complainantName: "Deepak Singhal",
    complainantFather: "Sh. Jagdish Singhal",
    complainantAge: "35 Years, Shopkeeper",
    complainantAddress: "Shop No. 12, Main Bazaar, Pipli, Kurukshetra",
    complainantPhone: "9416011223",

    accusedName: "Unknown Cyber Fraudster (Cyber Criminal)",
    accusedFather: "Impersonator of 'Electricity Department Bill Update'",
    accusedAddress: "Mobile No. 7004918273, beneficiary bank account located in Jamtara, Jharkhand",
    accusedPhone: "7004918273",

    incidentDate: "01-10-2026 at about 03:45 PM",
    incidentPlace: "Online Phishing via SMS & AnyDesk APK link",
    sectionsOfLaw: "Section 318(4) BNS, 2023 r/w Section 66C, 66D Information Technology (IT) Act, 2000",
    disputeSubject: "Cyber Financial Fraud through Fake Electricity Disconnection SMS & APK Screen Share",
    amountOrPropertyDetails: "₹95,000/- siphoned via 3 UPI transactions from PNB A/c 0928000192831",
    complaintSubstance:
      "Complainant received an SMS stating 'Dear Customer, your electricity will be disconnected tonight at 9:30 PM due to unpaid bill, contact officer 7004918273'. Upon calling, fraudster instructed him to pay ₹10 recharge via a remote access app, through which OTP was intercepted and ₹95,000 was debited.",

    witnessesExamined:
      "1. Complainant Deepak Singhal\n2. Nodal Officer Cyber Crime Portal (1930 / I4C)",

    documentsVerified:
      "1. NCRP Cyber Crime Portal Acknowledgment No. 2041026008912\n2. Bank account transaction statement showing debit of ₹95,000/- to beneficiary account in Canara Bank\n3. Screenshot of malicious SMS and WhatsApp chat\n4. Reversal freeze notice sent to beneficiary bank under Section 106 BNSS",

    enquiryFindings:
      "Technical enquiry with 1930 Cyber Cell confirms the money reached Canara Bank Account No. 20981928310 in Jamtara. Immediate freeze request was accepted and ₹72,000/- of the defrauded money has been put on temporary lien. IP logs disclose fraudulent activity originating from a fake SIM.",

    finalConclusion:
      "Cognizable cyber offenses of identity theft, personation using computer resource, and financial cheating under Section 318(4) BNS and Section 66D IT Act are prima facie established.",

    shoRecommendation:
      "Recommended to register regular FIR at Cyber Crime Police Station / City Thanesar and requisition court orders under Section 503 BNSS for release of frozen amount ₹72,000/- back to victim's bank account.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  // 6. LOST ARTICLE / DOCUMENT NCR
  lost_property_ncr: {
    dispatchNo: "HP/KKR/CT/2026/LST-0098/174",
    complaintRefNo: "HAR-KKR-2026-CMP-00431",
    gdEntryNo: "GD Entry No. 024 dated 04-10-2026 (11:15 hrs)",
    policeStation: "Police Station City Thanesar",
    district: "Kurukshetra, Haryana",
    reportDate: new Date().toISOString().split("T")[0],
    reportTime: "11:15 AM",

    complainantName: "Pooja Verma",
    complainantFather: "w/o Sh. Amit Verma",
    complainantAge: "29 Years, School Teacher",
    complainantAddress: "Flat No. 302, Ashoka Apartments, Sector 13, Urban Estate, Kurukshetra",
    complainantPhone: "9416099881",

    accusedName: "Unknown / Untraced",
    accusedFather: "N/A",
    accusedAddress: "N/A (Loss of Property - No crime suspected)",
    accusedPhone: "N/A",

    incidentDate: "02-10-2026 between 01:00 PM and 03:00 PM",
    incidentPlace: "En route from Sector 13 Market to Railway Road, Thanesar",
    sectionsOfLaw: "Section 174 BNSS, 2023 (Lost Article / Document Report)",
    disputeSubject: "Inadvertent Loss of Leather Wallet containing Original Identity Documents & Debit Cards",
    amountOrPropertyDetails: "Original Driving License (HR-0720190038412), PAN Card, Voter ID & 2 ATM Cards",
    complaintSubstance:
      "Informant reported the bona fide loss of her handbag wallet during transit while travelling in an e-rickshaw from Sector 13 to Railway Road. She confirmed that no snatching or robbery occurred, and the loss was purely accidental.",

    witnessesExamined:
      "1. Informant Pooja Verma\n2. E-rickshaw stand driver association representative",

    documentsVerified:
      "1. Affidavit of loss executed before Executive Magistrate Kurukshetra\n2. Photocopy of lost Driving License and PAN card\n3. Bank confirmation regarding blocking of debit cards",

    enquiryFindings:
      "Preliminary inquiry and market surveillance verify that no extortion, theft or physical snatching took place. The loss is genuine and accidental. No foul play or crime is suspected.",

    finalConclusion:
      "The matter relates exclusively to accidental loss of personal documents/articles. No cognizable offense is disclosed.",

    shoRecommendation:
      "Recorded in Station General Diary as Lost Property NCR u/s 174 BNSS. Copy issued free of cost to informant for submission to Licensing Authority / RTA and Income Tax authorities for issuance of duplicate cards.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },
};

const CATEGORY_LABELS: Record<PoliceReportCategory, { label: string; icon: any; color: string }> = {
  land_dispute: { label: "1. Land & Civil Dispute", icon: Home, color: "text-blue-500" },
  financial_fraud: { label: "2. Financial Fraud", icon: Landmark, color: "text-amber-500" },
  assault_ncr: { label: "3. Assault & NCR", icon: BadgeAlert, color: "text-red-500" },
  matrimonial_dispute: { label: "4. Matrimonial Dispute", icon: HeartHandshake, color: "text-pink-500" },
  cyber_crime: { label: "5. Cyber Crime", icon: Laptop, color: "text-cyan-500" },
  lost_property_ncr: { label: "6. Lost Property / NCR", icon: HelpCircle, color: "text-emerald-500" },
};

function DraftsAndNCRContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");
  const categoryParam = searchParams.get("category") as PoliceReportCategory | null;

  const [complaint, setComplaint] = useState<ComplaintItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<PoliceReportCategory>(
    categoryParam && CATEGORY_SAMPLE_DATA[categoryParam]
      ? categoryParam
      : "land_dispute"
  );
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [formData, setFormData] = useState<PoliceReportFormData>(
    CATEGORY_SAMPLE_DATA[
      categoryParam && CATEGORY_SAMPLE_DATA[categoryParam]
        ? categoryParam
        : "land_dispute"
    ]
  );
  const [copied, setCopied] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Load complaint if complaintId is present in query parameters
  useEffect(() => {
    if (!complaintIdParam) return;
    async function loadComplaint() {
      try {
        const found = await ComplaintService.getComplaintById(complaintIdParam!);
        if (found) {
          setComplaint(found);

          // Decide category if not explicitly in URL
          let detectedCategory: PoliceReportCategory = activeCategory;
          if (categoryParam && CATEGORY_SAMPLE_DATA[categoryParam]) {
            detectedCategory = categoryParam;
          } else {
            const cat = found.category?.toLowerCase() || "";
            if (cat.includes("land") || cat.includes("property") || cat.includes("civil")) {
              detectedCategory = "land_dispute";
            } else if (cat.includes("fraud") || cat.includes("financial") || cat.includes("cheat")) {
              detectedCategory = "financial_fraud";
            } else if (cat.includes("assault") || cat.includes("hurt") || cat.includes("bns_115")) {
              detectedCategory = "assault_ncr";
            } else if (cat.includes("matrimonial") || cat.includes("women") || cat.includes("family")) {
              detectedCategory = "matrimonial_dispute";
            } else if (cat.includes("cyber") || cat.includes("online") || cat.includes("it_act")) {
              detectedCategory = "cyber_crime";
            } else if (cat.includes("lost") || cat.includes("missing")) {
              detectedCategory = "lost_property_ncr";
            }
          }
          setActiveCategory(detectedCategory);

          const sample = CATEGORY_SAMPLE_DATA[detectedCategory];
          const primaryAccused = found.accusedList?.[0] || {};

          setFormData({
            dispatchNo: `HP/KKR/CT/${new Date().getFullYear()}/ENQ-${detectedCategory.substring(0, 3).toUpperCase()}-${found.complaintNumber.split("-").pop() || "01"}`,
            complaintRefNo: found.complaintNumber,
            gdEntryNo: (found as any).gdCertified
              ? `GD Roznamcha Certified (PPR 22.48)`
              : `GD Entry No. 018 dated ${new Date().toISOString().split("T")[0]}`,
            policeStation: found.policeStation || currentUser.stationName || "Police Station City Thanesar",
            district: "Kurukshetra, Haryana",
            reportDate: new Date().toISOString().split("T")[0],
            reportTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),

            complainantName: found.complainantName || "",
            complainantFather: found.complainantFatherSpouse || (found as any).complainantFather || sample.complainantFather,
            complainantAge: found.complainantAge ? `${found.complainantAge} Years` : sample.complainantAge,
            complainantAddress: found.complainantAddress || sample.complainantAddress,
            complainantPhone: found.complainantMobile || found.complainantAltPhone || sample.complainantPhone,

            accusedName: primaryAccused.name || (found as any).accusedName || sample.accusedName,
            accusedFather: primaryAccused.fatherName || (found as any).accusedFather || sample.accusedFather,
            accusedAddress: primaryAccused.address || (found as any).accusedAddress || sample.accusedAddress,
            accusedPhone: primaryAccused.phone || (found as any).accusedPhone || sample.accusedPhone,

            incidentDate: found.incidentDate || sample.incidentDate,
            incidentPlace: found.incidentPlace || sample.incidentPlace,
            sectionsOfLaw: sample.sectionsOfLaw,
            disputeSubject: found.subject || found.categoryDisplay || sample.disputeSubject,
            amountOrPropertyDetails: sample.amountOrPropertyDetails,
            complaintSubstance: found.complaintDescription || (found as any).description || sample.complaintSubstance,

            witnessesExamined: sample.witnessesExamined,
            documentsVerified: sample.documentsVerified,
            enquiryFindings: sample.enquiryFindings,
            finalConclusion: sample.finalConclusion,
            shoRecommendation: sample.shoRecommendation,

            officerName: found.assignedEoName || currentUser.name || sample.officerName,
            officerRank: found.assignedEoRank || currentUser.rankDisplay || sample.officerRank,
            officerPno: found.assignedEoPno || currentUser.pno || sample.officerPno,
            officerPhone: (currentUser as any).phone || sample.officerPhone,
          });
        }
      } catch (err) {
        console.error("Error loading complaint for draft:", err);
      }
    }
    loadComplaint();
  }, [complaintIdParam, categoryParam]);

  const handleCategorySwitch = (cat: PoliceReportCategory) => {
    setActiveCategory(cat);
    const sample = CATEGORY_SAMPLE_DATA[cat];
    if (complaint) {
      setFormData((prev) => ({
        ...prev,
        sectionsOfLaw: sample.sectionsOfLaw,
        disputeSubject: complaint.subject || sample.disputeSubject,
        amountOrPropertyDetails: sample.amountOrPropertyDetails,
        witnessesExamined: sample.witnessesExamined,
        documentsVerified: sample.documentsVerified,
        enquiryFindings: sample.enquiryFindings,
        finalConclusion: sample.finalConclusion,
        shoRecommendation: sample.shoRecommendation,
        dispatchNo: `HP/KKR/CT/${new Date().getFullYear()}/ENQ-${cat.substring(0, 3).toUpperCase()}-${complaint.complaintNumber.split("-").pop() || "01"}`,
      }));
    } else {
      setFormData({
        ...sample,
        officerName: currentUser.name || sample.officerName,
        policeStation: currentUser.stationName || sample.policeStation,
        district: currentUser.district ? `${currentUser.district}, Haryana` : sample.district,
      });
    }
  };

  const handleFieldChange = (field: keyof PoliceReportFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetSample = () => {
    setFormData(CATEGORY_SAMPLE_DATA[activeCategory]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    if (!documentRef.current) return;
    const text = documentRef.current.innerText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    if (!documentRef.current) return;
    const text = documentRef.current.innerText;
    const filename = `${(formData.dispatchNo || "ENQUIRY_REPORT").replace(/[\/\\?%*:|"<>]/g, "_")}.txt`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveToComplaint = async () => {
    if (!complaint?.id) return;
    setSaveLoading(true);
    try {
      const label = CATEGORY_LABELS[activeCategory]?.label || "Enquiry Report";
      const reportTitle = `${label} - ${formData.complaintRefNo || complaint.complaintNumber}`;
      const docText = documentRef.current?.innerText || "";

      await ComplaintService.addComplaintReport(complaint.id, {
        title: reportTitle,
        reportType: activeCategory,
        reportTypeLabel: label,
        dispatchNo: formData.dispatchNo,
        generatedDate: formData.reportDate || new Date().toISOString().split("T")[0],
        officerName: formData.officerName || currentUser.name || "Enquiry Officer",
        officerRank: formData.officerRank || currentUser.rankDisplay || "Sub-Inspector",
        officerPno: formData.officerPno || currentUser.pno || "PNO-23841",
        conclusionSummary: formData.finalConclusion || formData.shoRecommendation,
        content: docText,
        fileFormat: "txt",
        isUploaded: false,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save report to complaint:", err);
      alert("Failed to save report to complaint. Please try again.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-16">
      {/* Top Header - No-print */}
      <div className="no-print space-y-4">
        {/* Navigation & Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Official Legal Report &amp; NCR Editor (Page 2 Direct Editing)
              </span>
              {complaint && (
                <span className="text-[11px] font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {complaint.complaintNumber}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0b192c] tracking-tight mt-1 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-amber-600" />
              <span>Police Enquiry Report &amp; NCR Drafts</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct in-place legal document editor: Edit all sections directly inside Page 2. Page 1 form has been removed for a clean, unified document workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {complaint ? (
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Complaint Profile</span>
                </Button>
              </Link>
            ) : (
              <Link href="/enquiry-workspace">
                <Button variant="outline" size="sm" className="text-xs gap-1.5 border-slate-300">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Enquiry Dashboard</span>
                </Button>
              </Link>
            )}

            {complaint && (
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Report Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save Report to Complaint"}</span>
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleDownloadReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-700" />
              <span>Download (.txt)</span>
            </Button>

            <Button
              onClick={handleCopyReport}
              variant="outline"
              size="sm"
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 border-slate-300 shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </Button>

            <Button
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="bg-[#0b192c] hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </Button>
          </div>
        </div>

        {/* Success Banner if Saved */}
        {saveSuccess && complaint && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-bold">
                Report successfully saved into Complaint {complaint.complaintNumber} under the &ldquo;Reports&rdquo; docket!
              </span>
            </div>
            <Link
              href={`/complaints/${complaint.id}`}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Open Reports Sub-Tab &rarr;
            </Link>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Select Legal Report Format:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Dictation:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoiceLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hindi
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
              <button
                type="button"
                onClick={handleResetSample}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1"
                title="Reset this format to standard sample"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset Sample</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {(Object.keys(CATEGORY_LABELS) as PoliceReportCategory[]).map((catKey) => {
              const cfg = CATEGORY_LABELS[catKey];
              const Icon = cfg.icon;
              const isActive = activeCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => handleCategorySwitch(catKey)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border text-left ${
                    isActive
                      ? "bg-[#0b192c] text-white border-[#0b192c] shadow-xs"
                      : "bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-amber-400" : cfg.color}`} />
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: FULL-WIDTH OFFICIAL FORMATTED REPORT WITH IN-PLACE EDITING ================= */}
      <div className="w-full max-w-5xl mx-auto space-y-4">
        {/* Document Container */}
        <div
          ref={documentRef}
          className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-12 shadow-md text-slate-900 font-sans transition-all space-y-6"
          style={{ minHeight: "1050px", lineHeight: "1.7" }}
        >
          {/* 1. Header Seal */}
          <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-8 h-8 text-[#0b192c]" />
              <span className="text-base font-black tracking-widest uppercase text-[#0b192c]">
                HARYANA POLICE
              </span>
            </div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-700">
              GOVERNMENT OF HARYANA
            </h3>
            <div className="flex items-center justify-center gap-2 pt-1">
              <input
                type="text"
                value={formData.policeStation}
                onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                className="text-base font-black uppercase text-slate-950 text-center bg-slate-50/80 hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5"
                placeholder="Police Station Name"
              />
              <span className="font-bold text-slate-950">, DISTRICT</span>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleFieldChange("district", e.target.value)}
                className="text-base font-black uppercase text-slate-950 bg-slate-50/80 hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-0.5"
                placeholder="District Name"
              />
            </div>
          </div>

          {/* 2. Title Header */}
          <div className="my-4 text-center space-y-1">
            {activeCategory === "financial_fraud" && (
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  PRELIMINARY ENQUIRY REPORT - FINANCIAL CHEATING &amp; FRAUD
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-bold">
                  INQUIRY UNDER SECTION 173(3) BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
                </p>
                <p className="text-[11px] text-slate-500">
                  (Subject: Investigation of Cheating &amp; Criminal Breach of Trust u/s 318(4), 316(2) BNS, 2023)
                </p>
              </div>
            )}

            {activeCategory === "land_dispute" && (
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  ENQUIRY REPORT - LAND / PASSAGE BOUNDARY DISPUTE (CIVIL NATURE)
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-bold">
                  FIELD VERIFICATION UNDER SECTION 173(3) BNSS, 2023 / CHAPTER XXII PPR
                </p>
                <p className="text-[11px] text-slate-500">
                  (Report on Immovable Property Boundary / Agricultural Dol Partition Dispute)
                </p>
              </div>
            )}

            {activeCategory === "assault_ncr" && (
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  FIRST INFORMATION OF A NON-COGNIZABLE CRIME (NCR)
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-bold">
                  RECORDED UNDER SECTION 174 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
                </p>
                <p className="text-[11px] text-slate-500">
                  (Corresponding to Section 155 CrPC - Simple Hurt / Altercation / Insult)
                </p>
              </div>
            )}

            {activeCategory === "matrimonial_dispute" && (
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  MATRIMONIAL &amp; DOMESTIC DISPUTE ENQUIRY / COUNSELING REPORT
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-bold">
                  WOMEN CELL MEDIATION &amp; COMPROMISE PROCEEDINGS
                </p>
              </div>
            )}

            {activeCategory === "cyber_crime" && (
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  CYBER CRIME &amp; FINANCIAL PHISHING PRELIMINARY REPORT
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-bold">
                  INQUIRY UNDER SECTION 173(3) BNSS &amp; SECTION 66D IT ACT, 2000
                </p>
              </div>
            )}

            {activeCategory === "lost_property_ncr" && (
              <div>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide underline underline-offset-4 text-slate-950">
                  NON-COGNIZABLE LOST ARTICLE / DOCUMENT REPORT (NCR)
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-bold">
                  ENTERED IN STATION GENERAL DIARY U/S 174 BNSS, 2023
                </p>
              </div>
            )}
          </div>

          {/* 3. Reference Details Grid (Directly Editable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 text-xs border-t border-b border-slate-300 py-3 gap-3 bg-slate-50/50 px-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 shrink-0">Report / Dispatch No.:</span>
              <input
                type="text"
                value={formData.dispatchNo}
                onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                className="w-full font-mono font-bold text-slate-900 bg-amber-50/80 hover:bg-amber-100 focus:bg-white border border-amber-200 rounded px-2 py-0.5 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              <span className="text-slate-500 shrink-0">Date &amp; Time:</span>
              <input
                type="text"
                value={formData.reportDate}
                onChange={(e) => handleFieldChange("reportDate", e.target.value)}
                className="font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs w-28 text-center"
              />
              <input
                type="text"
                value={formData.reportTime}
                onChange={(e) => handleFieldChange("reportTime", e.target.value)}
                className="font-bold text-slate-900 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs w-24 text-center"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 shrink-0">Complaint Ref No.:</span>
              <input
                type="text"
                value={formData.complaintRefNo}
                onChange={(e) => handleFieldChange("complaintRefNo", e.target.value)}
                className="w-full font-mono font-bold text-blue-900 bg-blue-50/80 hover:bg-blue-100 focus:bg-white border border-blue-200 rounded px-2 py-0.5 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              <span className="text-slate-500 shrink-0">General Diary Ref:</span>
              <input
                type="text"
                value={formData.gdEntryNo}
                onChange={(e) => handleFieldChange("gdEntryNo", e.target.value)}
                className="w-full sm:w-64 font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs"
              />
            </div>
          </div>

          {/* 4. Parties Particulars (Editable Directly on Document) */}
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Complainant Block */}
            <div className="bg-blue-50/30 p-3.5 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-700" />
                  <span>1. Complainant / Informant Particulars:</span>
                </span>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Complainant Details"
                  currentValue={formData.complainantName}
                  onTranscript={(val) => handleFieldChange("complainantName", val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Complainant Name</label>
                  <input
                    type="text"
                    value={formData.complainantName}
                    onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                    className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">S/o, W/o, D/o (Father/Husband)</label>
                  <input
                    type="text"
                    value={formData.complainantFather}
                    onChange={(e) => handleFieldChange("complainantFather", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Age / Occupation</label>
                  <input
                    type="text"
                    value={formData.complainantAge}
                    onChange={(e) => handleFieldChange("complainantAge", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.complainantPhone}
                    onChange={(e) => handleFieldChange("complainantPhone", e.target.value)}
                    className="w-full font-mono font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Residential Address</label>
                  <input
                    type="text"
                    value={formData.complainantAddress}
                    onChange={(e) => handleFieldChange("complainantAddress", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>
            </div>

            {/* Opposite Party / Accused Block */}
            <div className="bg-purple-50/30 p-3.5 rounded-xl border border-purple-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-700" />
                  <span>2. Non-Applicant / Opposite Party Particulars:</span>
                </span>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Opposite Party Details"
                  currentValue={formData.accusedName}
                  onTranscript={(val) => handleFieldChange("accusedName", val)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Opposite Party / Accused Name</label>
                  <input
                    type="text"
                    value={formData.accusedName}
                    onChange={(e) => handleFieldChange("accusedName", e.target.value)}
                    className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Father&apos;s Name / Alias</label>
                  <input
                    type="text"
                    value={formData.accusedFather}
                    onChange={(e) => handleFieldChange("accusedFather", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.accusedPhone}
                    onChange={(e) => handleFieldChange("accusedPhone", e.target.value)}
                    className="w-full font-mono text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Address / Location</label>
                  <input
                    type="text"
                    value={formData.accusedAddress}
                    onChange={(e) => handleFieldChange("accusedAddress", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>
            </div>

            {/* Matter in Dispute, Place, Date & Law Sections */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-0.5">3. Matter / Subject in Dispute:</label>
                <input
                  type="text"
                  value={formData.disputeSubject}
                  onChange={(e) => handleFieldChange("disputeSubject", e.target.value)}
                  className="w-full font-bold text-slate-900 bg-white border border-slate-300 rounded px-2.5 py-1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-800 block mb-0.5">4. Place &amp; Date of Occurrence:</label>
                  <input
                    type="text"
                    value={formData.incidentPlace}
                    onChange={(e) => handleFieldChange("incidentPlace", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1 mb-1"
                    placeholder="Place of occurrence"
                  />
                  <input
                    type="text"
                    value={formData.incidentDate}
                    onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
                    placeholder="Date of occurrence"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-0.5">5. Value / Amount / Property Involved:</label>
                  <input
                    type="text"
                    value={formData.amountOrPropertyDetails}
                    onChange={(e) => handleFieldChange("amountOrPropertyDetails", e.target.value)}
                    className="w-full font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-1"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-0.5">6. Relevant Sections of Law / Act:</label>
                <input
                  type="text"
                  value={formData.sectionsOfLaw}
                  onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                  className="w-full font-bold text-[#0b192c] bg-amber-50/70 border border-amber-300 rounded px-2.5 py-1"
                />
              </div>
            </div>

            {/* 7. Substance of Complaint */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs sm:text-sm">
                  7. Substance of Complaint / Allegations:
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Substance of Complaint"
                  currentValue={formData.complaintSubstance}
                  onTranscript={(val) => handleFieldChange("complaintSubstance", val)}
                />
              </div>
              <textarea
                rows={3}
                value={formData.complaintSubstance}
                onChange={(e) => handleFieldChange("complaintSubstance", e.target.value)}
                className="w-full p-3 bg-slate-50 border-l-4 border-slate-800 rounded-r text-xs leading-relaxed font-sans text-slate-850 border border-slate-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 8. Witnesses Examined */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs sm:text-sm">
                  8. Statements of Witnesses Examined u/s 179 BNSS:
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Witnesses Examined"
                  currentValue={formData.witnessesExamined}
                  onTranscript={(val) => handleFieldChange("witnessesExamined", val)}
                />
              </div>
              <textarea
                rows={3}
                value={formData.witnessesExamined}
                onChange={(e) => handleFieldChange("witnessesExamined", e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 9. Documents Verified */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs sm:text-sm">
                  9. Documentary Evidence &amp; Technical Records Verified:
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Documents Verified"
                  currentValue={formData.documentsVerified}
                  onTranscript={(val) => handleFieldChange("documentsVerified", val)}
                />
              </div>
              <textarea
                rows={3}
                value={formData.documentsVerified}
                onChange={(e) => handleFieldChange("documentsVerified", e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 10. Enquiry Findings */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs sm:text-sm">
                  10. Enquiry Officer Detailed Findings:
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Enquiry Findings"
                  currentValue={formData.enquiryFindings}
                  onTranscript={(val) => handleFieldChange("enquiryFindings", val)}
                />
              </div>
              <textarea
                rows={4}
                value={formData.enquiryFindings}
                onChange={(e) => handleFieldChange("enquiryFindings", e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 11. Final Legal Conclusion */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs sm:text-sm">
                  11. Final Legal Conclusion:
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Final Conclusion"
                  currentValue={formData.finalConclusion}
                  onTranscript={(val) => handleFieldChange("finalConclusion", val)}
                />
              </div>
              <textarea
                rows={3}
                value={formData.finalConclusion}
                onChange={(e) => handleFieldChange("finalConclusion", e.target.value)}
                className="w-full p-3 bg-slate-100 border border-slate-400 rounded-lg text-xs leading-relaxed font-bold text-slate-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* 12. Recommendation to SHO */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs sm:text-sm">
                  12. Action Taken / Recommendation to SHO:
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="SHO Recommendation"
                  currentValue={formData.shoRecommendation}
                  onTranscript={(val) => handleFieldChange("shoRecommendation", val)}
                />
              </div>
              <textarea
                rows={3}
                value={formData.shoRecommendation}
                onChange={(e) => handleFieldChange("shoRecommendation", e.target.value)}
                className="w-full p-3 bg-amber-50/70 border border-amber-300 rounded-lg text-xs leading-relaxed font-medium text-slate-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 5. Signatures & Seal Block */}
          <div className="mt-8 pt-4 flex items-end justify-between text-xs font-sans border-t border-slate-300">
            <div className="text-center w-36">
              <div className="h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400">
                Official Station Seal
              </div>
              <p className="mt-1 font-bold text-slate-700">POLICE STATION SEAL</p>
            </div>

            <div className="text-right space-y-1 w-64">
              <input
                type="text"
                value={formData.officerName}
                onChange={(e) => handleFieldChange("officerName", e.target.value)}
                className="w-full text-right font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                placeholder="Officer Name"
              />
              <input
                type="text"
                value={formData.officerRank}
                onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                className="w-full text-right text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                placeholder="Officer Rank"
              />
              <input
                type="text"
                value={formData.officerPno}
                onChange={(e) => handleFieldChange("officerPno", e.target.value)}
                className="w-full text-right font-mono text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500"
                placeholder="PNO / Belt No."
              />
              <p className="text-[11px] font-bold text-[#0b192c]">Enquiry / Reporting Officer</p>
            </div>
          </div>

          {/* 6. Endorsement by SHO */}
          <div className="mt-8 pt-4 border-t-2 border-slate-300 text-xs font-sans space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-900">
                ORDER / ENDORSEMENT BY SHO / S.H.O. OFFICE
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Dated: {formData.reportDate}
              </span>
            </div>
            <p className="text-[11px] text-slate-700 leading-relaxed italic">
              &ldquo;Perused the preliminary enquiry report submitted by the Enquiry Officer. Findings and recommendations are hereby approved. Order entry in General Diary / Registration of case / Disposal accordingly.&rdquo;
            </p>
            <div className="pt-4 flex items-center justify-end text-[11px]">
              <div className="text-right">
                <p className="text-slate-400">_________________________________</p>
                <p className="font-bold text-slate-900 mt-0.5">Station House Officer (SHO)</p>
                <p className="text-[10px] text-slate-600">{formData.policeStation}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Floating / Sticky Save Toolbar */}
        {complaint && (
          <div className="no-print p-4 bg-white border border-slate-200 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Ready to link this report to Complaint {complaint.complaintNumber}?
                </p>
                <p className="text-[11px] text-slate-500">
                  Click save to persist this drafted report directly into the complaint profile reports docket.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/complaints/${complaint.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Cancel &amp; Return
                </Button>
              </Link>
              <Button
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                variant="primary"
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Saved to Docket!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save Report to Complaint"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DraftsAndNCRPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Enquiry Reports &amp; NCR Drafts...
        </div>
      }
    >
      <DraftsAndNCRContent />
    </Suspense>
  );
}
