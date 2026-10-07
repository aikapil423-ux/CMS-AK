"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileSearch,
  User,
  Folder,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ComplaintItem } from "@/types";
import {
  getComplaintShortTitle,
  getAuthorizedComplaintsForUser,
  analyzeComplaintWithDocuments,
  IdentifiedPerson,
  ComplaintAnalysisReport,
} from "@/services/complaintDocumentAnalysisService";

interface ComplaintAnalysisHeaderProps {
  initialComplaintId?: string | null;
  showPersonDropdown?: boolean;
  onComplaintSelect: (complaint: ComplaintItem | null, report: ComplaintAnalysisReport | null) => void;
  onPersonSelect?: (person: IdentifiedPerson | null) => void;
  selectedComplaintId?: string | null;
  selectedPersonId?: string | null;
  className?: string;
}

export function ComplaintAnalysisHeader({
  initialComplaintId,
  showPersonDropdown = false,
  onComplaintSelect,
  onPersonSelect,
  selectedComplaintId,
  selectedPersonId,
  className = "",
}: ComplaintAnalysisHeaderProps) {
  const { currentUser } = useAuth();

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [complaintsError, setComplaintsError] = useState<string | null>(null);

  const [currentComplaintId, setCurrentComplaintId] = useState<string>(
    selectedComplaintId || initialComplaintId || ""
  );
  const [currentPersonId, setCurrentPersonId] = useState<string>(selectedPersonId || "");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<ComplaintAnalysisReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    if (selectedComplaintId !== undefined && selectedComplaintId !== currentComplaintId) {
      setCurrentComplaintId(selectedComplaintId || "");
    }
  }, [selectedComplaintId]);

  useEffect(() => {
    if (selectedPersonId !== undefined && selectedPersonId !== currentPersonId) {
      setCurrentPersonId(selectedPersonId || "");
    }
  }, [selectedPersonId]);

  // Load authorized complaints for the logged-in user
  const loadComplaints = useCallback(async () => {
    setLoadingComplaints(true);
    setComplaintsError(null);
    try {
      const list = await getAuthorizedComplaintsForUser(currentUser);
      setComplaints(list);
      // If initialComplaintId is provided, trigger selection if it matches
      if (initialComplaintId && !currentComplaintId) {
        const found = list.find((c) => c.id === initialComplaintId || c.complaintNumber === initialComplaintId);
        if (found) {
          handleComplaintChange(found.id, list);
        }
      }
    } catch (err: any) {
      console.error("Failed to load authorized complaints:", err);
      setComplaintsError(err.message || "Failed to load complaints for your account.");
    } finally {
      setLoadingComplaints(false);
    }
  }, [currentUser, initialComplaintId]);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  // Handle complaint selection
  const handleComplaintChange = async (newId: string, complaintList: ComplaintItem[] = complaints) => {
    setCurrentComplaintId(newId);
    setCurrentPersonId("");
    if (onPersonSelect) onPersonSelect(null);

    if (!newId) {
      setAnalysisReport(null);
      setIsAnalyzing(false);
      onComplaintSelect(null, null);
      return;
    }

    const found = complaintList.find((c) => c.id === newId || c.complaintNumber === newId);
    if (!found) {
      setAnalysisReport(null);
      setIsAnalyzing(false);
      onComplaintSelect(null, null);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const report = await analyzeComplaintWithDocuments(found);
      setAnalysisReport(report);
      onComplaintSelect(found, report);

      // Auto-select primary complainant or accused if person dropdown is requested and none selected yet
      if (showPersonDropdown && report.identifiedPersons.length > 0) {
        const defaultPerson = report.identifiedPersons[0];
        setCurrentPersonId(defaultPerson.id);
        if (onPersonSelect) onPersonSelect(defaultPerson);
      }
    } catch (err: any) {
      console.error("Failed to analyze complaint:", err);
      setAnalysisError(err.message || "Error analyzing complaint and documents.");
      onComplaintSelect(found, null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePersonChange = (pId: string) => {
    setCurrentPersonId(pId);
    if (!analysisReport) return;
    const found = analysisReport.identifiedPersons.find((p) => p.id === pId) || null;
    if (onPersonSelect) onPersonSelect(found);
  };

  const selectedComplaintObj = complaints.find((c) => c.id === currentComplaintId);

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5 ${className}`}>
      {/* Top Header Row with Selection Dropdowns */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 1. Required Complaint Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Complaint</span>
              <span className="text-red-500 font-black text-xs">*</span>
              <span className="text-[10px] font-normal text-slate-500 ml-auto">
                (Logged-in Register: {currentUser.role})
              </span>
            </label>

            {loadingComplaints ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Loading authorized complaints docket...</span>
              </div>
            ) : complaintsError ? (
              <div className="flex items-center justify-between text-xs text-red-600 py-1.5 px-3 bg-red-50 border border-red-200 rounded-lg">
                <span>{complaintsError}</span>
                <button
                  type="button"
                  onClick={loadComplaints}
                  className="font-bold underline text-red-700 hover:text-red-900 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            ) : (
              <select
                value={currentComplaintId}
                onChange={(e) => handleComplaintChange(e.target.value)}
                className={`w-full text-xs font-medium rounded-lg px-3 py-2 border outline-none transition-all cursor-pointer ${
                  currentComplaintId
                    ? "bg-blue-50/50 border-blue-400 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
                    : "bg-white border-amber-300 text-slate-600 focus:ring-2 focus:ring-amber-500"
                }`}
              >
                <option value="">-- Select Complaint (Required) --</option>
                {complaints.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getComplaintShortTitle(c)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Required Person Dropdown (for Notice & Report Template Builder) */}
          {showPersonDropdown && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span>Select Person</span>
                <span className="text-red-500 font-black text-xs">*</span>
                <span className="text-[10px] font-normal text-slate-500 ml-auto">
                  {analysisReport ? `(${analysisReport.identifiedPersons.length} identified)` : "(Overview & Docs)"}
                </span>
              </label>

              {!currentComplaintId ? (
                <div className="text-xs text-slate-400 italic py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg">
                  Select a complaint first to populate persons
                </div>
              ) : isAnalyzing ? (
                <div className="flex items-center gap-2 text-xs text-purple-600 py-2 px-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Processing Overview &amp; attached documents...</span>
                </div>
              ) : analysisReport && analysisReport.identifiedPersons.length > 0 ? (
                <select
                  value={currentPersonId}
                  onChange={(e) => handlePersonChange(e.target.value)}
                  className="w-full text-xs font-bold rounded-lg px-3 py-2 border bg-purple-50/40 border-purple-400 text-slate-900 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="">-- Select Person (Required) --</option>
                  {analysisReport.identifiedPersons.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role} [{p.source}]
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-amber-800 py-2 px-3 bg-amber-50 border border-amber-200 rounded-lg">
                  No distinct persons extracted. Enter manually in document preview.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Status Badge */}
        {currentComplaintId && selectedComplaintObj && (
          <div className="shrink-0 flex items-center gap-2">
            <div className="text-right">
              <div className="text-[11px] font-mono font-bold text-slate-900">
                {selectedComplaintObj.complaintNumber}
              </div>
              <div className="text-[10px] text-slate-500">
                Station: {selectedComplaintObj.policeStation || "Local PS"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalysisDetails((v) => !v)}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-all cursor-pointer"
              title="Toggle Analysis & Evidence Details"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Analysis Dossier</span>
              {showAnalysisDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Analysis Error Alert */}
      {analysisError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Analyzing Progress Banner */}
      {isAnalyzing && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
          <span>
            Reading Overview, parsing uploaded documents, extracting named individuals, and cross-checking dates...
          </span>
        </div>
      )}

      {/* Document Analysis & Fact Verification Accordion */}
      {analysisReport && !isAnalyzing && (
        <div className="space-y-2">
          {/* Summary Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium">
              <User className="w-3 h-3 text-slate-500" />
              <span>{analysisReport.identifiedPersons.length} Persons Extracted</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium">
              <FileText className="w-3 h-3 text-slate-500" />
              <span>{analysisReport.extractedDocuments.filter((d) => d.isReadable).length} Readable Documents</span>
            </span>

            {analysisReport.unreadableDocuments.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-300 text-[11px] font-bold">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>{analysisReport.unreadableDocuments.length} Unreadable File(s) Omitted</span>
              </span>
            )}

            {analysisReport.missingInformationFlags.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-200 text-[11px] font-bold">
                <Info className="w-3 h-3 text-red-600" />
                <span>{analysisReport.missingInformationFlags.length} Fact Review Flags</span>
              </span>
            )}
          </div>

          {/* Unreadable Documents Explicit Alert */}
          {analysisReport.unreadableDocuments.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Unreadable Uploaded Documents (Content Not Included in Auto-Generation):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pl-1">
                {analysisReport.unreadableDocuments.map((ud, idx) => (
                  <li key={idx}>
                    <span className="font-semibold text-slate-900">&ldquo;{ud.fileName}&rdquo;</span> — {ud.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Information / Conflicting Flags Alert */}
          {(analysisReport.missingInformationFlags.length > 0 ||
            analysisReport.conflictingInformationFlags.length > 0) && (
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Information Verification &amp; Missing Details (No Facts Were Invented):</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 pl-1">
                {analysisReport.missingInformationFlags.map((flag, idx) => (
                  <li key={`mis_${idx}`} className="text-amber-900">
                    <span className="font-semibold">Missing:</span> {flag}
                  </li>
                ))}
                {analysisReport.conflictingInformationFlags.map((conflict, idx) => (
                  <li key={`cnf_${idx}`} className="text-red-700 font-semibold">
                    <span>Conflict Flag:</span> {conflict}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collapsible Deep Dossier Card */}
          {showAnalysisDetails && (
            <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-3 text-xs space-y-3 animate-in fade-in-50">
              <div className="font-bold text-slate-900 flex items-center justify-between border-b pb-1.5 border-slate-200">
                <span>Extracted Entities &amp; Document Text</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Source: Overview Tab + Documents Subtab
                </span>
              </div>

              {/* Identified Persons Table */}
              <div>
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                  Identified Persons ({analysisReport.identifiedPersons.length})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-1">
                  {analysisReport.identifiedPersons.map((p) => (
                    <div
                      key={p.id}
                      className={`p-2 rounded border text-[11px] ${
                        p.id === currentPersonId
                          ? "bg-purple-50 border-purple-300 text-purple-950 font-semibold ring-1 ring-purple-400"
                          : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{p.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border">
                          {p.role}
                        </span>
                      </div>
                      {p.fatherOrSpouse && (
                        <div className="text-[10px] text-slate-500 truncate">
                          Relative: {p.fatherOrSpouse}
                        </div>
                      )}
                      {p.phone && (
                        <div className="text-[10px] text-slate-500">Phone: {p.phone}</div>
                      )}
                      {p.address && (
                        <div className="text-[10px] text-slate-500 truncate" title={p.address}>
                          Address: {p.address}
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>Source: {p.source}</span>
                        {p.documentName && <span className="truncate max-w-[120px]">{p.documentName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Incident Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] pt-1">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Incident Date</span>
                  <span className="font-bold text-slate-800">
                    {analysisReport.incidentDate || "Not recorded"}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Occurrence Place</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {analysisReport.incidentPlace || "Not recorded"}
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Sections of Law</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {analysisReport.sectionsOfLaw || "Section 173(3) BNSS, 2023"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
