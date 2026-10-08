"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ScrollText,
  Printer,
  Copy,
  Check,
  Shield,
  FileText,
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
  Scale,
  Eye,
  X,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { firService } from "@/services/firService";
import { FIRItem, NoticeFormData } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";

export type FIRNoticeTemplateType =
  | "section_35_notice"
  | "section_179_witness"
  | "cdr_requisition"
  | "arrest_memo";

const TEMPLATE_CONFIG: Record<
  FIRNoticeTemplateType,
  { label: string; badge: string; subTitle: string; description: string }
> = {
  section_35_notice: {
    label: "Notice to Accused (Sec 35(3) BNSS)",
    badge: "Accused Notice",
    subTitle: "Notice of Appearance under Section 35(3) Bharatiya Nagarik Suraksha Sanhita, 2023",
    description: "Statutory notice directed to accused person where arrest is not immediately requisite.",
  },
  section_179_witness: {
    label: "Witness Attendance Order (Sec 179 BNSS)",
    badge: "Witness Order",
    subTitle: "Order requiring attendance of witness under Section 179 BNSS, 2023",
    description: "Police officer order requiring attendance of persons acquainted with circumstances of case.",
  },
  cdr_requisition: {
    label: "Telecom CDR / Tower Requisition",
    badge: "Digital Evidence",
    subTitle: "Official Requisition under Section 94 BNSS to Telecom Service Provider Nodal Officer",
    description: "Legal requisition for Call Detail Records, CAF, and tower location dump.",
  },
  arrest_memo: {
    label: "Arrest Memo (Form 26.8(1))",
    badge: "Custody Memo",
    subTitle: "Official Arrest & Jama Talashi Memo (PPR 26.8 / BNSS Section 36)",
    description: "Statutory 4-point memo recording date, time, place of arrest and intimation to family.",
  },
};

function FIRTemplatesContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>(firIdParam || "");
  const [selectedTemplate, setSelectedTemplate] = useState<FIRNoticeTemplateType>("section_35_notice");

  // Notice Form Fields
  const [dispatchNo, setDispatchNo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [policeStation, setPoliceStation] = useState("Sector 29 Police Station");
  const [district, setDistrict] = useState("Gurugram");
  const [noticeeName, setNoticeeName] = useState("");
  const [noticeeFather, setNoticeeFather] = useState("");
  const [noticeeAddress, setNoticeeAddress] = useState("");
  const [noticeePhone, setNoticeePhone] = useState("");
  const [appearanceDate, setAppearanceDate] = useState("");
  const [appearanceTime, setAppearanceTime] = useState("10:00 AM");
  const [investigatingOfficer, setInvestigatingOfficer] = useState(currentUser.name || "SI Neeraj Kumar");
  const [ioRank, setIoRank] = useState("Sub Inspector");
  const [ioBelt, setIoBelt] = useState("SI/6641");
  const [ioPhone, setIoPhone] = useState("9812300002");
  const [reasonAllegation, setReasonAllegation] = useState("");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const list = firService.getAllFirs();
    setFirs(list);
    if (!selectedFirId && list.length > 0) {
      setSelectedFirId(list[0].id);
    }
  }, []);

  const activeFir = firs.find((f) => f.id === selectedFirId || f.firNumber === selectedFirId);

  useEffect(() => {
    if (activeFir) {
      setPoliceStation(activeFir.policeStation);
      setDistrict(activeFir.district);
      if (activeFir.assignedIoName) {
        setInvestigatingOfficer(activeFir.assignedIoName);
        setIoRank(activeFir.assignedIoRank || "IO");
        setIoBelt(activeFir.assignedIoBeltNumber || "IO/—");
        setIoPhone(activeFir.assignedIoPhone || "—");
      }
      setReasonAllegation(
        `Investigation in FIR No. ${activeFir.firNumber} under ${activeFir.actsAndSections} regarding incident at ${activeFir.incidentPlace}.`
      );

      if (selectedTemplate === "section_35_notice" && activeFir.accusedList?.[0]) {
        const acc = activeFir.accusedList[0];
        setNoticeeName(acc.name);
        setNoticeeFather(acc.fatherName || "");
        setNoticeeAddress(acc.address || "");
        setNoticeePhone(acc.phone || "");
      } else if (selectedTemplate === "section_179_witness") {
        setNoticeeName(activeFir.complainantName);
        setNoticeeFather(activeFir.complainantFatherSpouse || "");
        setNoticeeAddress(activeFir.complainantAddress || "");
        setNoticeePhone(activeFir.complainantMobile || "");
      }
    }
  }, [activeFir, selectedTemplate]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    const element = document.getElementById("fir-printable-notice");
    if (element) {
      navigator.clipboard.writeText(element.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#0b192c] tracking-tight">
              Statutory Notice Generator (FIR Investigation)
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Statutory legal notices and memos under Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statutory Notice
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy Text"}
          </Button>
        </div>
      </div>

      {/* FIR Module Workspace Navigation */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* FIR Selector & Template Type Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Select Active FIR Case *
          </label>
          <select
            value={selectedFirId}
            onChange={(e) => setSelectedFirId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
          >
            {firs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.firNumber} — {f.actsAndSections.slice(0, 40)} ({f.complainantName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
            Select Notice / Memo Proforma *
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as any)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-purple-900"
          >
            {Object.entries(TEMPLATE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form Editor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-100 pb-2">
              Notice Particulars &amp; Recipient
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Dispatch No.</label>
                <input
                  type="text"
                  placeholder="e.g. 142/R-IO/Sec29"
                  value={dispatchNo}
                  onChange={(e) => setDispatchNo(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Date of Issue</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">
                Noticee / Recipient Name *
              </label>
              <input
                type="text"
                value={noticeeName}
                onChange={(e) => setNoticeeName(e.target.value)}
                placeholder="Full Name"
                className="w-full p-2 rounded-lg border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Father / Spouse Name</label>
              <input
                type="text"
                value={noticeeFather}
                onChange={(e) => setNoticeeFather(e.target.value)}
                placeholder="S/o or W/o"
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">Noticee Address</label>
              <textarea
                rows={2}
                value={noticeeAddress}
                onChange={(e) => setNoticeeAddress(e.target.value)}
                placeholder="Address of residence / shop"
                className="w-full p-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Appearance Date</label>
                <input
                  type="date"
                  value={appearanceDate}
                  onChange={(e) => setAppearanceDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Appearance Time</label>
                <input
                  type="text"
                  value={appearanceTime}
                  onChange={(e) => setAppearanceTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-600 block mb-1">
                Offence Allegation / Matter Summary
              </label>
              <textarea
                rows={3}
                value={reasonAllegation}
                onChange={(e) => setReasonAllegation(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-serif"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">IO Name</label>
                <input
                  type="text"
                  value={investigatingOfficer}
                  onChange={(e) => setInvestigatingOfficer(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">IO Rank &amp; Belt</label>
                <input
                  type="text"
                  value={`${ioRank} (${ioBelt})`}
                  onChange={(e) => setIoRank(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview Sheet */}
        <div className="lg:col-span-7">
          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #fir-printable-notice,
              #fir-printable-notice * {
                visibility: visible;
              }
              #fir-printable-notice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 30px;
                box-shadow: none !important;
                border: 2px solid #000 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          <div
            id="fir-printable-notice"
            className="bg-white border-2 border-slate-800 rounded-xl p-8 shadow-md font-serif text-slate-900 text-xs leading-relaxed max-w-2xl mx-auto"
          >
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1 font-sans">
              <div className="font-black text-sm uppercase tracking-widest text-slate-900">
                HARYANA POLICE
              </div>
              <div className="font-bold text-xs uppercase text-slate-700">
                OFFICE OF THE INVESTIGATING OFFICER • {policeStation.toUpperCase()}, {district.toUpperCase()}
              </div>
              <h2 className="font-black text-base uppercase text-purple-950 mt-1">
                {TEMPLATE_CONFIG[selectedTemplate].subTitle}
              </h2>
            </div>

            {/* Reference Numbers */}
            <div className="flex justify-between items-center py-3 border-b border-slate-300 font-sans text-[11px]">
              <div>
                <strong>Dispatch No.:</strong>{" "}
                <span className="font-mono">{dispatchNo || "— / IO / FIR"}</span>
              </div>
              <div>
                <strong>Dated:</strong> <span>{issueDate}</span>
              </div>
            </div>

            {/* Addressed To */}
            <div className="py-4 space-y-1 font-sans">
              <div className="font-bold">To:</div>
              <div className="pl-4 space-y-0.5">
                <div className="font-black text-sm">{noticeeName || "[Name of Noticee / Recipient]"}</div>
                {noticeeFather && <div>S/o, W/o: {noticeeFather}</div>}
                <div>Address: {noticeeAddress || "[Address of Residence / Place of Business]"}</div>
                {noticeePhone && <div>Mobile: {noticeePhone}</div>}
              </div>
            </div>

            {/* Matter Reference */}
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded font-sans text-[11px] mb-4">
              <strong>Matter:</strong>{" "}
              <span>
                Investigation in Case FIR No. <strong>{activeFir?.firNumber || "—"}</strong> dated{" "}
                <strong>{activeFir?.firDate || "—"}</strong> u/s{" "}
                <strong>{activeFir?.actsAndSections || "applicable BNS sections"}</strong>, Police Station{" "}
                <strong>{policeStation}</strong>.
              </span>
            </div>

            {/* Notice Body */}
            <div className="space-y-3 text-justify leading-relaxed font-serif text-[12px]">
              {selectedTemplate === "section_35_notice" ? (
                <>
                  <p>
                    Whereas, in terms of Section 35(3) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, you are hereby informed that reasonable suspicion/allegation has been established against you in connection with the above referenced cognizable offence registered at this Police Station.
                  </p>
                  <p>
                    You are hereby directed to appear in person before the undersigned Investigating Officer at Police Station {policeStation} on <strong>{appearanceDate || "[Date of Appearance]"}</strong> at <strong>{appearanceTime}</strong> to join the investigation, submit your lawful explanation, and cooperate in the investigation of the case.
                  </p>
                  <p>
                    Take notice that failure to comply with the terms of this notice will make you liable for arrest under Section 35(6) BNSS, 2023, upon the order of the competent Court having jurisdiction.
                  </p>
                </>
              ) : selectedTemplate === "section_179_witness" ? (
                <>
                  <p>
                    Whereas, from information received in the investigation of the above stated case, it appears that you are acquainted with the facts and circumstances of the alleged offence.
                  </p>
                  <p>
                    You are hereby directed under Section 179 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, to appear before the undersigned at Police Station {policeStation} on <strong>{appearanceDate || "[Date of Appearance]"}</strong> at <strong>{appearanceTime}</strong> for the purpose of answering questions relating to the case and recording your statement under Section 180 BNSS.
                  </p>
                </>
              ) : selectedTemplate === "cdr_requisition" ? (
                <>
                  <p>
                    Subject: Requisition for Call Detail Records (CDR) with Tower Location under Section 94 BNSS.
                  </p>
                  <p>
                    It is certified that the subscriber records and tower dump of the target mobile communication are urgently required for the investigation of a heinous/cognizable criminal offence registered vide FIR No. {activeFir?.firNumber}.
                  </p>
                  <p>
                    Please provide the CDR, SDR, CAF, and cell ID chart for the requested period in soft copy under Section 63 Bharatiya Sakshya Adhiniyam, 2023 (Certificate of Electronic Record).
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Certified that the accused named above was formally arrested in connection with FIR No. {activeFir?.firNumber} on this day at {appearanceTime} hrs from {activeFir?.incidentPlace}.
                  </p>
                  <p>
                    The grounds of arrest and rights to free legal aid were communicated. An intimation of arrest has been given to the relative/friend as mandated under Section 36 BNSS, 2023.
                  </p>
                </>
              )}
            </div>

            {/* Signature & Seal */}
            <div className="pt-10 flex justify-between items-end font-sans text-[11px]">
              <div>
                <p>Dated: {issueDate}</p>
                <p>Place: {policeStation}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="w-44 border-b border-slate-800 ml-auto mb-1"></div>
                <div className="font-bold text-slate-900">{investigatingOfficer}</div>
                <div className="text-slate-600">{ioRank} • Belt No. {ioBelt}</div>
                <div className="text-slate-500 font-semibold">Investigating Officer (IO)</div>
                <div className="text-slate-500">{policeStation}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FIRTemplatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading statutory notice generator...</div>}>
      <FIRTemplatesContent />
    </Suspense>
  );
}
