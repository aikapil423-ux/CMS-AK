"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
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
  AlertTriangle,
  Download,
  Edit3,
  Calendar,
  Building,
  User,
  Phone,
  Clock,
  ScrollText,
  BadgeAlert,
  ArrowRight,
  Landmark,
  Home,
  HeartHandshake,
  Laptop,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

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
    complainantAge: "41 Years, Contractor",
    complainantAddress: "H.No. 54, Ward 6, Near Old Bus Stand, Thanesar, Kurukshetra",
    complainantPhone: "9812000000",

    accusedName: "Vikas Sharma alias Vicky",
    accusedFather: "Sh. Ramesh Chand Sharma",
    accusedAddress: "H.No. 412, Sector 7, Urban Estate, Thanesar, Kurukshetra",
    accusedPhone: "9812044551",

    incidentDate: "18-09-2026 at about 11:30 AM",
    incidentPlace: "M/s Sharma Steel Traders, New Bus Stand Road, Thanesar",
    sectionsOfLaw: "Section 318(4) (Cheating) & 316(2) (Criminal Breach of Trust) BNS, 2023",
    disputeSubject: "Financial Cheating in Advance Payment for Building Material Supply",
    amountOrPropertyDetails: "₹4,50,000/- (Rs. 2,00,000 cash + Rs. 2,50,000/- RTGS to SBI A/c 38491029381)",
    complaintSubstance:
      "The complainant alleged that the accused accepted an advance of ₹4,50,000/- promising to deliver 8 metric tonnes of TMT construction steel within 48 hours. After receiving payment, the accused locked his shop, became untraceable, and issued a bogus security cheque which bounced due to 'Account Closed', followed by criminal threats.",

    witnessesExamined:
      "1. Statement of Complainant Rajesh Kumar recorded u/s 179 BNSS\n2. Statement of neighboring trader Mohan Lal Gupta\n3. Bank Manager Sh. A.K. Bansal (SBI Commercial Branch)",

    documentsVerified:
      "1. Written quotation / receipt dated 15-09-2026 for ₹4,50,000/-\n2. Bank account statement verifying debit from complainant's account and credit into accused's account\n3. Cheque return memo dated 24-09-2026 citing 'Account Closed'\n4. Call detail records confirming phone communication",

    enquiryFindings:
      "Enquiry reveals that the accused intentionally accepted the advance despite knowing his bank account was already under debit freeze by other creditors. He neither owned any stock of steel nor placed orders with wholesalers. The dishonest intention to induce delivery of money was present right from inception. Notice u/s 35(3) BNSS was served but accused failed to tender any plausible defense.",

    finalConclusion:
      "The allegations of fraudulent inducement, misappropriation of ₹4,50,000/-, and criminal breach of trust stand substantiated prima facie during the preliminary inquiry under Section 173(3) BNSS, 2023.",

    shoRecommendation:
      "It is respectfully recommended to SHO Police Station City Thanesar that regular FIR be registered under Section 318(4) and 316(2) of Bharatiya Nyaya Sanhita (BNS), 2023 and investigation assigned to an officer for taking custodial/recovery steps.",

    officerName: "Surender Pal",
    officerRank: "Assistant Sub-Inspector (ASI)",
    officerPno: "PNO-23841",
    officerPhone: "9812000000",
  },

  // 2. LAND / PROPERTY DISPUTE
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

