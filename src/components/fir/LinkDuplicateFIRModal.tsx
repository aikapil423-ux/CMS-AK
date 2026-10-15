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
  CheckSquare,
  Square,
  Network,
} from "lucide-react";
import { FIRItem, LinkedFIREntry } from "@/types";
import { firService } from "@/services/firService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

interface LinkDuplicateFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  firs: FIRItem[];
  onSuccess: (result: { primary: FIRItem; targets: FIRItem[] }) => void;
  preSelectedFirId?: string;
}

const LINK_TYPES = [
  {
    key: "DUPLICATE",
    label: "Duplicate FIR (दोहराव प्राथमिकी)",
    subtitle: "Same Occurrence / Babubhai Doctrine",
    description:
      "Multiple FIRs registered for the same incident / continuous transaction. Clubbed together under T.T. Antony (2001) & Babubhai (2010) SC rulings.",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  {
    key: "CROSS",
    label: "Cross-FIR / Counter Cases (क्रॉस प्राथमिकी)",
    subtitle: "Mutual Clashes / Rival Parties",
    description:
      "Cross-allegations between multiple opposing factions regarding the same fight/incident. All connected counter cases investigated jointly.",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
  },
  {
    key: "CONNECTED",
    label: "Connected Matter / Gang Syndicate (संबद्ध प्रकरण)",
    subtitle: "Conspiracy / Gang Syndicate / Stolen Property",
    description:
      "Multiple distinct FIRs connected via common criminal conspiracy, interstate syndicate, recovery of common stolen property, or common accused.",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
] as const;

const LINK_REASON_PRESETS = [
  "Identical place, time, and incident reported in multiple FIRs; clubbed under Babubhai doctrine",
  "Mutual cross-cases registered by rival groups arising out of the same altercation/clash",
  "Common interstate crime syndicate and recovered property linked across all these cases",
  "Judicial order / SP direction directing joint trial or simultaneous investigation of all linked FIRs",
  "Supplementary evidence and identical prime suspect identified in this series of crimes",
];

const DELINK_REASON_PRESETS = [
  "Subsequent investigation established distinct occurrences and unrelated accused persons",
  "Judicial order directing separate and independent trial for these FIRs",
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

  // === LINK MODE STATE (Supports linking 2, 3, 4, 5+ FIRs together!) ===
  const [primaryFirId, setPrimaryFirId] = useState<string>(preSelectedFirId || "");
  const [targetFirIds, setTargetFirIds] = useState<string[]>([]);
  const [primarySearch, setPrimarySearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [isPrimaryOpen, setIsPrimaryOpen] = useState(false);
  const primaryDropdownRef = useRef<HTMLDivElement>(null);

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
        f.actsAndSections.toLowerCase().includes(q) ||
        f.incidentPlace.toLowerCase().includes(q)
      );
    });
  }, [firs, targetSearch, selectedPrimaryFir]);

  const selectedTargetFirsList = useMemo(() => {
    return firs.filter((f) => targetFirIds.includes(f.id) || targetFirIds.includes(f.firNumber));
  }, [firs, targetFirIds]);

  // Toggle Target FIR Selection
  const toggleSelectTargetFir = (firId: string) => {
    setTargetFirIds((prev) =>
      prev.includes(firId) ? prev.filter((id) => id !== firId) : [...prev, firId]
    );
  };

  const handleSelectAllTargets = () => {
    const idsToAdd = filteredTargetFirs.map((f) => f.id);
    setTargetFirIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearTargets = () => {
    setTargetFirIds([]);
  };

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

  // Submit Link Multiple FIRs
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrimaryFir) {
      alert("Please select the Primary FIR.");
      return;
    }
    if (targetFirIds.length === 0) {
      alert("Please select at least one Target FIR to link (You can select multiple FIRs).");
      return;
    }

    const finalReason = customLinkReason.trim()
      ? `${linkReasonPreset} - ${customLinkReason.trim()}`
      : linkReasonPreset;

    setIsSubmitting(true);
    try {
      const res = firService.linkMultipleFirs({
        primaryFirId: selectedPrimaryFir.id,
        targetFirIds,
        linkType,
        reason: finalReason,
        officerName,
      });

      const totalLinked = 1 + res.targets.length;
      setToastMessage(
        `Successfully linked ${totalLinked} FIRs (${res.primary.firNumber} + ${res.targets.map((t) => t.firNumber).join(", ")}) as ${linkType}.`
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

      onSuccess({
        primary: res.primary,
        targets: res.target ? [res.target] : [],
      });

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

  const totalCasesInCluster = (selectedPrimaryFir ? 1 : 0) + targetFirIds.length;

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
                  Multi-FIR Linking
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  | दो या अधिक FIR को आपस में लिंक / डुप्लीकेट करें
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Reciprocal FIR clubbing under Babubhai doctrine (Duplicate), Cross-FIR, or Connected Offences (Link 2, 3, 4+ FIRs)
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
              <Network className="w-3.5 h-3.5" />
              <span>Link FIRs Cluster (FIR संबद्ध करें)</span>
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
            <span>Hon&apos;ble SC T.T. Antony / Babubhai Multi-Case Doctrine Compliant</span>
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
              {/* Cluster Size Counter Banner */}
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-950">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-700" />
                  <span className="font-bold">
                    Multi-FIR Link Cluster:{" "}
                    <span className="text-purple-700 underline">
                      {totalCasesInCluster} FIR{totalCasesInCluster === 1 ? "" : "s"}
                    </span>{" "}
                    being connected
                  </span>
                </div>
                <span className="text-[11px] text-purple-800">
                  Select 1 Primary Lead FIR + 1 or more Target FIRs (2, 3, 4+ cases)
                </span>
              </div>

              {/* Step 1: Primary Anchor FIR */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    Step 1: Select Primary / Anchor FIR (मुख्य प्राथमिकी - लीड केस) <span className="text-red-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Lead Case</span>
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
                        <span className="text-slate-400 mx-1">|</span>
                        <span className="text-slate-500 text-[11px]">{selectedPrimaryFir.actsAndSections}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Select Primary Lead FIR...</span>
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
                              // Remove primary from target if already there
                              setTargetFirIds((prev) => prev.filter((id) => id !== f.id));
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
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">Date: {formatDate(selectedPrimaryFir.firDate)} {selectedPrimaryFir.firTime || "10:00"} hrs</span>
                      <span className="text-slate-500 font-mono text-[10px]">{selectedPrimaryFir.cctnsFirNumber || "LOCAL"}</span>
                    </div>
                    <div className="text-slate-600 truncate">{selectedPrimaryFir.actsAndSections}</div>
                    <div className="text-[10px] text-slate-500 truncate">Place: {selectedPrimaryFir.incidentPlace}</div>
                  </div>
                )}
              </div>

              {/* Step 2: Target FIRs (Multi-Select: 1, 2, 3, 4, 5+ FIRs) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    Step 2: Select Target FIR(s) to Link (संबद्ध होने वाली अन्य FIRs - एक या एकाधिक) <span className="text-red-500">*</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {targetFirIds.length} Target FIR{targetFirIds.length === 1 ? "" : "s"} Selected
                    </span>
                    {filteredTargetFirs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllTargets}
                        className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                      >
                        Select All
                      </button>
                    )}
                    {targetFirIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearTargets}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Target FIR Chips */}
                {selectedTargetFirsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Linking:</span>
                    {selectedTargetFirsList.map((fir) => (
                      <span
                        key={fir.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 border border-purple-300 rounded-md text-[11px] text-purple-950 font-medium"
                      >
                        <span className="font-mono font-bold text-purple-800">{fir.firNumber}</span>
                        <span className="text-slate-500 text-[10px]">({fir.complainantName})</span>
                        <button
                          type="button"
                          onClick={() => toggleSelectTargetFir(fir.id)}
                          className="w-3.5 h-3.5 text-slate-400 hover:text-red-600 rounded-full flex items-center justify-center cursor-pointer ml-0.5"
                          title="Remove from linkage list"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search Bar for Targets */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search target FIRs by number, complainant, sections to link..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  />
                </div>

                {/* Target FIRs Checkbox List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-inner">
                  {filteredTargetFirs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No available target FIRs.</div>
                  ) : (
                    filteredTargetFirs.map((fir) => {
                      const isSelected = targetFirIds.includes(fir.id);
                      return (
                        <div
                          key={fir.id}
                          onClick={() => toggleSelectTargetFir(fir.id)}
                          className={`p-2.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-purple-50/60 ${
                            isSelected ? "bg-purple-50/80 font-medium" : ""
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-purple-700" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-red-700 text-xs">{fir.firNumber}</span>
                              <span className="text-[10px] text-slate-500">{formatDate(fir.firDate)}</span>
                            </div>
                            <div className="text-[11px] text-slate-800 font-semibold truncate mt-0.5">
                              {fir.complainantName}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {fir.actsAndSections} — {fir.incidentPlace}
                            </div>
                            {fir.linkedFirsList && fir.linkedFirsList.length > 0 && (
                              <span className="inline-block mt-1 text-[9px] font-bold bg-blue-50 text-blue-800 px-1.5 py-0.2 rounded border border-blue-200">
                                Already linked with {fir.linkedFirsList.length} FIR(s)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
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
                    placeholder="Enter judicial order reference, SP memo number, or specific common points linking this cluster of cases..."
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
                    <span>All selected FIR records will be linked reciprocally in their respective dossiers and audit trails.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {targetFirIds.length === 0
                    ? "Select target FIRs above to link"
                    : `${totalCasesInCluster} FIRs will be reciprocally linked`}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPrimaryFir || targetFirIds.length === 0}
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
                        <span>Link All {totalCasesInCluster} FIRs Together (संबद्ध करें)</span>
                      </>
                    )}
                  </button>
                </div>
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
                      Total Links in Cluster: {manageFir.linkedFirsList?.length || 0}
                    </span>
                  </div>

                  {(!manageFir.linkedFirsList || manageFir.linkedFirsList.length === 0) ? (
                    <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                      This FIR has no linked or duplicate FIRs. Use the &quot;Link FIRs Cluster&quot; tab to connect cases.
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
