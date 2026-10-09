"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Scale,
  Printer,
  Copy,
  Check,
  Shield,
  FileCheck2,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";

export type FinalFormType = "CHARGESHEET" | "CLOSURE" | "UNTRACED" | "CANCELLED";

interface FormTypeConfig {
  label: string;
  badge: string;
  policeFormNo: string;
  bnssSection: string;
  titleHindi: string;
  description: string;
}

const FINAL_FORM_CONFIGS: Record<FinalFormType, FormTypeConfig> = {
  CHARGESHEET: {
    label: "Chargesheet / Challan",
    badge: "Trial Recommended",
    policeFormNo: "Form No. 24.5(2)",
    bnssSection: "Section 193(3) BNSS, 2023",
    titleHindi: "दोषारोप पत्र (चालान)",
    description: "Police report sent to Court requesting trial against accused persons where prima facie offence is established.",
  },
  CLOSURE: {
    label: "Closure Report (FR)",
    badge: "Mistake of Fact / Civil Dispute",
    policeFormNo: "Form No. 24.5(3)",
    bnssSection: "Section 193(3) & 190 BNSS, 2023",
    titleHindi: "खारिजी रिपोर्ट",
    description: "Case closed where evidence reveals no criminal cognizable offence occurred or dispute is purely civil in nature.",
  },
  UNTRACED: {
    label: "Untraced Report (Adam Surag)",
    badge: "Culprit Not Found",
    policeFormNo: "Form No. 24.5(4)",
    bnssSection: "Section 193(3) BNSS, 2023",
    titleHindi: "अदम सुराग रिपोर्ट",
    description: "Offence occurred but despite diligent investigation, culprits could not be identified or traced.",
  },
  CANCELLED: {
    label: "Cancellation Report",
    badge: "False / Malicious Complaint",
    policeFormNo: "Form No. 24.5(5)",
    bnssSection: "Section 193(3) BNSS, 2023",
    titleHindi: "रद्द रिपोर्ट (कैंसिलेशन)",
    description: "Report recommending cancellation of FIR found to be registered upon false, frivolous, or malicious grounds.",
  },
};

interface AccusedTrialEntry {
  id: string;
  name: string;
  fatherName: string;
  address: string;
  status: "IN_CUSTODY" | "ON_BAIL" | "ABSCONDING" | "NOT_ARRESTED";
  bailBondDetails?: string;
  jailDetails?: string;
}

function FIRFinalFormContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [formType, setFormType] = useState<FinalFormType>("CHARGESHEET");

  // Editable Proforma Fields
  const [courtName, setCourtName] = useState("In the Court of Chief Judicial Magistrate, Gurugram");
  const [reportNumber, setReportNumber] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [policeStation, setPoliceStation] = useState("Sector 29 Police Station");
  const [district, setDistrict] = useState("Gurugram");
  const [firActsAndSections, setFirActsAndSections] = useState("");
  const [firNumberAndDate, setFirNumberAndDate] = useState("");

  // Complainant Details
  const [complainantName, setComplainantName] = useState("");
  const [complainantFather, setComplainantFather] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");

  // Accused Persons Sent for Trial (Chargesheet)
  const [accusedSentList, setAccusedSentList] = useState<AccusedTrialEntry[]>([]);
  // Accused Persons Not Sent for Trial (Closure / Untraced / Cancelled)
  const [accusedNotSentList, setAccusedNotSentList] = useState<
    { id: string; name: string; reason: string }[]
  >([]);

  // Property Details
  const [propertyRecovered, setPropertyRecovered] = useState("");

  // IO and SHO Endorsement
  const [investigatingOfficer, setInvestigatingOfficer] = useState(
    currentUser.name || "SI Neeraj Kumar"
  );
  const [ioRank, setIoRank] = useState("Sub Inspector");
  const [ioBelt, setIoBelt] = useState("SI/6641");
  const [shoName, setShoName] = useState("Inspector Rajesh Kumar");
  const [investigationSummary, setInvestigationSummary] = useState("");

  const [copied, setCopied] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    const list = firService.getAllFirs();
    setFirs(list);
    if (!selectedFirId && list.length > 0) {
      setSelectedFirId(list[0].id);
    }
  }, []);

  const activeFir = firs.find(
    (f) => f.id === selectedFirId || f.firNumber === selectedFirId
  );

  useEffect(() => {
    if (activeFir) {
      setPoliceStation(activeFir.policeStation);
      setDistrict(activeFir.district);
      setFirNumberAndDate(`${activeFir.firNumber} dt ${activeFir.firDate || "28-03-2026"}`);
      setFirActsAndSections(activeFir.actsAndSections || "Sec 303(2), 305 Bharatiya Nyaya Sanhita, 2023");
      setReportNumber(
        activeFir.finalFormNumber ||
          `${formType === "CHARGESHEET" ? "CS" : "FR"}/${activeFir.firYear}/${activeFir.firNumber.replace(/[^0-9]/g, "").slice(-4) || "001"}`
      );
      if (activeFir.courtName) {
        setCourtName(activeFir.courtName);
      } else {
        setCourtName(`In the Court of Chief Judicial Magistrate, ${activeFir.district}`);
      }

      setComplainantName(activeFir.complainantName);
      setComplainantFather(activeFir.complainantFatherSpouse || "Sh. Ramesh Sharma");
      setComplainantAddress(
        `${activeFir.complainantAddress || ""}, ${activeFir.complainantCity || ""}, ${activeFir.district}`.replace(
          /^, |, $/g,
          ""
        )
      );
      setComplainantPhone(activeFir.complainantMobile || "9812345670");

      if (activeFir.assignedIoName) {
        setInvestigatingOfficer(activeFir.assignedIoName);
        setIoRank(activeFir.assignedIoRank || "Sub Inspector");
        setIoBelt(activeFir.assignedIoBeltNumber || "SI/6641");
      }
      setShoName(activeFir.registeredBy || "Inspector Rajesh Kumar (SHO)");

      if (activeFir.stolenPropertyDetails) {
        setPropertyRecovered(
          `${activeFir.stolenPropertyDetails} (Seized and deposited under Malkhana Mud No. MK-${activeFir.id.slice(-3)}/2026)`
        );
      } else {
        setPropertyRecovered("No tangible property recovered or required for exhibit.");
      }

      // Populate accused list
      if (activeFir.accusedList && activeFir.accusedList.length > 0) {
        if (formType === "CHARGESHEET") {
          setAccusedSentList(
            activeFir.accusedList.map((a, idx) => ({
              id: a.id || `acc-${idx}`,
              name: a.name,
              fatherName: a.fatherName || "Unknown",
              address: a.address || "Address not provided",
              status: idx === 0 ? "ON_BAIL" : "IN_CUSTODY",
              bailBondDetails:
                idx === 0
                  ? "Admitted to bail under Sec 480 BNSS by Court; Bail bond furnished."
                  : undefined,
              jailDetails: idx !== 0 ? "Judicial Custody, District Jail." : undefined,
            }))
          );
          setAccusedNotSentList([]);
        } else {
          setAccusedSentList([]);
          setAccusedNotSentList(
            activeFir.accusedList.map((a, idx) => ({
              id: a.id || `acc-not-${idx}`,
              name: a.name,
              reason:
                formType === "CLOSURE"
                  ? "No prima facie evidence found during investigation; dispute resolved as non-cognizable."
                  : formType === "UNTRACED"
                  ? "Identity could not be established despite scanning CCTV footage and interrogating suspects."
                  : "Allegations found to be unsubstantiated and malicious.",
            }))
          );
        }
      } else {
        setAccusedSentList([]);
        setAccusedNotSentList([
          {
            id: "acc-unk-1",
            name: "Unknown Accused Persons",
            reason:
              formType === "UNTRACED"
                ? "Untraced despite extensive search and surveillance."
                : "No specific accused named.",
          },
        ]);
      }

      // Default Investigation Findings
      if (formType === "CHARGESHEET") {
        setInvestigationSummary(
          `Investigation conducted in FIR No. ${activeFir.firNumber} under ${activeFir.actsAndSections}. ` +
            `The crime scene at ${activeFir.incidentPlace} was inspected and site plan was prepared. ` +
            `Statements of the complainant and eye-witnesses were recorded under Section 180 BNSS. ` +
            `Documentary and digital evidence including CCTV footage and CDR logs were seized under Section 105 BNSS. ` +
            `The recovered property was verified by the complainant. ` +
            `Sufficient prima facie oral, material, and documentary evidence has emerged proving offences under ${activeFir.actsAndSections} against the accused person(s). ` +
            `Accordingly, this Final Police Report / Chargesheet is respectfully submitted before the Hon'ble Court with the prayer that the accused may be summoned and tried according to law.`
        );
      } else if (formType === "CLOSURE") {
        setInvestigationSummary(
          `Investigation conducted in FIR No. ${activeFir.firNumber} under ${activeFir.actsAndSections}. ` +
            `Detailed statements were recorded and accounts/documents were verified. ` +
            `During investigation, it was established that the matter pertains to a civil business dispute with no criminal intent or cognizable breach of trust. ` +
            `No offence under ${activeFir.actsAndSections} is made out. ` +
            `Hence, it is respectfully recommended that this Closure Report (Form 24.5(3)) may kindly be accepted by the Hon'ble Court.`
        );
      } else if (formType === "UNTRACED") {
        setInvestigationSummary(
          `Investigation conducted in FIR No. ${activeFir.firNumber} under ${activeFir.actsAndSections}. ` +
            `All possible leads, nearby CCTV recordings, and known suspects were verified. ` +
            `In spite of strenuous efforts and wide inquiries, the identity of the culprits and the stolen property could not be traced. ` +
            `Therefore, this Untraced Report (Form 24.5(4)) is submitted before the Hon'ble Court with the request to accept the same with leave to reopen as and when fresh clues arise.`
        );
      } else {
        setInvestigationSummary(
          `Investigation conducted in FIR No. ${activeFir.firNumber}. The allegations were found to be completely fabricated arising out of prior enmity. ` +
            `It is recommended that the FIR be cancelled and appropriate proceedings under Section 217 BNSS be initiated.`
        );
      }

      setIsSubmitted(
        activeFir.finalFormType === formType ||
          activeFir.status === "CHARGESHEET_FILED" ||
          activeFir.status === "CLOSURE_REPORT_FILED"
      );
    }
  }, [activeFir, formType]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const text = `POLICE REPORT UNDER SECTION 193 BNSS, 2023 (${FINAL_FORM_CONFIGS[formType].policeFormNo})
${courtName}
Police Station: ${policeStation}, District: ${district}
FIR No. & Date: ${firNumberAndDate}
Acts & Sections: ${firActsAndSections}
Report Serial No.: ${reportNumber}
Dispatch Date: ${reportDate}
Nature of Report: ${FINAL_FORM_CONFIGS[formType].label} (${FINAL_FORM_CONFIGS[formType].titleHindi})
Complainant / Informant: ${complainantName} s/o ${complainantFather}, ${complainantAddress}, Contact: ${complainantPhone}
Property Recovered / Seized: ${propertyRecovered}
Investigation Summary:
${investigationSummary}
Investigating Officer: ${investigatingOfficer} (${ioRank}, Belt No: ${ioBelt})
Forwarded by SHO: ${shoName} (PS ${policeStation}, Distt ${district})`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitFinalForm = () => {
    if (!activeFir) return;

    firService.submitFinalForm(
      activeFir.id,
      formType,
      courtName,
      `${investigatingOfficer} (${ioRank})`,
      investigationSummary
    );

    setIsSubmitted(true);
    setSubmitMessage(
      `Final Report (${formType}) successfully submitted and registered in FIR record! CCTNS Status: Pending Judicial Acceptance.`
    );
    setTimeout(() => setSubmitMessage(""), 5000);
  };

  // Accused Sent Table Actions
  const handleAddAccusedSent = () => {
    const newEntry: AccusedTrialEntry = {
      id: `acc-sent-${Date.now()}`,
      name: "",
      fatherName: "",
      address: "",
      status: "ON_BAIL",
      bailBondDetails: "Bail bond furnished.",
    };
    setAccusedSentList((prev) => [...prev, newEntry]);
  };

  const handleUpdateAccusedSent = (id: string, field: keyof AccusedTrialEntry, val: any) => {
    setAccusedSentList((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, [field]: val } : acc))
    );
  };

  const handleDeleteAccusedSent = (id: string) => {
    setAccusedSentList((prev) => prev.filter((acc) => acc.id !== id));
  };

  // Accused Not Sent Table Actions
  const handleAddAccusedNotSent = () => {
    const newEntry = {
      id: `acc-notsent-${Date.now()}`,
      name: "",
      reason: "No prima facie evidence found during investigation.",
    };
    setAccusedNotSentList((prev) => [...prev, newEntry]);
  };

  const handleUpdateAccusedNotSent = (id: string, field: "name" | "reason", val: string) => {
    setAccusedNotSentList((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, [field]: val } : acc))
    );
  };

  const handleDeleteAccusedNotSent = (id: string) => {
    setAccusedNotSentList((prev) => prev.filter((acc) => acc.id !== id));
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Workspace Navigation Tabs */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Header and Controls */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Final Police Report (Section 193 BNSS)
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  {FINAL_FORM_CONFIGS[formType].policeFormNo} • {FINAL_FORM_CONFIGS[formType].bnssSection}
                </span>
                {isSubmitted && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Submitted to Court
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Statutory Police Report under Section 193 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 • Direct On-Page Editable Proforma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs font-semibold gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Proforma"}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-xs font-semibold gap-1.5 text-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Final Form</span>
            </Button>

            <Button
              size="sm"
              onClick={handleSubmitFinalForm}
              className="text-xs font-bold gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit & Update FIR</span>
            </Button>
          </div>
        </div>

        {submitMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        )}

        {/* Selection Strip: Active FIR & Simple Final Form Category Dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select FIR Record *
            </label>
            <select
              value={selectedFirId}
              onChange={(e) => setSelectedFirId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-bold"
            >
              {firs.map((fir) => (
                <option key={fir.id} value={fir.id}>
                  {fir.firNumber} — {fir.categoryDisplay || fir.category} ({fir.status})
                </option>
              ))}
            </select>
            {activeFir && (
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span>PS: <strong>{activeFir.policeStation}</strong></span>
                <span>•</span>
                <span>Date: <strong>{activeFir.firDate}</strong></span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">{activeFir.actsAndSections}</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Final Form Category u/s 193 BNSS *
            </label>
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as FinalFormType)}
              className="w-full text-xs font-bold px-3 py-2 bg-emerald-50/60 border border-emerald-300 rounded-lg text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {(Object.keys(FINAL_FORM_CONFIGS) as FinalFormType[]).map((type) => {
                const conf = FINAL_FORM_CONFIGS[type];
                return (
                  <option key={type} value={type}>
                    {conf.label} ({conf.titleHindi}) — {conf.policeFormNo}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              {FINAL_FORM_CONFIGS[formType].description}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #fir-printable-report,
          #fir-printable-report * {
            visibility: visible;
          }
          #fir-printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Statutory Proforma Canvas (Fully Directly Editable In-Place) */}
      <div className="flex justify-center">
        <div
          id="fir-printable-report"
          className="w-full max-w-4xl bg-white p-6 sm:p-10 rounded-2xl border-2 border-slate-300 shadow-md font-serif text-slate-900 leading-normal"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4 space-y-1">
            <div className="flex justify-center mb-1">
              <Shield className="w-9 h-9 text-slate-800" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              HARYANA POLICE DEPARTMENT
            </h2>
            <div className="flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 flex-wrap">
              <span>POLICE STATION:</span>
              <input
                type="text"
                value={policeStation}
                onChange={(e) => setPoliceStation(e.target.value)}
                className="font-bold text-slate-900 uppercase bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 py-0.5 outline-none text-center"
                placeholder="POLICE STATION"
              />
              <span>, DISTRICT</span>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="font-bold text-slate-900 uppercase bg-transparent hover:bg-slate-100 focus:bg-white border-b border-dotted border-slate-700 px-1 py-0.5 outline-none text-center"
                placeholder="DISTRICT"
              />
            </div>
            <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 border border-slate-400 text-xs font-bold font-sans rounded">
              {FINAL_FORM_CONFIGS[formType].policeFormNo} • {FINAL_FORM_CONFIGS[formType].bnssSection}
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 mt-1">
              POLICE REPORT UNDER SECTION 193 BNSS, 2023
            </h1>
            <p className="text-xs font-bold text-slate-800 italic">
              ({FINAL_FORM_CONFIGS[formType].titleHindi} / {FINAL_FORM_CONFIGS[formType].label})
            </p>
          </div>

          {/* Court Heading (Directly Editable) */}
          <div className="text-xs font-bold mb-3">
            <input
              type="text"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              className="w-full font-bold underline uppercase text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-0.5 outline-none text-xs"
              placeholder="In the Court of Judicial Magistrate..."
            />
          </div>

          {/* Key Reference Table (Directly Editable) */}
          <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4 font-sans">
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50 w-1/4">
                  FIR No. &amp; Date:
                </td>
                <td className="border-r border-slate-800 p-1.5 font-mono font-bold w-1/4">
                  <input
                    type="text"
                    value={firNumberAndDate}
                    onChange={(e) => setFirNumberAndDate(e.target.value)}
                    className="w-full font-mono font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs"
                    placeholder="FIR/0014/2026 dt 28-03-2026"
                  />
                </td>
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50 w-1/4">
                  Report Serial No.:
                </td>
                <td className="p-1.5 font-mono font-bold w-1/4">
                  <input
                    type="text"
                    value={reportNumber}
                    onChange={(e) => setReportNumber(e.target.value)}
                    className="w-full font-mono font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs"
                    placeholder="CS/2026/001"
                  />
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">
                  Acts &amp; Sections:
                </td>
                <td className="p-1.5 font-bold text-emerald-900" colSpan={3}>
                  <input
                    type="text"
                    value={firActsAndSections}
                    onChange={(e) => setFirActsAndSections(e.target.value)}
                    className="w-full font-bold text-emerald-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs"
                    placeholder="Sections of Law..."
                  />
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">
                  Complainant / Informant:
                </td>
                <td className="border-r border-slate-800 p-1.5" colSpan={2}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={complainantName}
                        onChange={(e) => setComplainantName(e.target.value)}
                        className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs w-1/2"
                        placeholder="Complainant Name"
                      />
                      <span className="text-slate-600">s/o, w/o:</span>
                      <input
                        type="text"
                        value={complainantFather}
                        onChange={(e) => setComplainantFather(e.target.value)}
                        className="font-medium text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs flex-1"
                        placeholder="Father/Spouse"
                      />
                    </div>
                    <input
                      type="text"
                      value={complainantAddress}
                      onChange={(e) => setComplainantAddress(e.target.value)}
                      className="w-full text-slate-600 text-[10px] bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none"
                      placeholder="Address of Complainant"
                    />
                  </div>
                </td>
                <td className="p-1.5">
                  <span className="text-[10px] text-slate-600 block">Contact:</span>
                  <input
                    type="text"
                    value={complainantPhone}
                    onChange={(e) => setComplainantPhone(e.target.value)}
                    className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs w-full"
                    placeholder="Phone number"
                  />
                </td>
              </tr>
              <tr>
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">Dispatch Date:</td>
                <td className="border-r border-slate-800 p-1.5">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs font-semibold"
                  />
                </td>
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">Nature of Report:</td>
                <td className="p-2 font-bold text-slate-900">
                  {FINAL_FORM_CONFIGS[formType].label} ({FINAL_FORM_CONFIGS[formType].policeFormNo})
                </td>
              </tr>
            </tbody>
          </table>

          {/* 1. Accused Persons Table (Directly Editable with Add / Delete) */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider font-sans text-slate-800">
                1. Particulars of Accused Persons:
              </h4>
              <div className="no-print">
                {formType === "CHARGESHEET" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAccusedSent}
                    className="text-[11px] h-7 px-2 font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Accused Row</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAccusedNotSent}
                    className="text-[11px] h-7 px-2 font-bold text-emerald-800 border-emerald-300 hover:bg-emerald-50 cursor-pointer gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Suspect Row</span>
                  </Button>
                )}
              </div>
            </div>

            {formType === "CHARGESHEET" ? (
              <div className="space-y-2">
                <p className="text-[11px] font-sans text-slate-600 italic">
                  (A) Accused Persons Sent Up for Trial:
                </p>
                <table className="w-full border-collapse border border-slate-800 text-[10px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800">
                      <th className="border-r border-slate-800 p-1.5 text-center w-10">Sr.</th>
                      <th className="border-r border-slate-800 p-1.5 text-left w-2/5">Name &amp; Particulars</th>
                      <th className="border-r border-slate-800 p-1.5 text-left w-1/4">Custody / Bail Status</th>
                      <th className="border-r border-slate-800 p-1.5 text-left">Bail / Bond Particulars</th>
                      <th className="p-1 text-center w-10 no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {accusedSentList.length > 0 ? (
                      accusedSentList.map((acc, i) => (
                        <tr key={acc.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                          <td className="border-r border-slate-800 p-1.5 font-bold text-center">{i + 1}</td>
                          <td className="border-r border-slate-800 p-1.5 space-y-1">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={acc.name}
                                onChange={(e) => handleUpdateAccusedSent(acc.id, "name", e.target.value)}
                                className="font-bold text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none w-1/2"
                                placeholder="Accused Name"
                              />
                              <span className="text-slate-500 text-[9px]">s/o:</span>
                              <input
                                type="text"
                                value={acc.fatherName}
                                onChange={(e) => handleUpdateAccusedSent(acc.id, "fatherName", e.target.value)}
                                className="text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none flex-1 text-[9px]"
                                placeholder="Father Name"
                              />
                            </div>
                            <input
                              type="text"
                              value={acc.address}
                              onChange={(e) => handleUpdateAccusedSent(acc.id, "address", e.target.value)}
                              className="w-full text-slate-600 text-[9px] bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none"
                              placeholder="Full Address"
                            />
                          </td>
                          <td className="border-r border-slate-800 p-1.5">
                            <select
                              value={acc.status}
                              onChange={(e) => handleUpdateAccusedSent(acc.id, "status", e.target.value as any)}
                              className="text-[9px] font-bold p-1 rounded border border-slate-300 bg-white"
                            >
                              <option value="ON_BAIL">On Bail (जमानत पर)</option>
                              <option value="IN_CUSTODY">In Judicial Custody (न्यायिक हिरासत)</option>
                              <option value="ABSCONDING">Absconding (फरार / उद्घोषित)</option>
                              <option value="NOT_ARRESTED">Not Arrested (गिरफ्तार नहीं)</option>
                            </select>
                          </td>
                          <td className="border-r border-slate-800 p-1.5">
                            <input
                              type="text"
                              value={acc.bailBondDetails || acc.jailDetails || ""}
                              onChange={(e) =>
                                handleUpdateAccusedSent(
                                  acc.id,
                                  acc.status === "IN_CUSTODY" ? "jailDetails" : "bailBondDetails",
                                  e.target.value
                                )
                              }
                              className="w-full text-[9px] text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none"
                              placeholder="Bail bond / Jail details..."
                            />
                          </td>
                          <td className="p-1 text-center no-print">
                            <button
                              type="button"
                              onClick={() => handleDeleteAccusedSent(acc.id)}
                              className="text-slate-400 hover:text-red-700 p-1 cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-3 h-3 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-slate-500 italic">
                          No accused sent up for trial. Click &quot;Add Accused Row&quot; above to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[11px] font-sans text-slate-600 italic">
                  (B) Accused Persons Not Sent Up for Trial:
                </p>
                <table className="w-full border-collapse border border-slate-800 text-[10px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800">
                      <th className="border-r border-slate-800 p-1.5 text-center w-12">Sr.</th>
                      <th className="border-r border-slate-800 p-1.5 text-left w-1/3">Name of Suspect / Accused</th>
                      <th className="border-r border-slate-800 p-1.5 text-left">Reasons for Not Sending for Trial</th>
                      <th className="p-1 text-center w-10 no-print"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {accusedNotSentList.map((acc, i) => (
                      <tr key={acc.id} className="border-b border-slate-300 hover:bg-slate-50/50">
                        <td className="border-r border-slate-800 p-1.5 font-bold text-center">{i + 1}</td>
                        <td className="border-r border-slate-800 p-1.5">
                          <input
                            type="text"
                            value={acc.name}
                            onChange={(e) => handleUpdateAccusedNotSent(acc.id, "name", e.target.value)}
                            className="w-full font-bold text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs"
                            placeholder="Suspect / Accused Name"
                          />
                        </td>
                        <td className="border-r border-slate-800 p-1.5">
                          <input
                            type="text"
                            value={acc.reason}
                            onChange={(e) => handleUpdateAccusedNotSent(acc.id, "reason", e.target.value)}
                            className="w-full text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 py-0.5 outline-none text-xs"
                            placeholder="Reason for not sending for trial..."
                          />
                        </td>
                        <td className="p-1 text-center no-print">
                          <button
                            type="button"
                            onClick={() => handleDeleteAccusedNotSent(acc.id)}
                            className="text-slate-400 hover:text-red-700 p-1 cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3 h-3 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Details of Property Recovered / Seized (Directly Editable) */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1 font-sans text-slate-800">
              2. Details of Property Recovered / Seized:
            </h4>
            <div className="p-1 border border-slate-800 rounded bg-slate-50">
              <textarea
                rows={2}
                value={propertyRecovered}
                onChange={(e) => setPropertyRecovered(e.target.value)}
                className="w-full bg-transparent hover:bg-white focus:bg-white text-[11px] font-sans p-1.5 rounded outline-none border border-transparent focus:border-emerald-500 leading-relaxed text-slate-950 resize-y"
                placeholder="Recovered property details / Malkhana deposit particulars..."
              />
            </div>
          </div>

          {/* 3. Brief Facts & Findings of Investigation (Directly Editable) */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1 font-sans text-slate-800">
              3. Brief Facts and Grounds of Investigation:
            </h4>
            <div className="p-1 border border-slate-800 rounded">
              <textarea
                rows={8}
                value={investigationSummary}
                onChange={(e) => setInvestigationSummary(e.target.value)}
                className="w-full bg-transparent hover:bg-slate-50 focus:bg-white text-xs leading-relaxed text-justify p-2 rounded outline-none border border-transparent focus:border-emerald-500 text-slate-950 resize-y"
                placeholder="Narrative of investigation, statement recordings under Sec 180 BNSS, technical evidence seized u/s 105 BNSS, and final conclusion..."
              />
            </div>
          </div>

          {/* 4. Signatures and Endorsements (Directly Editable) */}
          <div className="mt-8 pt-4 border-t border-slate-400 grid grid-cols-2 gap-8 text-center text-xs font-sans">
            <div className="space-y-1">
              <div className="h-10 flex items-end justify-center">
                <span className="font-script text-base text-slate-500 italic">Signature of IO</span>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <input
                  type="text"
                  value={investigatingOfficer}
                  onChange={(e) => setInvestigatingOfficer(e.target.value)}
                  className="font-bold text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 outline-none w-full"
                  placeholder="IO Name"
                />
              </div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-600">
                <input
                  type="text"
                  value={ioRank}
                  onChange={(e) => setIoRank(e.target.value)}
                  className="text-center bg-transparent border-b border-dotted border-slate-400 outline-none w-24"
                  placeholder="Rank"
                />
                <span>• Belt:</span>
                <input
                  type="text"
                  value={ioBelt}
                  onChange={(e) => setIoBelt(e.target.value)}
                  className="text-center bg-transparent border-b border-dotted border-slate-400 outline-none w-20"
                  placeholder="Belt No."
                />
              </div>
              <p className="text-[10px] text-slate-600">
                PS {policeStation}, Distt {district}
              </p>
            </div>

            <div className="space-y-1">
              <div className="h-10 flex items-end justify-center">
                <span className="font-script text-base text-slate-500 italic">Forwarded by SHO</span>
              </div>
              <div className="border-t border-slate-800 pt-1">
                <input
                  type="text"
                  value={shoName}
                  onChange={(e) => setShoName(e.target.value)}
                  className="font-bold text-center text-slate-950 bg-transparent hover:bg-slate-100 focus:bg-white border border-transparent focus:border-emerald-500 rounded px-1 outline-none w-full"
                  placeholder="SHO Name"
                />
              </div>
              <p className="text-[10px] text-slate-600">Officer In-Charge (SHO)</p>
              <p className="text-[10px] text-slate-600">
                PS {policeStation}, Distt {district}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FIRFinalFormPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-bold">
          Loading FIR Final Form (Sec 193 BNSS)...
        </div>
      }
    >
      <FIRFinalFormContent />
    </Suspense>
  );
}
