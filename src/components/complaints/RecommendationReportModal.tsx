"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Shield,
  FileText,
  Printer,
  Download,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Landmark,
  Banknote,
  Handshake,
  ShieldAlert,
  ChevronDown,
  Edit3,
  Copy,
  Check,
  Eye,
  FileCheck2,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { ComplaintItem, ComplaintReportItem } from "@/types";
import {
  RecommendationReportService,
  RecommendationReportType,
  RecommendationReportDraft,
  ReportSection,
  RECOMMENDATION_OPTIONS_CONFIG,
} from "@/services/recommendationReportService";
import { ComplaintService } from "@/services/complaintService";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface RecommendationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: ComplaintItem;
  currentUser: {
    name: string;
    role: string;
    pno?: string;
    rankDisplay?: string;
  };
  existingReport?: ComplaintReportItem | null;
  initialRecommendation?: RecommendationReportType;
  onReportSaved?: (updatedComplaint: ComplaintItem) => void;
}

export const RecommendationReportModal: React.FC<RecommendationReportModalProps> = ({
  isOpen,
  onClose,
  complaint,
  currentUser,
  existingReport = null,
  initialRecommendation = "GAMINI",
  onReportSaved,
}) => {
  // Recommendation state
  const [selectedRecType, setSelectedRecType] = useState<RecommendationReportType>(
    (existingReport?.recommendationType as RecommendationReportType) || initialRecommendation
  );

  // Draft editable state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dispatchNo, setDispatchNo] = useState("");
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [closingLine, setClosingLine] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [officerRank, setOfficerRank] = useState("");
  const [officerPno, setOfficerPno] = useState("");
  const [officerLocation, setOfficerLocation] = useState("");
  const [reportDateStr, setReportDateStr] = useState("");

  // Tracking edit status
  const [isDirty, setIsDirty] = useState(false);
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const [pendingRecType, setPendingRecType] = useState<RecommendationReportType | null>(null);

  // Saving / feedback state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [saveMode, setSaveMode] = useState<"Saved in Complaint" | "Draft">("Saved in Complaint");
  const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);
  const [activeVersionNumber, setActiveVersionNumber] = useState<number>(1);

  // Printable ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Initialize or load draft
  useEffect(() => {
    if (!isOpen) return;

    if (existingReport) {
      // Editing an existing saved report
      const rec = (existingReport.recommendationType as RecommendationReportType) || "GAMINI";
      setSelectedRecType(rec);
      setTitle(existingReport.title || "");
      setDispatchNo(existingReport.dispatchNo || `DISPATCH/${complaint.complaintNumber}`);
      setOfficerName(existingReport.officerName || currentUser.name);
      setOfficerRank(existingReport.officerRank || currentUser.rankDisplay || "Enquiry Officer");
      setOfficerPno(existingReport.officerPno || currentUser.pno || "PNO-23841");
      setOfficerLocation(complaint.policeStation || "Panipat");
      setReportDateStr(formatDate(new Date()));
      setActiveVersionNumber(existingReport.versionNumber || 1);
      setSaveMode((existingReport.status as any) || "Saved in Complaint");

      // Parse existing content into sections or fallback
      if (existingReport.content) {
        const rawContent = existingReport.content;
        const parsedSections: ReportSection[] = [];
        const lines = rawContent.split("\n\n");
        let currentHeading = "Report Details";
        let currentBody: string[] = [];

        lines.forEach((block, idx) => {
          const trimmed = block.trim();
          if (trimmed.match(/^\d+\.\s+/)) {
            if (currentBody.length > 0) {
              parsedSections.push({
                id: `sec_${parsedSections.length + 1}`,
                heading: currentHeading,
                content: currentBody.join("\n\n"),
              });
              currentBody = [];
            }
            const firstLineEnd = trimmed.indexOf("\n");
            if (firstLineEnd !== -1) {
              currentHeading = trimmed.substring(0, firstLineEnd);
              currentBody.push(trimmed.substring(firstLineEnd + 1).trim());
            } else {
              currentHeading = trimmed;
            }
          } else {
            currentBody.push(trimmed);
          }
        });

        if (currentBody.length > 0) {
          parsedSections.push({
            id: `sec_${parsedSections.length + 1}`,
            heading: currentHeading,
            content: currentBody.join("\n\n"),
          });
        }

        if (parsedSections.length > 0) {
          setSections(parsedSections);
        } else {
          setSections([
            {
              id: "sec_main",
              heading: "Report Content",
              content: rawContent,
            },
          ]);
        }
      } else {
        loadNewDraft(rec);
      }
      setIsDirty(false);
    } else {
      // Fresh new draft generation
      loadNewDraft(initialRecommendation);
      setIsDirty(false);
      const existingReports = complaint.reports || [];
      const nextVer = existingReports.reduce((max, r) => Math.max(max, r.versionNumber || 1), 0) + 1;
      setActiveVersionNumber(nextVer);
    }
  }, [isOpen, existingReport, complaint.id]);

  // Generate clean tailored draft
  const loadNewDraft = (recType: RecommendationReportType) => {
    const draft: RecommendationReportDraft = RecommendationReportService.generateDraft(
      complaint,
      recType,
      {
        name: currentUser.name,
        rank: currentUser.rankDisplay || "Enquiry Officer",
        pno: currentUser.pno || "PNO-23841",
        station: complaint.policeStation,
      }
    );

    setSelectedRecType(recType);
    setTitle(draft.title);
    setSubject(draft.subject);
    setDispatchNo(draft.dispatchNo);
    setSections(draft.sections);
    setClosingLine(draft.closingLine);
    setOfficerName(draft.officerName);
    setOfficerRank(draft.officerRank);
    setOfficerPno(draft.officerPno);
    setOfficerLocation(draft.officerLocation);
    setReportDateStr(draft.dateStr);
    setIsDirty(false);
  };

  // Recommendation Dropdown Change Handler
  const handleRecommendationSelect = (newRec: RecommendationReportType) => {
    if (newRec === selectedRecType) return;
    if (isDirty) {
      setPendingRecType(newRec);
      setShowRegenerateWarning(true);
    } else {
      loadNewDraft(newRec);
    }
  };

  // Confirm Regenerate replacement
  const handleConfirmRegenerate = () => {
    const target = pendingRecType || selectedRecType;
    loadNewDraft(target);
    setShowRegenerateWarning(false);
    setPendingRecType(null);
  };

  const handleCancelRegenerate = () => {
    setShowRegenerateWarning(false);
    setPendingRecType(null);
  };

  // Add a new editable section
  const handleAddSection = () => {
    const newSec: ReportSection = {
      id: `sec_custom_${Date.now()}`,
      heading: `${sections.length + 1}. Additional Findings / Remarks:`,
      content: "",
    };
    setSections([...sections, newSec]);
    setIsDirty(true);
  };

  // Delete section
  const handleDeleteSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
    setIsDirty(true);
  };

  // Section content / heading change
  const handleSectionHeadingChange = (index: number, val: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], heading: val };
    setSections(updated);
    setIsDirty(true);
  };

  const handleSectionContentChange = (index: number, val: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], content: val };
    setSections(updated);
    setIsDirty(true);
  };

  // Assemble current full plain text and HTML
  const assembleCurrentReportData = () => {
    const district = (complaint.district || "Panipat").toUpperCase();
    const station = officerLocation || complaint.policeStation || `Headquarters ${district}`;

    const plainText = `HARYANA POLICE DEPARTMENT - DISTRICT ${district}
${station}
${title}
${dispatchNo} | Dated: ${reportDateStr}
${subject}

${sections.map((s) => `${s.heading}\n${s.content}`).join("\n\n")}

${closingLine}

Submitted By:
${officerName}
${officerRank} (${officerPno})
${station}
Dated: ${reportDateStr}
`;

    const htmlContent = `
<div class="haryana-police-report-document" style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 820px; margin: 0 auto; padding: 24px; background: #ffffff;">
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">POLICE DEPARTMENT</h4>
        <p style="margin: 2px 0 0; font-size: 12px; font-weight: 700; color: #1e293b;">${station}</p>
      </div>
      <div style="text-align: right;">
        <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #475569; text-transform: uppercase;">DISTRICT ${district}</h4>
        <p style="margin: 2px 0 0; font-size: 11px; font-family: monospace; color: #64748b;">${dispatchNo}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin-top: 14px;">
      <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #0b192c; letter-spacing: 0.5px; text-decoration: underline;">${title}</h2>
      <p style="margin: 6px 0 0; font-size: 13px; font-weight: 800; color: #1e293b;">${subject}</p>
    </div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 16px;">
    ${sections
      .map(
        (sec) => `
    <div class="report-section-block" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; background: #f8fafc;">
      <h3 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px;">${sec.heading}</h3>
      <div style="font-size: 12.5px; color: #334155; white-space: pre-wrap; word-break: break-word;">${sec.content}</div>
    </div>`
      )
      .join("")}
  </div>

  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #94a3b8; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <p style="margin: 0; font-size: 11px; color: #64748b; font-style: italic;">${closingLine}</p>
      <p style="margin: 4px 0 0; font-size: 11px; font-weight: bold; color: #334155;">दिनांक: ${reportDateStr} | स्थान: ${station}</p>
    </div>
    <div style="text-align: right; min-width: 220px;">
      <div style="height: 35px;"></div>
      <p style="margin: 0; font-size: 12px; font-weight: 800; color: #0f172a;">(${officerName})</p>
      <p style="margin: 2px 0 0; font-size: 11px; color: #475569;">${officerRank} (${officerPno})</p>
      <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">${station}</p>
    </div>
  </div>
</div>`;

    return { plainText, htmlContent };
  };

  // Save report into complaint.reports
  const handleSaveReport = async (targetStatus: "Saved in Complaint" | "Draft") => {
    setIsSaving(true);
    try {
      const { plainText, htmlContent } = assembleCurrentReportData();
      const recConfig = RecommendationReportService.getRecommendationConfig(selectedRecType);

      const reportPayload = {
        id: isCreatingNewVersion ? undefined : existingReport?.id,
        title: title || `${recConfig.label} Report - ${complaint.complaintNumber}`,
        reportType: `RECOMMENDATION_${selectedRecType}`,
        reportTypeLabel: recConfig.titleEnglish,
        dispatchNo,
        generatedDate: new Date().toISOString(),
        officerName,
        officerRank,
        officerPno,
        conclusionSummary: sections[sections.length - 1]?.content?.slice(0, 300) || "Enquiry completed.",
        content: plainText,
        contentHtml: htmlContent,
        fileFormat: "TXT",
        recommendationType: selectedRecType,
        isFirRecommended: selectedRecType === "FIR",
        selectedOutcome: (selectedRecType === "FIR"
          ? "FIR Recommend"
          : selectedRecType === "RAZINAMA" || selectedRecType === "NIVARAN"
          ? "Complete"
          : "Pending") as any,
        status: targetStatus,
        createdBy: existingReport?.createdBy || currentUser.name,
        lastModifiedBy: currentUser.name,
      };

      const updatedComplaint = await ComplaintService.addComplaintReport(
        complaint.id,
        reportPayload,
        { isNewVersion: isCreatingNewVersion }
      );

      setIsDirty(false);
      setSaveSuccessMsg(`Report successfully saved as "${targetStatus}" in Complaint Docket!`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);

      if (onReportSaved) {
        onReportSaved(updatedComplaint);
      }
    } catch (err: any) {
      alert(`Failed to save report: ${err.message || "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    const { htmlContent } = assembleCurrentReportData();
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      alert("Please allow popups to print official report.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || "Official Police Report"}</title>
          <style>
            @media print {
              body { margin: 15mm; }
              @page { size: A4; margin: 15mm; }
            }
          </style>
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          ${htmlContent}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Download Handler
  const handleDownload = () => {
    const { plainText } = assembleCurrentReportData();
    const blob = new Blob([plainText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_") || "Enquiry_Report"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const activeConfig = RecommendationReportService.getRecommendationConfig(selectedRecType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden my-auto">
        
        {/* ================= MODAL HEADER & BREADCRUMBS ================= */}
        <div className="bg-[#0b192c] text-white px-5 py-4 border-b border-slate-700 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 border border-amber-400/30">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Recommendation Based Report / Draft Generator</span>
                  <span className="text-xs font-mono font-normal bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                    {complaint.complaintNumber}
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Haryana Police Automated Legal Report Drafting System (BNSS / BNS Compliant)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Workflow Pipeline Breadcrumbs: Generate Reports -> Process & Analysis -> Overview & Documents -> Recommendations */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-[11px] font-semibold text-slate-400 border-t border-slate-800 mt-1">
            <span className="text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Generate Reports</span>
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-blue-400 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Process &amp; Analysis</span>
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-emerald-400 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              <span>Overview &amp; Documents</span>
            </span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              <CheckCircle2 className="w-3 h-3 text-amber-400" />
              <span>Recommendations Dropdown ({activeConfig.label})</span>
            </span>
          </div>
        </div>

        {/* ================= CONTROLS & RECOMMENDATION SELECTOR BAR ================= */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* The 6-Option Recommendations Dropdown */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Recommendations Dropdown:</span>
              </label>

              <div className="relative min-w-[260px] sm:min-w-[320px]">
                <select
                  value={selectedRecType}
                  onChange={(e) => handleRecommendationSelect(e.target.value as RecommendationReportType)}
                  className="w-full text-xs font-bold bg-white border-2 border-amber-500 text-slate-900 rounded-xl px-3 py-2 pr-9 shadow-xs focus:ring-2 focus:ring-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {RECOMMENDATION_OPTIONS_CONFIG.map((opt) => (
                    <option key={opt.key} value={opt.key} className="py-1">
                      {opt.label} • {opt.titleHindi}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-amber-700">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Active Badge */}
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${activeConfig.badgeColor.border} ${activeConfig.badgeColor.bg} ${activeConfig.badgeColor.text} shadow-2xs`}>
                {activeConfig.titleEnglish}
              </span>
            </div>

            {/* Mode switch (Edit vs Formatted Preview) & Version */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === "edit"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editable Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === "preview"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Official Layout</span>
                </button>
              </div>

              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300 px-2 py-1 rounded-md">
                v{activeVersionNumber}
              </span>
            </div>
          </div>

          {/* Processed Complaint Data Highlights (Overview & Documents real-data verification) */}
          <div className="bg-white rounded-xl p-2.5 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Processed Data:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                👤 Complainant: <strong>{complaint.complainantName || "Not Recorded"}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                ⚠️ Opposite: <strong>{complaint.accusedList?.[0]?.name || "Unidentified"}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                📍 Place: <strong>{complaint.incidentPlace || "Not Recorded"}</strong>
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
                📎 Documents: <strong>{(complaint.documents?.length || 0) + (complaint.attachments?.length || 0)} files</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-amber-800 font-semibold italic">
                Anti-Fabrication Rule Active: Missing fields marked with [Information not available]
              </span>
            </div>
          </div>
        </div>

        {/* ================= REGENERATE CONFIRMATION ALERT MODAL ================= */}
        {showRegenerateWarning && (
          <div className="bg-amber-50 border-b border-amber-300 p-3.5 px-5 flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in-50">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold">A draft has already been edited.</p>
                <p className="text-amber-800">
                  Regenerating the report may replace the current draft. Do you want to continue?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelRegenerate}
                className="text-xs h-7 border-amber-300 text-amber-900 bg-white hover:bg-amber-100 cursor-pointer"
              >
                Keep Current Edits
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmRegenerate}
                className="text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer shadow-xs"
              >
                Yes, Replace Draft
              </Button>
            </div>
          </div>
        )}

        {/* ================= SUCCESS NOTIFICATION TOAST ================= */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-300 p-2.5 px-5 flex items-center gap-2 text-xs text-emerald-950 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{saveSuccessMsg}</span>
          </div>
        )}

        {/* ================= DRAFT BODY / WORKSPACE ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 space-y-4">
          {activeTab === "edit" ? (
            /* ============= EDITABLE DRAFT MODE ============= */
            <div className="space-y-4 max-w-4xl mx-auto">
              
              {/* Draft Header Inputs */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Official Header &amp; Dispatch Reference
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Dated: {reportDateStr}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Report Title (आख्या शीर्षक)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full text-xs font-bold text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Dispatch Reference Number (डिस्पैच क्रमांक)
                    </label>
                    <input
                      type="text"
                      value={dispatchNo}
                      onChange={(e) => {
                        setDispatchNo(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full text-xs font-mono text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Subject Line (विषय)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full text-xs font-medium text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Dynamic Report Sections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>Report Body Sections ({sections.length} points)</span>
                  </h3>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSection}
                    className="text-xs h-7 gap-1 border-slate-300 text-slate-800 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add New Section</span>
                  </Button>
                </div>

                {sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) => handleSectionHeadingChange(idx, e.target.value)}
                        placeholder="Section Heading..."
                        className="text-xs font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:outline-hidden flex-1 pb-0.5"
                      />

                      <button
                        type="button"
                        onClick={() => handleDeleteSection(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded cursor-pointer"
                        title="Remove Section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={sec.content.split("\n").length > 3 ? Math.min(sec.content.split("\n").length + 1, 8) : 3}
                      value={sec.content}
                      onChange={(e) => handleSectionContentChange(idx, e.target.value)}
                      placeholder="Enter section findings, statements, and facts..."
                      className="w-full text-xs text-slate-800 leading-relaxed border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-sans resize-y"
                    />

                    {/* Placeholder hint if placeholder is found */}
                    {sec.content.includes("[Information not available") && (
                      <p className="text-[10px] text-amber-700 italic flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <span>Contains marked missing placeholder. You may edit or provide details above.</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Officer Signature & Closing Inputs */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">
                    Signatory &amp; Submitting Officer
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Officer Name
                    </label>
                    <input
                      type="text"
                      value={officerName}
                      onChange={(e) => {
                        setOfficerName(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Rank &amp; PNO
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={officerRank}
                        onChange={(e) => {
                          setOfficerRank(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-2/3 text-xs text-slate-900 border border-slate-300 rounded-lg p-2"
                        placeholder="Rank"
                      />
                      <input
                        type="text"
                        value={officerPno}
                        onChange={(e) => {
                          setOfficerPno(e.target.value);
                          setIsDirty(true);
                        }}
                        className="w-1/3 text-xs font-mono text-slate-900 border border-slate-300 rounded-lg p-2"
                        placeholder="PNO"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Police Station / Location
                    </label>
                    <input
                      type="text"
                      value={officerLocation}
                      onChange={(e) => {
                        setOfficerLocation(e.target.value);
                        setIsDirty(true);
                      }}
                      className="w-full text-xs text-slate-900 border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Formal Closing Line
                  </label>
                  <input
                    type="text"
                    value={closingLine}
                    onChange={(e) => {
                      setClosingLine(e.target.value);
                      setIsDirty(true);
                    }}
                    className="w-full text-xs text-slate-700 italic border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ============= OFFICIAL FORMATTED PREVIEW MODE ============= */
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md border border-slate-300 p-6 sm:p-8">
              <div
                ref={printAreaRef}
                dangerouslySetInnerHTML={{
                  __html: assembleCurrentReportData().htmlContent,
                }}
              />
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER & ACTION BUTTONS ================= */}
        <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (isDirty) {
                  setShowRegenerateWarning(true);
                } else {
                  loadNewDraft(selectedRecType);
                }
              }}
              className="gap-1.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
              title="Regenerate draft from scratch"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Regenerate Draft</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print Official Layout</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5 text-xs text-slate-700 border-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download (.txt)</span>
            </Button>
          </div>

          {/* Primary Save Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {existingReport && (
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer mr-2">
                <input
                  type="checkbox"
                  checked={isCreatingNewVersion}
                  onChange={(e) => setIsCreatingNewVersion(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Create New Version (v{activeVersionNumber + (isCreatingNewVersion ? 1 : 0)})</span>
              </label>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSaveReport("Draft")}
              disabled={isSaving}
              className="gap-1.5 text-xs border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <Save className="w-3.5 h-3.5 text-slate-600" />
              <span>Save as Draft</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSaveReport("Saved in Complaint")}
              disabled={isSaving}
              className="gap-2 text-xs font-bold bg-[#0b192c] hover:bg-slate-900 text-white cursor-pointer shadow-md px-4 py-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? "Saving..." : "Save in Complaint"}</span>
            </Button>
          </div>

        </div>

      </div>
    </div>
  );
};
