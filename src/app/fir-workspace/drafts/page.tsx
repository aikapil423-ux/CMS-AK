"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Scale,
  Printer,
  Copy,
  Check,
  Shield,
  Download,
  FileCheck2,
  Building,
  User,
  Phone,
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  FileText,
  BadgeAlert,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem, AccusedPerson } from "@/types";
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

  // Form Fields
  const [courtName, setCourtName] = useState("In the Court of Chief Judicial Magistrate, Gurugram");
  const [reportNumber, setReportNumber] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [policeStation, setPoliceStation] = useState("Sector 29 Police Station");
  const [district, setDistrict] = useState("Gurugram");

  // Complainant Details
  const [complainantName, setComplainantName] = useState("");
  const [complainantFather, setComplainantFather] = useState("");
  const [complainantAddress, setComplainantAddress] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");

  // Accused Persons Sent for Trial
  const [accusedSentList, setAccusedSentList] = useState<AccusedTrialEntry[]>([]);
  // Accused Persons Not Sent for Trial
  const [accusedNotSentList, setAccusedNotSentList] = useState<
    { id: string; name: string; reason: string }[]
  >([]);

  // Property Details
  const [propertyRecovered, setPropertyRecovered] = useState("");

  // IO and Findings
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
              jailDetails: idx !== 0 ? "Judicial Custody, District Jail Bhondsi." : undefined,
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
    if (!activeFir) return;
    const text = `POLICE REPORT UNDER SECTION 193 BNSS, 2023 (${FINAL_FORM_CONFIGS[formType].policeFormNo})
${courtName}
Police Station: ${policeStation}, District: ${district}
FIR No.: ${activeFir.firNumber} Date: ${activeFir.firDate}
Acts & Sections: ${activeFir.actsAndSections}
Complainant: ${complainantName} s/o ${complainantFather}
Investigation Summary:
${investigationSummary}
IO: ${investigatingOfficer} (${ioRank}, ${ioBelt})
SHO: ${shoName}`;

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

  return (
    <div className="space-y-6">
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
                  Form 24.5 / Sec 193 BNSS
                </span>
                {isSubmitted && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Submitted to Court
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Statutory Police Report under Section 193 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 for submission before Judicial Magistrate
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

        {/* Selection Strip: Active FIR & Final Form Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Select FIR Record
            </label>
            <div className="relative">
              <select
                value={selectedFirId}
                onChange={(e) => setSelectedFirId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                {firs.map((fir) => (
                  <option key={fir.id} value={fir.id}>
                    {fir.firNumber} — {fir.categoryDisplay || fir.category} ({fir.status})
                  </option>
                ))}
              </select>
            </div>
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
              Final Form Category u/s 193 BNSS
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(Object.keys(FINAL_FORM_CONFIGS) as FinalFormType[]).map((type) => {
                const conf = FINAL_FORM_CONFIGS[type];
                const isSelected = formType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormType(type)}
                    className={`px-2.5 py-2 rounded-lg text-left transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-2xs font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
                    }`}
                  >
                    <div className="text-[11px] truncate leading-tight">{conf.label}</div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">{conf.policeFormNo}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Editor Panel (no-print) */}
        <div className="no-print lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Report Parameters</span>
            </h2>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-600">
              {FINAL_FORM_CONFIGS[formType].policeFormNo}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Jurisdictional Court</label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-medium text-xs focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Report No.</label>
                <input
                  type="text"
                  value={reportNumber}
                  onChange={(e) => setReportNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Report Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Police Station</label>
                <input
                  type="text"
                  value={policeStation}
                  onChange={(e) => setPoliceStation(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Complainant / Informant</label>
              <input
                type="text"
                value={complainantName}
                onChange={(e) => setComplainantName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs mb-1"
                placeholder="Full Name"
              />
              <input
                type="text"
                value={complainantAddress}
                onChange={(e) => setComplainantAddress(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
                placeholder="Address and Mobile"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Property Recovered / Seized
              </label>
              <textarea
                rows={2}
                value={propertyRecovered}
                onChange={(e) => setPropertyRecovered(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs leading-relaxed"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Summary of Investigation & Findings
              </label>
              <textarea
                rows={5}
                value={investigationSummary}
                onChange={(e) => setInvestigationSummary(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs leading-relaxed"
                placeholder="Brief narrative of investigation, statement recordings, technical evidence, and conclusion."
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Investigating Officer</label>
                <input
                  type="text"
                  value={investigatingOfficer}
                  onChange={(e) => setInvestigatingOfficer(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rank & Belt No.</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={ioRank}
                    onChange={(e) => setIoRank(e.target.value)}
                    className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-md text-xs"
                  />
                  <input
                    type="text"
                    value={ioBelt}
                    onChange={(e) => setIoBelt(e.target.value)}
                    className="w-1/2 px-2 py-1.5 border border-slate-200 rounded-md text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Forwarding SHO</label>
              <input
                type="text"
                value={shoName}
                onChange={(e) => setShoName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right: Statutory Printed Proforma (Live Document Preview) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border-2 border-slate-300 shadow-md font-serif text-slate-900 leading-normal printable-document">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <div className="flex justify-center mb-1">
              <Shield className="w-9 h-9 text-slate-800" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              HARYANA POLICE DEPARTMENT
            </h2>
            <h3 className="text-xs font-semibold text-slate-700">
              POLICE STATION: {policeStation.toUpperCase()}, DISTRICT {district.toUpperCase()}
            </h3>
            <div className="inline-block mt-2 px-3 py-1 bg-slate-100 border border-slate-400 text-xs font-bold font-sans rounded">
              {FINAL_FORM_CONFIGS[formType].policeFormNo} • {FINAL_FORM_CONFIGS[formType].bnssSection}
            </div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950 mt-2">
              POLICE REPORT UNDER SECTION 193 BNSS, 2023
            </h1>
            <p className="text-xs font-bold text-slate-800 italic">
              ({FINAL_FORM_CONFIGS[formType].titleHindi} / {FINAL_FORM_CONFIGS[formType].label})
            </p>
          </div>

          {/* Court Heading */}
          <div className="text-xs font-bold mb-3">
            <p className="underline uppercase">{courtName}</p>
          </div>

          {/* Key Reference Table */}
          <table className="w-full border-collapse border border-slate-800 text-[11px] mb-4 font-sans">
            <tbody>
              <tr className="border-b border-slate-800">
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50 w-1/4">FIR No. & Date:</td>
                <td className="border-r border-slate-800 p-2 font-mono font-bold w-1/4">
                  {activeFir?.firNumber || "FIR/0014/2026"} dt {activeFir?.firDate || "28-03-2026"}
                </td>
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50 w-1/4">Report Serial No.:</td>
                <td className="p-2 font-mono font-bold w-1/4">{reportNumber}</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">Acts & Sections:</td>
                <td className="p-2 font-bold text-emerald-900" colSpan={3}>
                  {activeFir?.actsAndSections || "Sec 303(2), 305 Bharatiya Nyaya Sanhita, 2023"}
                </td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">Complainant / Informant:</td>
                <td className="border-r border-slate-800 p-2" colSpan={2}>
                  <strong>{complainantName}</strong> s/o {complainantFather}
                  <br />
                  <span className="text-slate-600 text-[10px]">{complainantAddress}</span>
                </td>
                <td className="p-2">
                  <span className="text-[10px] text-slate-600 block">Contact:</span>
                  <strong>{complainantPhone}</strong>
                </td>
              </tr>
              <tr>
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">Dispatch Date:</td>
                <td className="border-r border-slate-800 p-2">{reportDate}</td>
                <td className="border-r border-slate-800 p-2 font-bold bg-slate-50">Nature of Report:</td>
                <td className="p-2 font-bold text-slate-900">{FINAL_FORM_CONFIGS[formType].label}</td>
              </tr>
            </tbody>
          </table>

          {/* Accused Persons Table */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1 font-sans text-slate-800">
              1. Particulars of Accused Persons:
            </h4>

            {formType === "CHARGESHEET" ? (
              <div className="space-y-2">
                <p className="text-[11px] font-sans text-slate-600 italic">
                  (A) Accused Persons Sent Up for Trial:
                </p>
                <table className="w-full border-collapse border border-slate-800 text-[10px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800">
                      <th className="border-r border-slate-800 p-1.5 text-left">Sr.</th>
                      <th className="border-r border-slate-800 p-1.5 text-left">Name & Particulars</th>
                      <th className="border-r border-slate-800 p-1.5 text-left">Custody / Bail Status</th>
                      <th className="p-1.5 text-left">Bail / Bond Particulars</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accusedSentList.length > 0 ? (
                      accusedSentList.map((acc, i) => (
                        <tr key={acc.id} className="border-b border-slate-300">
                          <td className="border-r border-slate-800 p-1.5 font-bold">{i + 1}</td>
                          <td className="border-r border-slate-800 p-1.5">
                            <strong>{acc.name}</strong> s/o {acc.fatherName}
                            <div className="text-slate-600 text-[9px]">{acc.address}</div>
                          </td>
                          <td className="border-r border-slate-800 p-1.5 font-semibold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] ${
                                acc.status === "IN_CUSTODY"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {acc.status === "IN_CUSTODY" ? "In Judicial Custody" : "On Bail"}
                            </span>
                          </td>
                          <td className="p-1.5 text-slate-700">
                            {acc.bailBondDetails || acc.jailDetails || "Bail bond submitted."}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-slate-500 italic">
                          No accused sent up for trial.
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
                      <th className="border-r border-slate-800 p-1.5 text-left w-12">Sr.</th>
                      <th className="border-r border-slate-800 p-1.5 text-left w-1/3">Name of Suspect / Accused</th>
                      <th className="p-1.5 text-left">Reasons for Not Sending for Trial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accusedNotSentList.map((acc, i) => (
                      <tr key={acc.id} className="border-b border-slate-300">
                        <td className="border-r border-slate-800 p-1.5 font-bold">{i + 1}</td>
                        <td className="border-r border-slate-800 p-1.5 font-semibold">{acc.name}</td>
                        <td className="p-1.5 text-slate-700">{acc.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Property Seized / Recovered */}
          <div className="mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1 font-sans text-slate-800">
              2. Details of Property Recovered / Seized:
            </h4>
            <div className="p-2 border border-slate-800 rounded bg-slate-50 text-[11px] font-sans">
              {propertyRecovered || "None"}
            </div>
          </div>

          {/* Brief Facts & Findings of Investigation */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1 font-sans text-slate-800">
              3. Brief Facts and Grounds of Investigation:
            </h4>
            <div className="p-3 border border-slate-800 rounded text-xs leading-relaxed text-justify whitespace-pre-line">
              {investigationSummary}
            </div>
          </div>

          {/* Signatures and Endorsements */}
          <div className="mt-8 pt-4 border-t border-slate-400 grid grid-cols-2 gap-8 text-center text-xs font-sans">
            <div>
              <div className="h-12 flex items-end justify-center">
                <span className="font-script text-base text-slate-600 italic">Signature of IO</span>
              </div>
              <p className="font-bold border-t border-slate-800 pt-1">{investigatingOfficer}</p>
              <p className="text-[10px] text-slate-600">
                {ioRank}, Belt No: {ioBelt}
              </p>
              <p className="text-[10px] text-slate-600">
                PS {policeStation}, Distt {district}
              </p>
            </div>

            <div>
              <div className="h-12 flex items-end justify-center">
                <span className="font-script text-base text-slate-600 italic">Forwarded by SHO</span>
              </div>
              <p className="font-bold border-t border-slate-800 pt-1">{shoName}</p>
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
