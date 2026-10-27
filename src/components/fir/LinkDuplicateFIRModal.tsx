"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Link2,
  Unlink,
  Search,
  CheckCircle,
  Layers,
  CheckSquare,
  Square,
  Network,
} from "lucide-react";
import { FIRItem } from "@/types";
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

const LINK_CATEGORIES = [
  { key: "DUPLICATE", label: "Duplicate FIR", desc: "Same occurrence (Babubhai doctrine)" },
  { key: "CROSS", label: "Cross-FIR", desc: "Counter cases / mutual altercation" },
  { key: "CONNECTED", label: "Connected Matter", desc: "Same syndicate / conspiracy" },
] as const;

const REASON_PRESETS = [
  "Identical place, time, and incident reported; clubbed under Babubhai doctrine",
  "Mutual cross-cases registered by rival groups arising out of the same altercation",
  "Common interstate crime syndicate and recovered property linked across these cases",
  "Judicial order / SP direction directing joint trial or simultaneous investigation",
];

export function LinkDuplicateFIRModal({
  isOpen,
  onClose,
  firs,
  onSuccess,
  preSelectedFirId,
}: LinkDuplicateFIRModalProps) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<"LINK" | "RECORDS">("LINK");

  // Primary FIR (Lead case)
  const [primaryFirId, setPrimaryFirId] = useState<string>(preSelectedFirId || "");

  // Multiple Target FIRs to link (1, 2, 3, 4+ FIRs)
  const [targetFirIds, setTargetFirIds] = useState<string[]>([]);
  const [targetSearch, setTargetSearch] = useState("");

  // Linkage settings
  const [linkType, setLinkType] = useState<"DUPLICATE" | "CROSS" | "CONNECTED">("DUPLICATE");
  const [reason, setReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState("");
  const [officerName, setOfficerName] = useState(currentUser?.name || "Inspector Rajesh Kumar (SHO)");

  // Manage tab
  const [manageSelectedId, setManageSelectedId] = useState<string>(preSelectedFirId || "");
  const [delinkConfirmNumber, setDelinkConfirmNumber] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync pre-selection
  useEffect(() => {
    if (preSelectedFirId) {
      setPrimaryFirId(preSelectedFirId);
      setManageSelectedId(preSelectedFirId);
    }
  }, [preSelectedFirId]);

  // Sync active user
  useEffect(() => {
    if (currentUser?.name) {
      setOfficerName(
        `${currentUser.name} (${currentUser.rankDisplay || currentUser.roleDisplay || "Officer"})`
      );
    }
  }, [currentUser, isOpen]);

  // Primary FIR object
  const primaryFir = useMemo(() => {
    return firs.find((f) => f.id === primaryFirId || f.firNumber === primaryFirId);
  }, [firs, primaryFirId]);

  // Target FIRs filtered list (excluding primary FIR)
  const availableTargets = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    const list = firs.filter((f) => f.id !== primaryFir?.id);
    if (!q) return list;
    return list.filter((f) => {
      return (
        f.firNumber.toLowerCase().includes(q) ||
        f.complainantName.toLowerCase().includes(q) ||
        f.actsAndSections.toLowerCase().includes(q)
      );
    });
  }, [firs, targetSearch, primaryFir]);

  const selectedTargets = useMemo(() => {
    return firs.filter((f) => targetFirIds.includes(f.id) || targetFirIds.includes(f.firNumber));
  }, [firs, targetFirIds]);

  const toggleTarget = (id: string) => {
    setTargetFirIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // FIRs that have links
  const firsWithLinks = useMemo(() => {
    return firs.filter((f) => f.linkedFirsList && f.linkedFirsList.length > 0);
  }, [firs]);

  const manageFir = useMemo(() => {
    if (!manageSelectedId) return firsWithLinks[0] || firs[0];
    return firs.find((f) => f.id === manageSelectedId || f.firNumber === manageSelectedId) || firs[0];
  }, [firs, firsWithLinks, manageSelectedId]);

  // Submit Link
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFir) {
      alert("कृपया मुख्य FIR चुनें (Please select Primary FIR).");
      return;
    }
    if (targetFirIds.length === 0) {
      alert("कृपया लिंक करने हेतु कम से कम एक अन्य FIR चुनें (Please select at least one Target FIR).");
      return;
    }

    const finalReason = customReason.trim() ? `${reason} - ${customReason.trim()}` : reason;

    setSubmitting(true);
    try {
      const res = firService.linkMultipleFirs({
        primaryFirId: primaryFir.id,
        targetFirIds,
        linkType,
        reason: finalReason,
        officerName,
      });

      const totalLinked = 1 + res.targets.length;
      setToast(`${totalLinked} FIRs को सफलतापूर्वक लिंक किया गया (${linkType})।`);
      onSuccess(res);

      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to link FIRs"}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delink
  const handleDelinkSubmit = (targetFirNumber: string, targetFirId: string) => {
    if (!manageFir) return;

    setSubmitting(true);
    try {
      const res = firService.delinkFirs({
        primaryFirId: manageFir.id,
        targetFirNumber,
        targetFirId,
        reason: "Delinked on officer directive",
        officerName,
      });

      setToast(`FIR ${manageFir.firNumber} और ${targetFirNumber} को अलग (Delink) कर दिया गया।`);
      setDelinkConfirmNumber(null);
      onSuccess({
        primary: res.primary,
        targets: res.target ? [res.target] : [],
      });

      setTimeout(() => {
        setToast(null);
      }, 2000);
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to delink FIR"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalCluster = (primaryFir ? 1 : 0) + targetFirIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-xs">
        {/* Minimalist Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold tracking-tight text-white">
              Link / Duplicate FIR
            </h2>
            <span className="text-[11px] text-slate-400 font-normal">| दो या अधिक FIR लिंक करें</span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimalist Tabs */}
        <div className="px-5 pt-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab("LINK")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-all cursor-pointer ${
                tab === "LINK"
                  ? "bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Link FIRs ({totalCluster})
            </button>
            <button
              type="button"
              onClick={() => setTab("RECORDS")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-all cursor-pointer ${
                tab === "RECORDS"
                  ? "bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Linked Records ({firsWithLinks.length})
            </button>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Babubhai Doctrine</span>
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-5 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toast}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === "LINK" ? (
            <form onSubmit={handleLinkSubmit} className="space-y-4">
              {/* 1. Primary Lead FIR */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  1. Primary Lead FIR (मुख्य प्राथमिकी):
                </label>
                <select
                  value={primaryFirId}
                  onChange={(e) => {
                    setPrimaryFirId(e.target.value);
                    setTargetFirIds((prev) => prev.filter((id) => id !== e.target.value));
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:border-purple-500"
                >
                  <option value="">-- Choose Primary FIR --</option>
                  {firs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firNumber} — {f.complainantName} ({f.actsAndSections})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Target FIRs to Link (1, 2, 3, or more) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    2. Select Target FIR(s) to Link (संबद्ध होने वाली अन्य FIRs):
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {targetFirIds.length} selected
                    </span>
                    {targetFirIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTargetFirIds([])}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Targets Chips */}
                {selectedTargets.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-purple-50/60 border border-purple-200 rounded-lg">
                    {selectedTargets.map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-purple-300 rounded text-[11px]"
                      >
                        <strong className="text-purple-900">{f.firNumber}</strong>
                        <span className="text-slate-400">({f.complainantName})</span>
                        <button
                          type="button"
                          onClick={() => toggleTarget(f.id)}
                          className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search & Selection List */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search target FIR by No., Complainant..."
                    value={targetSearch}
                    onChange={(e) => setTargetSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                  {availableTargets.length === 0 ? (
                    <div className="p-3 text-center text-slate-400">No available target FIRs.</div>
                  ) : (
                    availableTargets.map((fir) => {
                      const isSel = targetFirIds.includes(fir.id);
                      return (
                        <div
                          key={fir.id}
                          onClick={() => toggleTarget(fir.id)}
                          className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
                            isSel ? "bg-purple-50/70" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSel ? (
                              <CheckSquare className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            )}
                            <span className="font-mono font-bold text-red-700">{fir.firNumber}</span>
                            <span className="text-slate-700">{fir.complainantName}</span>
                            <span className="text-slate-400 hidden sm:inline">• {fir.actsAndSections}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{formatDate(fir.firDate)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. Linkage Category */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800">
                  3. Link Type (संबद्धता का प्रकार):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {LINK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setLinkType(cat.key as any)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        linkType === cat.key
                          ? "bg-purple-50 border-purple-500 ring-1 ring-purple-500 text-purple-950"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="font-bold text-xs">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{cat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Reason */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800">
                  4. Reason / Judicial Order Reference (कारण):
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                >
                  {REASON_PRESETS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Optional remarks / SP order reference..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-500 text-[11px]">
                  Total {totalCluster} FIR(s) will be reciprocally linked.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !primaryFir || targetFirIds.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Link ({totalCluster} FIRs)</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Records / Delink Tab */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="text-xs font-semibold text-slate-700">Select FIR to view connected cases:</label>
                <select
                  value={manageFir?.id || ""}
                  onChange={(e) => setManageSelectedId(e.target.value)}
                  className="p-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold"
                >
                  {firs.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firNumber} ({f.linkedFirsList?.length || 0} links)
                    </option>
                  ))}
                </select>
              </div>

              {manageFir && (!manageFir.linkedFirsList || manageFir.linkedFirsList.length === 0) ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-lg">
                  No linked FIRs found for {manageFir.firNumber}.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {manageFir?.linkedFirsList?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-purple-900">{item.firNumber}</span>
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">
                            {item.linkType}
                          </span>
                          {item.complainantName && (
                            <span className="text-slate-500 text-[11px]">({item.complainantName})</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{item.reason}</div>
                      </div>

                      {delinkConfirmNumber === item.firId ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelinkSubmit(item.firNumber, item.firId)}
                            disabled={submitting}
                            className="px-2.5 py-1 bg-red-600 text-white rounded text-[11px] font-bold hover:bg-red-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDelinkConfirmNumber(null)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-800 text-[11px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDelinkConfirmNumber(item.firId)}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Unlink className="w-3 h-3" />
                          <span>Delink</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
