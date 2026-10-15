"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Link2,
  Unlink,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  Scale,
  ShieldCheck,
  ChevronRight,
  GitCompare,
  ArrowRight,
  Layers,
  Copy,
} from "lucide-react";
import { FIRItem, LinkedFIREntry } from "@/types";
import { firService } from "@/services/firService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

interface LinkDuplicateFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  firs: FIRItem[];
  onSuccess: (result: { primary: FIRItem; target: FIRItem }) => void;
  preSelectedFirId?: string;
}

const LINK_TYPES = [
  {
    key: "DUPLICATE",
    label: "Duplicate FIR (दोहराव प्राथमिकी)",
    subtitle: "Same Occurrence / Babubhai Doctrine",
    description:
      "Second FIR registered for the same incident / continuous transaction. Clubbed under T.T. Antony (2001) & Babubhai (2010) SC ruling.",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    key: "CROSS",
    label: "Cross-FIR / Counter Case (क्रॉस प्राथमिकी)",
    subtitle: "Mutual Clashes / Rival Parties",
    description:
      "Cross-allegations between two opposing parties regarding the same fight/incident. Both cases investigated jointly by the same IO.",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    key: "CONNECTED",
    label: "Connected Matter (संबद्ध प्रकरण)",
    subtitle: "Conspiracy / Gang Syndicate",
    description:
      "Distinct FIRs connected via common criminal conspiracy, interstate syndicate, recovery of common stolen property, or common accused.",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
] as const;

const LINK_REASON_PRESETS = [
  "Identical place, time, and incident reported in both FIRs; duplicate registration clubbed under Babubhai doctrine",
  "Mutual cross-cases registered by rival groups arising out of the same altercation/clash",
  "Common interstate crime syndicate and recovered property linked across both cases",
  "Judicial order / SP direction directing joint trial or simultaneous investigation of both FIRs",
  "Supplementary evidence and identical prime suspect identified in both crimes",
];

const DELINK_REASON_PRESETS = [
  "Subsequent investigation established distinct occurrences and unrelated accused persons",
  "Judicial order directing separate and independent trial for both FIRs",
  "Inadvertent linkage / clerical data entry oversight",
  "Separate chargesheet / final report prepared by independent investigation teams",
];

export function LinkDuplicateFIRModal({
  isOpen,
  onClose,
  firs,
  onSuccess,
  preSelectedFirId,
}: LinkDuplicateFIRModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"LINK" | "MANAGE">("LINK");

  // === LINK MODE STATE ===
  const [primaryFirId, setPrimaryFirId] = useState<string>(preSelectedFirId || "");
  const [targetFirId, setTargetFirId] = useState<string>("");
  const [primarySearch, setPrimarySearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [isPrimaryOpen, setIsPrimaryOpen] = useState(false);
  const [isTargetOpen, setIsTargetOpen] = useState(false);
  const primaryDropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  const [linkType, setLinkType] = useState<"DUPLICATE" | "CROSS" | "CONNECTED">("DUPLICATE");
  const [linkReasonPreset, setLinkReasonPreset] = useState(LINK_REASON_PRESETS[0]);
  const [customLinkReason, setCustomLinkReason] = useState("");
  const [officerName, setOfficerName] = useState(currentUser?.name || "Inspector Rajesh Kumar (SHO)");

  // === MANAGE / DELINK STATE ===
  const [manageSelectedFirId, setManageSelectedFirId] = useState<string>(preSelectedFirId || "");
  const [delinkTargetNumber, setDelinkTargetNumber] = useState<string>("");
  const [delinkReason, setDelinkReason] = useState(DELINK_REASON_PRESETS[0]);
  const [customDelinkReason, setCustomDelinkReason] = useState("");
  const [isDelinkConfirmOpen, setIsDelinkConfirmOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync pre-selection
  useEffect(() => {
    if (preSelectedFirId) {
      setPrimaryFirId(preSelectedFirId);
      setManageSelectedFirId(preSelectedFirId);
    }
  }, [preSelectedFirId]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (primaryDropdownRef.current && !primaryDropdownRef.current.contains(event.target as Node)) {
        setIsPrimaryOpen(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setIsTargetOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter Primary FIRs
  const filteredPrimaryFirs = useMemo(() => {
    const q = primarySearch.trim().toLowerCase();
    if (!q) return firs;
    return firs.filter((f) => {
      return (
        f.firNumber.toLowerCase().includes(q) ||
        (f.cctnsFirNumber?.toLowerCase().includes(q) ?? false) ||
        f.complainantName.toLowerCase().includes(q) ||
        f.actsAndSections.toLowerCase().includes(q)
      );
    });
  }, [firs, primarySearch]);

  const selectedPrimaryFir = useMemo(() => {
    return firs.find((f) => f.id === primaryFirId || f.firNumber === primaryFirId);
  }, [firs, primaryFirId]);

  // Filter Target FIRs (excluding selected primary FIR)
  const filteredTargetFirs = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    const available = firs.filter((f) => f.id !== selectedPrimaryFir?.id && f.firNumber !== selectedPrimaryFir?.firNumber);
    if (!q) return available;
    return available.filter((f) => {
      return (
        f.firNumber.toLowerCase().includes(q) ||
        (f.cctnsFirNumber?.toLowerCase().includes(q) ?? false) ||
        f.complainantName.toLowerCase().includes(q) ||
        f.actsAndSections.toLowerCase().includes(q)
      );
    });
  }, [firs, targetSearch, selectedPrimaryFir]);

  const selectedTargetFir = useMemo(() => {
    return firs.find((f) => f.id === targetFirId || f.firNumber === targetFirId);
  }, [firs, targetFirId]);

  // Manage Tab: FIRs that have linked list
  const firsWithLinks = useMemo(() => {
    return firs.filter((f) => f.linkedFirsList && f.linkedFirsList.length > 0);
  }, [firs]);

  const manageFir = useMemo(() => {
    if (!manageSelectedFirId) {
      return firsWithLinks[0] || firs[0];
    }
    return firs.find((f) => f.id === manageSelectedFirId || f.firNumber === manageSelectedFirId) || firs[0];
  }, [firs, firsWithLinks, manageSelectedFirId]);

  // Submit Link
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrimaryFir) {
      alert("Please select the Primary FIR.");
      return;
    }
    if (!selectedTargetFir) {
      alert("Please select the Target FIR to link.");
      return;
    }
    if (selectedPrimaryFir.id === selectedTargetFir.id) {
      alert("Cannot link an FIR to itself.");
      return;
    }

    const finalReason = customLinkReason.trim()
      ? `${linkReasonPreset} - ${customLinkReason.trim()}`
      : linkReasonPreset;

    setIsSubmitting(true);
    try {
      const res = firService.linkFirs({
        primaryFirId: selectedPrimaryFir.id,
        targetFirId: selectedTargetFir.id,
        linkType,
        reason: finalReason,
        officerName,
      });

      setToastMessage(
        `Successfully linked ${res.primary.firNumber} and ${res.target.firNumber} as ${linkType}.`
      );
      onSuccess(res);

      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(`Linking failed: ${err.message || "An error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delink
  const handleDelinkSubmit = () => {
    if (!manageFir || !delinkTargetNumber) return;

    const finalReason = customDelinkReason.trim()
      ? `${delinkReason} - ${customDelinkReason.trim()}`
      : delinkReason;

    setIsSubmitting(true);
    try {
      const res = firService.delinkFirs({
        primaryFirId: manageFir.id,
        targetFirNumber: delinkTargetNumber,
        reason: finalReason,
        officerName,
      });

      setToastMessage(
        `Successfully delinked FIR ${manageFir.firNumber} from FIR ${delinkTargetNumber}.`
      );
      setIsDelinkConfirmOpen(false);
      setDelinkTargetNumber("");

      if (res.target) {
        onSuccess({ primary: res.primary, target: res.target });
      }

      setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    } catch (err: any) {
      alert(`Delinking failed: ${err.message || "An error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0b192c] via-[#1e293b] to-[#0b192c] text-white px-6 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Link / Duplicate FIR
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500 text-white uppercase tracking-wider">
                  Club Cases
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  | दो FIR को आपस में लिंक / डुप्लीकेट करें
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Reciprocal FIR clubbing under Babubhai doctrine (Duplicate), Cross-FIR, or Connected Offences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("LINK")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === "LINK"
                  ? "bg-white text-purple-700 border-slate-200 border-b-transparent shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Link Two FIRs (दो FIR लिंक करें)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MANAGE")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === "MANAGE"
                  ? "bg-white text-purple-700 border-slate-200 border-b-transparent shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Manage & Delink ({firsWithLinks.length} with links)</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 pb-2">
            <Scale className="w-3.5 h-3.5 text-purple-600" />
            <span>Hon&apos;ble SC T.T. Antony / Babubhai Doctrine Compliant</span>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in-50 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "LINK" ? (
            <form onSubmit={handleLinkSubmit} className="space-y-5">
              {/* Dual FIR Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Primary FIR */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                      Primary FIR (मुख्य प्राथमिकी)
                    </span>
                    <span className="text-[10px] text-slate-500">Case No. 1</span>
                  </div>

                  <div className="relative" ref={primaryDropdownRef}>
                    <div
                      onClick={() => setIsPrimaryOpen(!isPrimaryOpen)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:border-purple-500 shadow-2xs"
                    >
                      {selectedPrimaryFir ? (
                        <div className="truncate">
                          <span className="font-mono font-bold text-red-700">{selectedPrimaryFir.firNumber}</span>
                          <span className="text-slate-400 mx-1">|</span>
                          <span className="text-slate-700 font-semibold">{selectedPrimaryFir.complainantName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select Primary FIR...</span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isPrimaryOpen ? "rotate-90" : ""}`} />
                    </div>

                    {isPrimaryOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden text-xs max-h-56 flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search FIR..."
                            value={primarySearch}
                            onChange={(e) => setPrimarySearch(e.target.value)}
                            className="w-full bg-transparent text-xs focus:outline-hidden"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-100">
                          {filteredPrimaryFirs.map((f) => (
                            <div
                              key={f.id}
                              onClick={() => {
                                setPrimaryFirId(f.id);
                                setIsPrimaryOpen(false);
                              }}
                              className="p-2 hover:bg-purple-50 cursor-pointer"
                            >
                              <div className="font-mono font-bold text-red-700">{f.firNumber}</div>
                              <div className="text-[11px] text-slate-700">{f.complainantName} - {f.actsAndSections}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPrimaryFir && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-800">Date: {formatDate(selectedPrimaryFir.firDate)}</div>
                      <div className="text-slate-600 truncate">{selectedPrimaryFir.actsAndSections}</div>
                      <div className="text-[10px] text-slate-500 truncate">Place: {selectedPrimaryFir.incidentPlace}</div>
                    </div>
                  )}
                </div>

                {/* Column 2: Target FIR */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                      Target FIR (संबद्ध होने वाली FIR)
                    </span>
                    <span className="text-[10px] text-slate-500">Case No. 2</span>
                  </div>

                  <div className="relative" ref={targetDropdownRef}>
                    <div
                      onClick={() => setIsTargetOpen(!isTargetOpen)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:border-purple-500 shadow-2xs"
                    >
                      {selectedTargetFir ? (
                        <div className="truncate">
                          <span className="font-mono font-bold text-red-700">{selectedTargetFir.firNumber}</span>
                          <span className="text-slate-400 mx-1">|</span>
                          <span className="text-slate-700 font-semibold">{selectedTargetFir.complainantName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Select Target FIR to Link...</span>
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isTargetOpen ? "rotate-90" : ""}`} />
                    </div>

                    {isTargetOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden text-xs max-h-56 flex flex-col">
                        <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5">
                          <Search className="w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search FIR..."
                            value={targetSearch}
                            onChange={(e) => setTargetSearch(e.target.value)}
                            className="w-full bg-transparent text-xs focus:outline-hidden"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto divide-y divide-slate-100">
                          {filteredTargetFirs.map((f) => (
                            <div
                              key={f.id}
                              onClick={() => {
                                setTargetFirId(f.id);
                                setIsTargetOpen(false);
                              }}
                              className="p-2 hover:bg-purple-50 cursor-pointer"
                            >
                              <div className="font-mono font-bold text-red-700">{f.firNumber}</div>
                              <div className="text-[11px] text-slate-700">{f.complainantName} - {f.actsAndSections}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedTargetFir && (
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 space-y-1">
                      <div className="font-semibold text-slate-800">Date: {formatDate(selectedTargetFir.firDate)}</div>
                      <div className="text-slate-600 truncate">{selectedTargetFir.actsAndSections}</div>
                      <div className="text-[10px] text-slate-500 truncate">Place: {selectedTargetFir.incidentPlace}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Link Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Linkage Category / Relationship (संबद्धता का प्रकार) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LINK_TYPES.map((type) => (
                    <div
                      key={type.key}
                      onClick={() => setLinkType(type.key as any)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-1.5 ${
                        linkType === type.key
                          ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{type.label}</span>
                        <input
                          type="radio"
                          name="link_type"
                          checked={linkType === type.key}
                          onChange={() => setLinkType(type.key as any)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                      </div>
                      <div className="text-[10px] font-semibold text-purple-700 uppercase">{type.subtitle}</div>
                      <div className="text-[11px] text-slate-500 leading-snug">{type.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Reason & Justification */}
              <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>Statutory Justification & Sanction (कारण एवं आदेश संदर्भ)</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Ground (प्राथमिक कारण):
                  </label>
                  <select
                    value={linkReasonPreset}
                    onChange={(e) => setLinkReasonPreset(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  >
                    {LINK_REASON_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Additional Remarks / Court / SP Order Details:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter judicial order reference, SP memo number, or specific common points linking both cases..."
                    value={customLinkReason}
                    onChange={(e) => setCustomLinkReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Officer Authorizing Linkage</label>
                    <input
                      type="text"
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-end pb-1 text-[11px] text-slate-500">
                    <span>Both FIR records will be linked reciprocally in their respective dossiers and audit trails.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPrimaryFir || !selectedTargetFir}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Linking FIRs...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Link Both FIRs (दोनों FIR को लिंक करें)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Manage / Delink Tab */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-800">
                  Select FIR to inspect or delink connected cases:
                </div>
                <select
                  value={manageFir?.id || ""}
                  onChange={(e) => setManageSelectedFirId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden shadow-2xs"
                >
                  {firs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firNumber} - {f.complainantName} ({f.linkedFirsList?.length || 0} links)
                    </option>
                  ))}
                </select>
              </div>

              {manageFir && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-mono font-black text-red-700 text-sm">{manageFir.firNumber}</span>
                      <span className="text-xs text-slate-600 ml-2">Complainant: {manageFir.complainantName}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Total Links: {manageFir.linkedFirsList?.length || 0}
                    </span>
                  </div>

                  {(!manageFir.linkedFirsList || manageFir.linkedFirsList.length === 0) ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                      This FIR has no linked or duplicate FIRs. Use the &quot;Link Two FIRs&quot; tab to connect cases.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {manageFir.linkedFirsList.map((link) => (
                        <div
                          key={link.id}
                          className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{link.firNumber}</span>
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${
                                  link.linkType === "DUPLICATE"
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : link.linkType === "CROSS"
                                    ? "bg-rose-100 text-rose-800 border-rose-200"
                                    : "bg-blue-100 text-blue-800 border-blue-200"
                                }`}
                              >
                                {link.linkType}
                              </span>
                              {link.complainantName && (
                                <span className="text-[11px] text-slate-500">({link.complainantName})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              <span className="font-semibold text-slate-700">Reason:</span> {link.reason}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Linked by {link.linkedBy} on {link.linkedAt.slice(0, 10)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setDelinkTargetNumber(link.firNumber);
                              setIsDelinkConfirmOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                          >
                            <Unlink className="w-3.5 h-3.5" />
                            <span>Delink (अलग करें)</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Delink Confirmation Dialog */}
              {isDelinkConfirmOpen && (
                <div className="p-4 bg-red-50/90 border border-red-200 rounded-xl text-xs space-y-3 animate-in fade-in-50">
                  <div className="flex items-center gap-2 font-bold text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Confirm Delinking of FIR {manageFir?.firNumber} and FIR {delinkTargetNumber}</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reason for Delinking:
                    </label>
                    <select
                      value={delinkReason}
                      onChange={(e) => setDelinkReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                    >
                      {DELINK_REASON_PRESETS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Optional additional reason / order reference..."
                      value={customDelinkReason}
                      onChange={(e) => setCustomDelinkReason(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsDelinkConfirmOpen(false)}
                      className="px-3 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelinkSubmit}
                      disabled={isSubmitting}
                      className="px-4 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
                    >
                      {isSubmitting ? "Delinking..." : "Confirm Delink"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