export default function DraftsAndNCRPage() {
  const { currentUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<PoliceReportCategory>("financial_fraud");
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [formData, setFormData] = useState<PoliceReportFormData>(CATEGORY_SAMPLE_DATA["financial_fraud"]);
  const [copied, setCopied] = useState(false);
  const [isInlineEdit, setIsInlineEdit] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "form-only" | "doc-only">("split");

  const documentRef = useRef<HTMLDivElement>(null);

  const handleCategorySwitch = (cat: PoliceReportCategory) => {
    setActiveCategory(cat);
    setFormData({
      ...CATEGORY_SAMPLE_DATA[cat],
      officerName: currentUser.name || CATEGORY_SAMPLE_DATA[cat].officerName,
      policeStation: currentUser.stationName || CATEGORY_SAMPLE_DATA[cat].policeStation,
      district: currentUser.district ? `${currentUser.district}, Haryana` : CATEGORY_SAMPLE_DATA[cat].district,
    });
  };

  const handleFieldChange = (field: keyof PoliceReportFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetSample = () => {
    setFormData(CATEGORY_SAMPLE_DATA[activeCategory]);
  };

  const handleClearForm = () => {
    setFormData({
      dispatchNo: `HP/KKR/CT/${new Date().getFullYear()}/ENQ-____`,
      complaintRefNo: "HAR-KKR-2026-CMP-____",
      gdEntryNo: `GD Entry No. ____ dated ${new Date().toISOString().split("T")[0]}`,
      policeStation: currentUser.stationName || "Police Station City Thanesar",
      district: currentUser.district ? `${currentUser.district}, Haryana` : "Kurukshetra, Haryana",
      reportDate: new Date().toISOString().split("T")[0],
      reportTime: "12:00 PM",
      complainantName: "",
      complainantFather: "",
      complainantAge: "",
      complainantAddress: "",
      complainantPhone: "",
      accusedName: "",
      accusedFather: "",
      accusedAddress: "",
      accusedPhone: "",
      incidentDate: "",
      incidentPlace: "",
      sectionsOfLaw: "",
      disputeSubject: "",
      amountOrPropertyDetails: "",
      complaintSubstance: "",
      witnessesExamined: "",
      documentsVerified: "",
      enquiryFindings: "",
      finalConclusion: "",
      shoRecommendation: "",
      officerName: currentUser.name,
      officerRank: currentUser.rankDisplay || "Enquiry Officer",
      officerPno: currentUser.pno || "PNO-_____",
      officerPhone: "9812000000",
    });
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
    const filename = `${formData.dispatchNo.replace(/\//g, "_")}_REPORT.txt`;
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

  return (
    <div className="space-y-5 animate-in fade-in-50 pb-12">
      {/* Top Header - No-print */}
      <div className="no-print space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
                Police Complaint Enquiry Reports &amp; NCR
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                Category-Specific Reports
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#0b192c] tracking-tight flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-amber-700" />
              <span>Draft Reports &amp; NCR Templates by Complaint Type</span>
            </h1>
            <p className="text-xs text-slate-500">
              Standard enquiry reports &amp; NCR templates: Fill fields on Page 1, preview and download complete formatted legal draft on Page 2.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/enquiry-workspace">
              <Button variant="outline" size="sm" className="text-xs">
                &larr; Back to Workspace
              </Button>
            </Link>
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
              onClick={handlePrint}
              variant="primary"
              size="sm"
              className="bg-[#0b192c] text-white flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </Button>
          </div>
        </div>

        {/* Top Workspace Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
          <Link
            href="/enquiry-workspace"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            Enquiry Dashboard
          </Link>
          <Link
            href="/enquiry-workspace/drafts"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#0b192c] text-white shadow-xs transition-all flex items-center gap-1.5"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Draft Reports &amp; NCR</span>
          </Link>
          <Link
            href="/enquiry-workspace/templates"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all"
          >
            <ScrollText className="w-3.5 h-3.5 text-purple-600" />
            <span>Notice Templates</span>
          </Link>
        </div>

        {/* SUB-TABS: Specific Police Complaint Report Categories */}
        <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Select Report Category:
            </span>
            {/* View Mode controls */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                  viewMode === "split" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Dual Split View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("form-only")}
                className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                  viewMode === "form-only" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Page 1 (Form)
              </button>
              <button
                type="button"
                onClick={() => setViewMode("doc-only")}
                className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                  viewMode === "doc-only" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Page 2 (Report)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCategorySwitch("financial_fraud")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === "financial_fraud"
                  ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Financial Fraud</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch("land_dispute")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === "land_dispute"
                  ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-400" />
              <span>2. Land &amp; Civil Dispute</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch("assault_ncr")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === "assault_ncr"
                  ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <BadgeAlert className="w-3.5 h-3.5 text-red-400" />
              <span>3. Assault &amp; NCR</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch("matrimonial_dispute")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === "matrimonial_dispute"
                  ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-pink-400" />
              <span>4. Matrimonial Dispute</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch("cyber_crime")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === "cyber_crime"
                  ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Laptop className="w-3.5 h-3.5 text-cyan-400" />
              <span>5. Cyber Crime</span>
            </button>

            <button
              type="button"
              onClick={() => handleCategorySwitch("lost_property_ncr")}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeCategory === "lost_property_ncr"
                  ? "bg-[#0b192c] text-white shadow-xs ring-1 ring-[#0b192c]"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>6. Lost Property / NCR</span>
            </button>
          </div>
        </div>

        {/* Dictation & Quick Sample Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Mic className="w-4 h-4 text-amber-700 animate-pulse" />
              <span>Voice Dictation for All Fields:</span>
            </div>
            <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-amber-200">
              <button
                type="button"
                onClick={() => setVoiceLang("en-IN")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  voiceLang === "en-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setVoiceLang("hi-IN")}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  voiceLang === "hi-IN" ? "bg-[#0b192c] text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hindi
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetSample}
              className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-white border border-amber-200 hover:bg-amber-50 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Fill Sample Data</span>
            </button>
            <button
              type="button"
              onClick={handleClearForm}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Form</span>
            </button>
          </div>
        </div>
      </div>

      {/* DUAL-PAGE VIEW CONTAINER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* ================= PAGE 1: EDIT FIELDS FORM (FULL NATURAL HEIGHT, NO INNER SCROLL) ================= */}
        {(viewMode === "split" || viewMode === "form-only") && (
          <div
            className={`no-print space-y-4 ${
              viewMode === "form-only" ? "xl:col-span-12" : "xl:col-span-5"
            }`}
          >
            <Card className="border-slate-200 shadow-xs">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#0b192c] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[#0b192c] uppercase tracking-wide">
                      Page 1: Edit Report Fields
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Changes update the drafted report on Page 2 in real-time
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                  Live Synced
                </span>
              </div>

              {/* No inner vertical scroll, natural full height */}
              <CardContent className="p-4 sm:p-5 space-y-4">
                {/* 1. Header & GD Info */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-700" />
                    <span>Station &amp; Diary Reference</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Dispatch / Report Ref *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Dispatch No"
                          currentValue={formData.dispatchNo}
                          onTranscript={(val) => handleFieldChange("dispatchNo", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.dispatchNo}
                        onChange={(e) => handleFieldChange("dispatchNo", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Complaint ID *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Complaint Ref"
                          currentValue={formData.complaintRefNo}
                          onTranscript={(val) => handleFieldChange("complaintRefNo", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.complaintRefNo}
                        onChange={(e) => handleFieldChange("complaintRefNo", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">General Diary Entry No. *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="GD Entry No"
                          currentValue={formData.gdEntryNo}
                          onTranscript={(val) => handleFieldChange("gdEntryNo", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.gdEntryNo}
                        onChange={(e) => handleFieldChange("gdEntryNo", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Report Date *</label>
                      <input
                        type="date"
                        value={formData.reportDate}
                        onChange={(e) => handleFieldChange("reportDate", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Police Station Name *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Police Station"
                          currentValue={formData.policeStation}
                          onTranscript={(val) => handleFieldChange("policeStation", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.policeStation}
                        onChange={(e) => handleFieldChange("policeStation", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Informant / Complainant Details */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Complainant Details</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Complainant Full Name *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Complainant Name"
                          currentValue={formData.complainantName}
                          onTranscript={(val) => handleFieldChange("complainantName", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.complainantName}
                        onChange={(e) => handleFieldChange("complainantName", e.target.value)}
                        placeholder="e.g. Rajesh Kumar"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Father&apos;s / Spouse Name</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Father's Name"
                          currentValue={formData.complainantFather}
                          onTranscript={(val) => handleFieldChange("complainantFather", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.complainantFather}
                        onChange={(e) => handleFieldChange("complainantFather", e.target.value)}
                        placeholder="e.g. Sh. Ram Bilas"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Age &amp; Occupation</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Age and Occupation"
                          currentValue={formData.complainantAge}
                          onTranscript={(val) => handleFieldChange("complainantAge", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.complainantAge}
                        onChange={(e) => handleFieldChange("complainantAge", e.target.value)}
                        placeholder="e.g. 41 Years, Contractor"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Contact Mobile</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Contact Mobile"
                          currentValue={formData.complainantPhone}
                          onTranscript={(val) => {
                            const cleaned = val.replace(/\D/g, "").slice(0, 10);
                            handleFieldChange("complainantPhone", cleaned || val);
                          }}
                        />
                      </div>
                      <input
                        type="tel"
                        value={formData.complainantPhone}
                        onChange={(e) => handleFieldChange("complainantPhone", e.target.value)}
                        placeholder="98xxxxxxxx"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Full Residential Address *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Address"
                          currentValue={formData.complainantAddress}
                          onTranscript={(val) => handleFieldChange("complainantAddress", val)}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={formData.complainantAddress}
                        onChange={(e) => handleFieldChange("complainantAddress", e.target.value)}
                        placeholder="House No., Ward/Village, Town..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Accused / Opposite Party */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>Opposite Party / Accused Details</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Name / Identity *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Opposite Party Name"
                          currentValue={formData.accusedName}
                          onTranscript={(val) => handleFieldChange("accusedName", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.accusedName}
                        onChange={(e) => handleFieldChange("accusedName", e.target.value)}
                        placeholder="e.g. Vikas Sharma"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Father&apos;s / Alias</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Opposite Party Father"
                          currentValue={formData.accusedFather}
                          onTranscript={(val) => handleFieldChange("accusedFather", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.accusedFather}
                        onChange={(e) => handleFieldChange("accusedFather", e.target.value)}
                        placeholder="e.g. Sh. Ramesh Chand"
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Address / Whereabouts</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Opposite Party Address"
                          currentValue={formData.accusedAddress}
                          onTranscript={(val) => handleFieldChange("accusedAddress", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.accusedAddress}
                        onChange={(e) => handleFieldChange("accusedAddress", e.target.value)}
                        placeholder="House / Street, Village/Town..."
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Incident Facts & Category Specific Data */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-red-600" />
                    <span>Dispute Subject, Property &amp; Legal Sections</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Subject / Matter in Dispute *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Dispute Subject"
                          currentValue={formData.disputeSubject}
                          onTranscript={(val) => handleFieldChange("disputeSubject", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.disputeSubject}
                        onChange={(e) => handleFieldChange("disputeSubject", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-semibold focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Date &amp; Time of Occurrence *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Occurrence Date"
                          currentValue={formData.incidentDate}
                          onTranscript={(val) => handleFieldChange("incidentDate", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.incidentDate}
                        onChange={(e) => handleFieldChange("incidentDate", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Place of Occurrence *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Occurrence Place"
                          currentValue={formData.incidentPlace}
                          onTranscript={(val) => handleFieldChange("incidentPlace", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.incidentPlace}
                        onChange={(e) => handleFieldChange("incidentPlace", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Amount / Property / Document Details *
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Property Details"
                          currentValue={formData.amountOrPropertyDetails}
                          onTranscript={(val) => handleFieldChange("amountOrPropertyDetails", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.amountOrPropertyDetails}
                        onChange={(e) => handleFieldChange("amountOrPropertyDetails", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Relevant Sections of Law / Act *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Sections of Law"
                          currentValue={formData.sectionsOfLaw}
                          onTranscript={(val) => handleFieldChange("sectionsOfLaw", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.sectionsOfLaw}
                        onChange={(e) => handleFieldChange("sectionsOfLaw", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Substance of Complaint / Allegations *
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Complaint Substance"
                          currentValue={formData.complaintSubstance}
                          onTranscript={(val) => handleFieldChange("complaintSubstance", val)}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={formData.complaintSubstance}
                        onChange={(e) => handleFieldChange("complaintSubstance", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Enquiry Process & Findings */}
                <div className="space-y-3 pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Investigation Steps &amp; Findings</span>
                  </h3>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Statements of Witnesses Recorded
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Witnesses Recorded"
                          currentValue={formData.witnessesExamined}
                          onTranscript={(val) => handleFieldChange("witnessesExamined", val)}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={formData.witnessesExamined}
                        onChange={(e) => handleFieldChange("witnessesExamined", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Documents &amp; Records Verified
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Documents Verified"
                          currentValue={formData.documentsVerified}
                          onTranscript={(val) => handleFieldChange("documentsVerified", val)}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={formData.documentsVerified}
                        onChange={(e) => handleFieldChange("documentsVerified", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Enquiry Officer Detailed Findings *
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Enquiry Findings"
                          currentValue={formData.enquiryFindings}
                          onTranscript={(val) => handleFieldChange("enquiryFindings", val)}
                        />
                      </div>
                      <textarea
                        rows={3}
                        value={formData.enquiryFindings}
                        onChange={(e) => handleFieldChange("enquiryFindings", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Final Legal Conclusion *
                        </label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Final Conclusion"
                          currentValue={formData.finalConclusion}
                          onTranscript={(val) => handleFieldChange("finalConclusion", val)}
                        />
                      </div>
                      <textarea
                        rows={2}
                        value={formData.finalConclusion}
                        onChange={(e) => handleFieldChange("finalConclusion", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">
                          Recommendation to SHO / Action Taken *
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
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Officer Signature */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Investigating / Enquiry Officer Particulars</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Officer Name *</label>
                        <VoiceInputButton
                          preferredLang={voiceLang}
                          fieldLabel="Officer Name"
                          currentValue={formData.officerName}
                          onTranscript={(val) => handleFieldChange("officerName", val)}
                        />
                      </div>
                      <input
                        type="text"
                        value={formData.officerName}
                        onChange={(e) => handleFieldChange("officerName", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-700">Rank &amp; PNO *</label>
                      </div>
                      <input
                        type="text"
                        value={`${formData.officerRank} (${formData.officerPno})`}
                        onChange={(e) => handleFieldChange("officerRank", e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-[#0b192c]"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ================= PAGE 2: FULL FORMATTED REPORT / NCR (DOWNLOADABLE & PRINTABLE) ================= */}
        {(viewMode === "split" || viewMode === "doc-only") && (
          <div className={`${viewMode === "doc-only" ? "xl:col-span-12" : "xl:col-span-7"}`}>
            {/* Top Toolbar of Document */}
            <div className="no-print mb-2.5 flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-100 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-700 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Page 2: Official Formatted Report / NCR
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInlineEdit(!isInlineEdit)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                    isInlineEdit
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                  title="Enable direct in-place typing into the drafted report"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isInlineEdit ? "Direct Edit: ON" : "Direct Edit: OFF"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-2.5 py-1 bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  title="Download report text file to device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-2.5 py-1 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 rounded text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1 bg-[#0b192c] text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-slate-850 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4</span>
                </button>
              </div>
            </div>

            {/* THE FORMAL LEGAL NCR / REPORT DOCUMENT */}
            <div
              ref={documentRef}
              contentEditable={isInlineEdit}
              suppressContentEditableWarning={true}
              className={`bg-white border border-slate-300 rounded-xl p-8 sm:p-12 shadow-md font-serif text-slate-900 transition-all ${
                isInlineEdit ? "ring-2 ring-amber-400 bg-amber-50/10 cursor-text" : ""
              }`}
              style={{ minHeight: "850px", lineHeight: "1.7" }}
            >
              {/* Header Seal */}
              <div className="text-center pb-4 border-b-2 border-slate-900">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield className="w-7 h-7 text-[#0b192c]" />
                  <span className="text-sm font-black tracking-widest uppercase font-sans text-[#0b192c]">
                    HARYANA POLICE
                  </span>
                </div>
                <h3 className="text-xs font-bold tracking-wider uppercase font-sans text-slate-700">
                  GOVERNMENT OF HARYANA
                </h3>
                <h2 className="text-base font-black uppercase text-slate-950 mt-1 font-sans">
                  {formData.policeStation}, DISTRICT {formData.district}
                </h2>
              </div>

              {/* Title Header */}
              <div className="my-5 text-center">
                {activeCategory === "financial_fraud" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      PRELIMINARY ENQUIRY REPORT - FINANCIAL CHEATING &amp; FRAUD
                    </h1>
                    <p className="text-[11px] font-sans text-slate-700 mt-1 font-bold">
                      INQUIRY UNDER SECTION 173(3) BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
                    </p>
                    <p className="text-[10px] font-sans text-slate-500">
                      (Subject: Investigation of Cheating &amp; Criminal Breach of Trust u/s 318(4), 316(2) BNS, 2023)
                    </p>
                  </div>
                )}

                {activeCategory === "land_dispute" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      ENQUIRY REPORT - LAND / PASSAGE BOUNDARY DISPUTE (CIVIL NATURE)
                    </h1>
                    <p className="text-[11px] font-sans text-slate-700 mt-1 font-bold">
                      FIELD VERIFICATION UNDER SECTION 173(3) BNSS, 2023 / CHAPTER XXII PPR
                    </p>
                  </div>
                )}

                {activeCategory === "assault_ncr" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      FIRST INFORMATION OF A NON-COGNIZABLE CRIME (NCR)
                    </h1>
                    <p className="text-[11px] font-sans text-slate-700 mt-1 font-bold">
                      RECORDED UNDER SECTION 174 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
                    </p>
                    <p className="text-[10px] font-sans text-slate-500">
                      (Corresponding to Section 155 CrPC - Offence of Simple Hurt / Altercation / Insult)
                    </p>
                  </div>
                )}

                {activeCategory === "matrimonial_dispute" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      MATRIMONIAL &amp; DOMESTIC DISPUTE ENQUIRY / COUNSELING REPORT
                    </h1>
                    <p className="text-[11px] font-sans text-slate-700 mt-1 font-bold">
                      WOMEN CELL MEDIATION &amp; COMPROMISE PROCEEDINGS
                    </p>
                  </div>
                )}

                {activeCategory === "cyber_crime" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      CYBER CRIME &amp; FINANCIAL PHISHING PRELIMINARY REPORT
                    </h1>
                    <p className="text-[11px] font-sans text-slate-700 mt-1 font-bold">
                      INQUIRY UNDER SECTION 173(3) BNSS &amp; SECTION 66D IT ACT, 2000
                    </p>
                  </div>
                )}

                {activeCategory === "lost_property_ncr" && (
                  <div>
                    <h1 className="text-sm sm:text-base font-black uppercase tracking-wide underline underline-offset-4 text-slate-950 font-sans">
                      NON-COGNIZABLE LOST ARTICLE / DOCUMENT REPORT (NCR)
                    </h1>
                    <p className="text-[11px] font-sans text-slate-700 mt-1 font-bold">
                      ENTERED IN STATION GENERAL DIARY U/S 174 BNSS, 2023
                    </p>
                  </div>
                )}
              </div>

              {/* Reference Details Grid */}
              <div className="grid grid-cols-2 text-xs font-sans border-t border-b border-slate-300 py-2.5 my-3 gap-2">
                <div>
                  <span className="text-slate-500">Report / Dispatch No.:</span>{" "}
                  <span className="font-mono font-bold text-slate-900 bg-amber-50 px-1 py-0.5 rounded">
                    {formData.dispatchNo || "[Dispatch No]"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Date &amp; Time:</span>{" "}
                  <span className="font-bold text-slate-900">
                    {formData.reportDate} at {formData.reportTime}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Complaint Reference:</span>{" "}
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded">
                    {formData.complaintRefNo || "[Complaint Ref]"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">General Diary Ref:</span>{" "}
                  <span className="font-mono font-bold text-slate-800">
                    {formData.gdEntryNo || "[GD Entry No]"}
                  </span>
                </div>
              </div>

              {/* Parties Table */}
              <div className="space-y-4 text-xs sm:text-sm">
                {/* 1. Complainant */}
                <div className="bg-slate-50/70 p-3 rounded border border-slate-200 font-sans space-y-1">
                  <p className="font-bold text-xs uppercase tracking-wider text-blue-900">
                    1. Complainant Particulars:
                  </p>
                  <p className="font-bold text-slate-950 text-sm">
                    {formData.complainantName || "[Complainant Name]"}
                  </p>
                  {formData.complainantFather && (
                    <p className="text-slate-700">
                      S/o, W/o, D/o: <span className="font-semibold">{formData.complainantFather}</span>
                    </p>
                  )}
                  {formData.complainantAge && (
                    <p className="text-slate-700">
                      Age / Occupation: <span className="font-semibold">{formData.complainantAge}</span>
                    </p>
                  )}
                  <p className="text-slate-700">
                    Residential Address:{" "}
                    <span className="font-semibold">{formData.complainantAddress || "[Address]"}</span>
                  </p>
                  {formData.complainantPhone && (
                    <p className="text-slate-700">
                      Mobile Number: <span className="font-mono font-semibold">{formData.complainantPhone}</span>
                    </p>
                  )}
                </div>

                {/* 2. Opposite Party / Accused */}
                <div className="bg-slate-50/70 p-3 rounded border border-slate-200 font-sans space-y-1">
                  <p className="font-bold text-xs uppercase tracking-wider text-purple-900">
                    2. Non-Applicant / Opposite Party Particulars:
                  </p>
                  <p className="font-bold text-slate-950 text-sm">
                    {formData.accusedName || "[Name / Identity]"}
                  </p>
                  {formData.accusedFather && (
                    <p className="text-slate-700">
                      Father&apos;s Name / Alias: <span className="font-semibold">{formData.accusedFather}</span>
                    </p>
                  )}
                  <p className="text-slate-700">
                    Address: <span className="font-semibold">{formData.accusedAddress || "[Address]"}</span>
                  </p>
                </div>

                {/* 3. Matter in Dispute & Property */}
                <div className="bg-slate-50/50 p-2.5 rounded border border-slate-200 font-sans space-y-1">
                  <p>
                    <strong>3. Matter / Subject in Dispute:</strong>{" "}
                    <span className="font-bold text-slate-900">{formData.disputeSubject}</span>
                  </p>
                  <p>
                    <strong>4. Place &amp; Date of Occurrence:</strong>{" "}
                    <span>
                      {formData.incidentPlace} on {formData.incidentDate}
                    </span>
                  </p>
                  <p>
                    <strong>5. Value / Details of Amount or Property Involved:</strong>{" "}
                    <span className="font-mono font-bold text-slate-900">{formData.amountOrPropertyDetails}</span>
                  </p>
                  <p>
                    <strong>6. Relevant Sections of Law / Act:</strong>{" "}
                    <span className="font-bold text-[#0b192c] bg-slate-100 px-1.5 py-0.5 rounded">
                      {formData.sectionsOfLaw}
                    </span>
                  </p>
                </div>

                {/* 4. Substance of Complaint */}
                <div className="space-y-1 pt-1">
                  <p className="font-bold font-sans">7. Substance of Complaint / Allegations:</p>
                  <div className="p-3 bg-slate-50 border-l-4 border-slate-800 rounded-r text-xs leading-relaxed italic font-sans text-slate-850">
                    &ldquo;{formData.complaintSubstance || "[Substance of complaint]"}&rdquo;
                  </div>
                </div>

                {/* 5. Investigation & Witnesses */}
                {formData.witnessesExamined && (
                  <div className="space-y-1 pt-1 font-sans">
                    <p className="font-bold">8. Statements of Witnesses Examined u/s 179 BNSS:</p>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed whitespace-pre-line text-slate-800">
                      {formData.witnessesExamined}
                    </div>
                  </div>
                )}

                {/* 6. Documents Verified */}
                {formData.documentsVerified && (
                  <div className="space-y-1 pt-1 font-sans">
                    <p className="font-bold">9. Documentary Evidence &amp; Technical Records Verified:</p>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed whitespace-pre-line text-slate-800">
                      {formData.documentsVerified}
                    </div>
                  </div>
                )}

                {/* 7. Findings */}
                <div className="space-y-1 pt-1">
                  <p className="font-bold font-sans">10. Enquiry Officer Detailed Findings:</p>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs leading-relaxed font-sans text-slate-850 whitespace-pre-line">
                    {formData.enquiryFindings || "[Enquiry findings]"}
                  </div>
                </div>

                {/* 8. Final Conclusion */}
                <div className="space-y-1 pt-1">
                  <p className="font-bold font-sans text-slate-900">
                    11. Final Legal Conclusion:
                  </p>
                  <div className="p-3 bg-slate-100 border border-slate-300 rounded text-xs leading-relaxed font-sans text-slate-900 whitespace-pre-line">
                    {formData.finalConclusion || "[Final Conclusion]"}
                  </div>
                </div>

                {/* 9. SHO Recommendation */}
                <div className="space-y-1 pt-1">
                  <p className="font-bold font-sans text-slate-900">
                    12. Action Taken / Recommendation to SHO:
                  </p>
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs leading-relaxed font-sans text-slate-950 font-medium whitespace-pre-line">
                    {formData.shoRecommendation || "[Recommendation]"}
                  </div>
                </div>
              </div>

              {/* Signatures & Seal Block */}
              <div className="mt-8 pt-4 flex items-end justify-between text-xs font-sans">
                <div className="text-center w-36">
                  <div className="h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
                    Station Stamp
                  </div>
                  <p className="mt-1 font-bold text-slate-700">POLICE STATION SEAL</p>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">{formData.officerName}</p>
                  <p className="text-slate-700">{formData.officerRank}</p>
                  <p className="font-mono text-slate-600">{formData.officerPno}</p>
                  <p className="text-slate-700">{formData.policeStation}</p>
                  <p className="text-slate-600 font-mono">Mob: {formData.officerPhone}</p>
                  <p className="text-[11px] font-bold text-[#0b192c]">Enquiry / Reporting Officer</p>
                </div>
              </div>

              {/* Endorsement by SHO */}
              <div className="mt-8 pt-4 border-t-2 border-slate-300 text-xs font-sans space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider text-slate-900">
                    ORDER / ENDORSEMENT BY SHO / S.H.O. OFFICE
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Dated: ____/____/2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed italic">
                  &ldquo;Perused the preliminary enquiry report submitted by the Enquiry Officer. Findings and recommendations are hereby approved. Order entry in General Diary / Registration of case / Closure accordingly.&rdquo;
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
          </div>
        )}
      </div>
    </div>
  );
}
