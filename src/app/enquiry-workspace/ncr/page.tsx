"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileText,
  BadgeAlert,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Shield,
  Download,
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sliders,
  Table,
  UserCheck,
  Loader2,
  Eye,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem } from "@/types";
import { EnquiryWorkspaceNav } from "@/components/enquiry-workspace/EnquiryWorkspaceNav";
import { ComplaintAnalysisHeader } from "@/components/enquiry-workspace/ComplaintAnalysisHeader";
import { ComplaintAnalysisReport } from "@/services/complaintDocumentAnalysisService";
import {
  generateHaryanaPoliceProformaHtml,
  HaryanaPoliceProformaData,
} from "@/utils/documentHtmlGenerators";

export interface NcrRowState {
  id: string;
  label: string;
  cells: string[];
}

function NcrWorkspaceContent() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintIdParam = searchParams.get("complaintId");

  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [analysisReport, setAnalysisReport] = useState<ComplaintAnalysisReport | null>(null);

  // Proforma State
  const [ncrNumber, setNcrNumber] = useState<string>("NCR-2026-018");
  const [gdEntryNumber, setGdEntryNumber] = useState<string>("GD No. 18 / 11:30 AM");
  const [headerLeft, setHeaderLeft] = useState<string>("POLICE DEPARTMENT (STATION GENERAL DIARY)");
  const [headerRight, setHeaderRight] = useState<string>("DISTRICT PANIPAT");
  const [subHeaderLeft, setSubHeaderLeft] = useState<string>("Respected Sir,");
  const [title, setTitle] = useState<string>(
    "FIRST INFORMATION OF A NON-COGNIZABLE OFFENCE (NCR) U/S 174 BNSS, 2023"
  );
  const [subTitle, setSubTitle] = useState<string>("Police Station General Diary Roznamcha Entry No. 018");
  const [rows, setRows] = useState<NcrRowState[]>([]);
  const [closingLine, setClosingLine] = useState<string>(
    "Notice under Section 174(2) BNSS issued to complainant regarding remedy before the Judicial Magistrate. Report entered in General Diary and submitted for supervisory perusal."
  );
  const [officerName, setOfficerName] = useState<string>("(Surender Pal)");
  const [officerRank, setOfficerRank] = useState<string>("Sub-Inspector / Enquiry Officer");
  const [officerLocation, setOfficerLocation] = useState<string>("Police Station City");
  const [reportDate, setReportDate] = useState<string>(
    `Dated: ${new Date().toLocaleDateString("en-GB").replace(/\//g, ".")}`
  );

  // Appearance Controls
  const [borderStyle, setBorderStyle] = useState<"solid" | "double" | "light" | "none">("solid");
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);

  // Feedback states
  const [copied, setCopied] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("en-IN");
  const documentRef = useRef<HTMLDivElement>(null);

  // Populate NCR Proforma from Analysis
  const populateFromAnalysis = (comp: ComplaintItem, report: ComplaintAnalysisReport) => {
    const dName = (comp.district || currentUser.district || "PANIPAT").toUpperCase();
    const psName = comp.policeStation || currentUser.stationName || "Police Station City";
    const dateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, ".");
    const genNcrNum = `NCR-${dName.slice(0, 3)}-${comp.complaintNumber.split("-").pop() || "018"}`;

    setNcrNumber(genNcrNum);
    setGdEntryNumber(`GD Rapat No. 19 / ${dateStr}`);
    setHeaderLeft(`POLICE DEPARTMENT (${psName.toUpperCase()})`);
    setHeaderRight(`DISTRICT ${dName}`);
    setTitle(`FIRST INFORMATION OF A NON-COGNIZABLE OFFENCE (NCR) U/S 174 BNSS, 2023`);
    setSubTitle(`Police Station General Diary Reference: GD Rapat No. 19 Dated ${dateStr} • Ref: ${comp.complaintNumber}`);

    // Build Complainant Info
    const compPerson = report.identifiedPersons.find((p) => p.role === "Complainant");
    const complainantInfo = compPerson
      ? `${compPerson.name}${compPerson.fatherOrSpouse ? ` s/o / w/o ${compPerson.fatherOrSpouse}` : ""}${compPerson.address ? `, r/o ${compPerson.address}` : ""}${compPerson.phone ? ` (Mob: ${compPerson.phone})` : ""}`
      : comp.complainantName
      ? `${comp.complainantName}${comp.complainantMobile ? ` (Mob: ${comp.complainantMobile})` : ""}${comp.complainantAddress ? `, r/o ${comp.complainantAddress}` : ""}`
      : "[Complainant Details Missing from Docket]";

    // Build Accused Info
    const accusedPersons = report.identifiedPersons.filter((p) => p.role === "Respondent / Accused");
    const accusedInfo = accusedPersons.length > 0
      ? accusedPersons
          .map((a) => `${a.name}${a.fatherOrSpouse ? ` s/o ${a.fatherOrSpouse}` : ""}${a.address ? `, r/o ${a.address}` : ""}${a.phone ? ` (Mob: ${a.phone})` : ""}`)
          .join("; ")
      : comp.accusedList && comp.accusedList.length > 0
      ? comp.accusedList.map((a) => `${a.name}${a.fatherName ? ` s/o ${a.fatherName}` : ""}${a.address ? `, r/o ${a.address}` : ""}`).join("; ")
      : "[Opposite Party / Accused Details Missing from Docket]";

    // Build Substance of Non-Cognizable Occurrence
    const substance = comp.incidentDetails || comp.complaintDescription || "Verbal altercation and mutual non-cognizable grievance.";

    // Build Findings & GD Entry text
    const findingsText = `1. Preliminary enquiry into Complaint No. ${comp.complaintNumber} conducted by the undersigned officer at ${psName}.\n2. Examination of statements and spot enquiry indicates commission of non-cognizable offence without disclosure of any cognizable ingredients under Bharatiya Nyaya Sanhita, 2023.\n3. The substance of the information has been duly recorded in Station General Diary Roznamcha Entry No. 19 u/s 174(1) BNSS, 2023.\n4. As per statutory mandate of Section 174(2) BNSS, 2023, the complainant has been formally referred to the Court of the learned Judicial Magistrate having jurisdiction. No police investigation can be conducted without the specific order of the Magistrate.\n5. Copy of NCR handed over to the complainant free of cost. Matter entered in General Diary and closed at Police Station level.`;

    const generatedRows: NcrRowState[] = [
      {
        id: "row_ncr_date",
        label: "Date & GD Reference",
        cells: [`Roznamcha GD Reference Dated ${dateStr} • Station: ${psName}`],
      },
      {
        id: "row_ncr_complainant",
        label: "Complainant / Informant",
        cells: [complainantInfo],
      },
      {
        id: "row_ncr_gist",
        label: "Gist of Non-Cognizable Occurrence",
        cells: [substance],
      },
      {
        id: "row_ncr_accused",
        label: "Opposite Party / Suspect(s)",
        cells: [accusedInfo],
      },
      {
        id: "row_ncr_findings",
        label: "General Diary Entry & Enquiry Report Details",
        cells: [findingsText],
      },
    ];

    setRows(generatedRows);
    setOfficerName(`(${comp.assignedEoName || currentUser.name || "Enquiry Officer"})`);
    setOfficerRank(comp.assignedEoRank || currentUser.rankDisplay || "Assistant Sub-Inspector / Enquiry Officer");
    setOfficerLocation(psName);
    setReportDate(`Dated: ${dateStr}`);
  };

  const handleComplaintSelected = (comp: ComplaintItem | null, report: ComplaintAnalysisReport | null) => {
    setSelectedComplaint(comp);
    setAnalysisReport(report);
    setSaveSuccess(false);

    if (comp && report) {
      populateFromAnalysis(comp, report);
    } else {
      setRows([]);
    }
  };

  // Row update handlers
  const handleUpdateRowLabel = (id: string, newLabel: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, label: newLabel } : r)));
  };

  const handleUpdateCell = (rowId: string, cellIndex: number, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const newCells = [...r.cells];
        newCells[cellIndex] = value;
        return { ...r, cells: newCells };
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      alert("At least one row must remain in the NCR document.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddRow = () => {
    const newId = `row_${Date.now()}`;
    setRows((prev) => [
      ...prev,
      { id: newId, label: `Row ${prev.length + 1}`, cells: [""] },
    ]);
  };

  const handleReset = () => {
    if (!selectedComplaint || !analysisReport) return;
    if (!confirm("Discard edits and re-generate NCR from complaint docket?")) return;
    populateFromAnalysis(selectedComplaint, analysisReport);
  };

  // Save to Complaint Docket
  const handleSaveToComplaint = async () => {
    if (!selectedComplaint) {
      alert("Please select a complaint first.");
      return;
    }

    setSaveLoading(true);
    try {
      const docHtml = generateHaryanaPoliceProformaHtml({
        headerLeft: showHeader ? headerLeft : undefined,
        headerRight: showHeader ? headerRight : undefined,
        subHeaderLeft: subHeaderLeft || undefined,
        title,
        subTitle,
        rows: rows.map((r) => ({ id: r.id, label: r.label, cells: r.cells })),
        closingLine,
        officerName: showSignatures ? officerName : undefined,
        officerRank: showSignatures ? officerRank : undefined,
        officerLocation: showSignatures ? officerLocation : undefined,
        reportDate: showSignatures ? reportDate : undefined,
        borderStyle,
      });

      // 1. Save document to complaint documents
      await ComplaintService.addDocument(selectedComplaint.id, {
        fileName: `${ncrNumber}.html`,
        fileCategory: "NCR",
        fileSize: `${Math.round(docHtml.length / 1024) || 2} KB`,
        dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(docHtml)}`,
        contentHtml: docHtml,
        uploadedBy: currentUser.name || "Enquiry Officer",
      });

      // 2. Issue official NCR reference
      await ComplaintService.issueNcrReference(
        selectedComplaint.id,
        ncrNumber,
        "Section 174 BNSS, 2023",
        currentUser.name || "Enquiry Officer"
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err: any) {
      console.error("Failed to save NCR:", err);
      alert(`Error saving NCR: ${err.message || "Please try again."}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyReport = () => {
    if (!documentRef.current) return;
    navigator.clipboard.writeText(documentRef.current.innerText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadWord = () => {
    const docHtml = generateHaryanaPoliceProformaHtml({
      headerLeft: showHeader ? headerLeft : undefined,
      headerRight: showHeader ? headerRight : undefined,
      subHeaderLeft,
      title,
      subTitle,
      rows: rows.map((r) => ({ id: r.id, label: r.label, cells: r.cells })),
      closingLine,
      officerName: showSignatures ? officerName : undefined,
      officerRank: showSignatures ? officerRank : undefined,
      officerLocation: showSignatures ? officerLocation : undefined,
      reportDate: showSignatures ? reportDate : undefined,
      borderStyle,
    });

    const blob = new Blob(["\ufeff", docHtml], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ncrNumber}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 pb-20">
      {/* 4-Tab Navigation */}
      <EnquiryWorkspaceNav complaintId={selectedComplaint?.id} />

      {/* 1. REQUIRED COMPLAINT DROPDOWN & ANALYSIS HEADER */}
      <ComplaintAnalysisHeader
        initialComplaintId={complaintIdParam}
        showPersonDropdown={false}
        onComplaintSelect={handleComplaintSelected}
        selectedComplaintId={selectedComplaint?.id}
      />

      {/* 2. IF NO COMPLAINT SELECTED: EMPTY STATE */}
      {!selectedComplaint ? (
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-700">
            <BadgeAlert className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Select a Complaint to Generate NCR u/s 174 BNSS
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Choose any complaint from the required dropdown above. The system will analyze all facts from the Overview and Documents subtabs, extract non-cognizable details without inventing information, and prepare an editable NCR proforma.
          </p>
        </div>
      ) : (
        /* 3. WORKSPACE TOOLBAR & EDITABLE PREVIEW */
        <div className="space-y-4">
          {/* Top Control Bar */}
          <div className="no-print bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <BadgeAlert className="w-4 h-4 text-emerald-600" />
                <span>NCR Reference:</span>
              </span>
              <input
                type="text"
                value={ncrNumber}
                onChange={(e) => setNcrNumber(e.target.value)}
                className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-500"
              />

              <input
                type="text"
                value={gdEntryNumber}
                onChange={(e) => setGdEntryNumber(e.target.value)}
                className="text-xs text-slate-700 bg-slate-50 border border-slate-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="GD Roznamcha Entry"
              />

              {/* Reset to Original Analysis */}
              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
                title="Discard edits and reload from complaint docket"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Re-Analyze Docket</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs font-bold gap-1 border-slate-300 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadWord}
                className="text-xs font-bold gap-1 border-slate-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Word (.doc)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                className="text-xs font-bold gap-1 border-slate-300 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy"}</span>
              </Button>

              <Button
                type="button"
                onClick={handleSaveToComplaint}
                disabled={saveLoading}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>NCR Saved to Docket!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? "Saving..." : "Save to Complaint"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Saved Notification */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in-50">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold">
                  NCR {ncrNumber} saved to Complaint {selectedComplaint.complaintNumber} and recorded in Station General Diary!
                </span>
              </div>
              <Link
                href={`/complaints/${selectedComplaint.id}`}
                className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
              >
                View in Complaint Docket &rarr;
              </Link>
            </div>
          )}

          {/* Styling Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Proforma Formatting:
              </span>

              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-1">
                <span className="text-[11px] text-slate-500 font-medium">Border:</span>
                <select
                  value={borderStyle}
                  onChange={(e) => setBorderStyle(e.target.value as any)}
                  className="text-[11px] font-bold bg-transparent border-0 outline-none cursor-pointer text-slate-900"
                >
                  <option value="solid">Solid Black (Official)</option>
                  <option value="double">Double Border</option>
                  <option value="light">Light Gray</option>
                  <option value="none">No Border</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowHeader(!showHeader)}
                className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                  showHeader ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {showHeader ? "✓ Header: Active" : "✕ Header: Hidden"}
              </button>

              <button
                type="button"
                onClick={() => setShowSignatures(!showSignatures)}
                className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                  showSignatures ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {showSignatures ? "✓ Signatures: Active" : "✕ Signatures: Hidden"}
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs bg-white hover:bg-slate-100 text-emerald-700 font-bold border-emerald-300 gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Add Row</span>
            </Button>
          </div>

          {/* EDITABLE DOCUMENT PREVIEW */}
          <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-8 min-h-[700px]" ref={documentRef}>
            {/* Header */}
            {showHeader && (
              <div className="text-center space-y-1 mb-6 border-b pb-4 border-slate-300">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <input
                    type="text"
                    value={headerLeft}
                    onChange={(e) => setHeaderLeft(e.target.value)}
                    className="font-bold border-b border-dashed border-transparent hover:border-slate-400 outline-none w-1/2 text-left"
                  />
                  <input
                    type="text"
                    value={headerRight}
                    onChange={(e) => setHeaderRight(e.target.value)}
                    className="font-bold border-b border-dashed border-transparent hover:border-slate-400 outline-none w-1/3 text-right"
                  />
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-center font-black text-sm text-slate-900 border-b border-dashed border-transparent hover:border-slate-400 outline-none uppercase tracking-tight py-1"
                />
                <input
                  type="text"
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  className="w-full text-center text-xs text-slate-600 border-b border-dashed border-transparent hover:border-slate-400 outline-none italic"
                />
              </div>
            )}

            {/* Editable 2-Column Table */}
            <div className="overflow-x-auto my-4">
              <table
                className={`w-full text-xs border-collapse ${
                  borderStyle === "solid"
                    ? "border-2 border-black"
                    : borderStyle === "double"
                    ? "border-4 border-double border-black"
                    : borderStyle === "light"
                    ? "border border-slate-300"
                    : "border-0"
                }`}
              >
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`group ${
                        borderStyle !== "none" ? "border-b border-black" : "border-b border-slate-200"
                      }`}
                    >
                      {/* Row Label (Left Column) */}
                      <td
                        className={`w-1/4 p-3 font-bold align-top bg-slate-50/70 ${
                          borderStyle !== "none" ? "border-r border-black" : "border-r border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <textarea
                            value={row.label}
                            onChange={(e) => handleUpdateRowLabel(row.id, e.target.value)}
                            rows={2}
                            className="w-full font-bold bg-transparent border-0 outline-none resize-none text-slate-900 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-700 transition-opacity cursor-pointer shrink-0"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Row Content (Right Column) */}
                      <td className="w-3/4 p-3 align-top">
                        <textarea
                          value={row.cells[0] || ""}
                          onChange={(e) => handleUpdateCell(row.id, 0, e.target.value)}
                          rows={Math.max(3, (row.cells[0] || "").split("\n").length)}
                          className="w-full bg-transparent border-0 outline-none resize-y text-slate-800 text-xs leading-relaxed focus:bg-blue-50/20 rounded p-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Closing Line */}
            <div className="my-5">
              <textarea
                value={closingLine}
                onChange={(e) => setClosingLine(e.target.value)}
                rows={2}
                className="w-full text-xs italic text-slate-700 border-b border-dashed border-transparent hover:border-slate-400 outline-none resize-none"
              />
            </div>

            {/* Signatures & Seal */}
            {showSignatures && (
              <div className="mt-8 pt-6 flex justify-end">
                <div className="w-72 text-right space-y-1 text-xs text-slate-900">
                  <div className="h-10"></div>
                  <input
                    type="text"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    className="w-full text-right font-bold border-b border-dashed border-transparent hover:border-slate-400 outline-none"
                  />
                  <input
                    type="text"
                    value={officerRank}
                    onChange={(e) => setOfficerRank(e.target.value)}
                    className="w-full text-right text-[11px] text-slate-600 border-b border-dashed border-transparent hover:border-slate-400 outline-none"
                  />
                  <input
                    type="text"
                    value={officerLocation}
                    onChange={(e) => setOfficerLocation(e.target.value)}
                    className="w-full text-right text-[11px] text-slate-500 border-b border-dashed border-transparent hover:border-slate-400 outline-none"
                  />
                  <input
                    type="text"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full text-right text-[11px] text-slate-500 border-b border-dashed border-transparent hover:border-slate-400 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NcrPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading NCR Proforma Workspace...</div>}>
      <NcrWorkspaceContent />
    </Suspense>
  );
}
