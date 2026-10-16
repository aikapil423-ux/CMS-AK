"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ArrowRightLeft,
  Building2,
  MapPin,
  Search,
  CheckCircle,
  Calendar,
  Clock,
  Send,
  History,
  CheckSquare,
  Square,
  ChevronRight,
} from "lucide-react";
import { FIRItem, FIRTransferRecord } from "@/types";
import { firService } from "@/services/firService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

interface TransferFIRModalProps {
  isOpen: boolean;
  onClose: () => void;
  firs: FIRItem[];
  onSuccess: (updatedFirs: FIRItem[]) => void;
  preSelectedFirId?: string;
}

const INTER_STATE_LIST = [
  "Delhi (NCT)",
  "Punjab",
  "Rajasthan",
  "Uttar Pradesh",
  "Chandigarh (UT)",
  "Himachal Pradesh",
  "Uttarakhand",
  "Madhya Pradesh",
  "Bihar",
  "Maharashtra",
  "Gujarat",
  "Jammu and Kashmir",
  "Ladakh",
  "West Bengal",
  "Karnataka",
  "Telangana",
  "Andhra Pradesh",
  "Tamil Nadu",
  "Kerala",
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "Assam",
  "Goa",
  "Other State / UT",
];

const STATUTORY_GROUNDS = [
  "Zero FIR Transfer u/s 173(1) BNSS, 2023",
  "Jurisdiction Transfer u/s 197–209 BNSS, 2023",
  "Order of Hon'ble Supreme Court / High Court",
  "Takeover by CBI / NIA / Interstate Special Cell",
  "Administrative Transfer under DGP Coordination",
];

interface FirDestItem {
  targetState: string;
  targetDistrict: string;
  targetPoliceStation: string;
}

export function TransferFIRModal({
  isOpen,
  onClose,
  firs,
  onSuccess,
  preSelectedFirId,
}: TransferFIRModalProps) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState<"TRANSFER" | "HISTORY">("TRANSFER");

  // Multi-selection of FIRs
  const [selectedFirIds, setSelectedFirIds] = useState<string[]>(() =>
    preSelectedFirId ? [preSelectedFirId] : []
  );
  const [search, setSearch] = useState("");

  // Destination Mode: "SAME" or "DIFFERENT"
  const [destMode, setDestMode] = useState<"SAME" | "DIFFERENT">("SAME");

  // Common destination (if same)
  const [commonState, setCommonState] = useState(INTER_STATE_LIST[0]);
  const [commonDistrict, setCommonDistrict] = useState("");
  const [commonStation, setCommonStation] = useState("");

  // Individual destinations per FIR: { [firId]: FirDestItem }
  const [perFirDest, setPerFirDest] = useState<Record<string, FirDestItem>>({});

  // Transfer metadata
  const [ground, setGround] = useState(STATUTORY_GROUNDS[0]);
  const [orderNumber, setOrderNumber] = useState("");
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferredBy, setTransferredBy] = useState(currentUser?.name || "Inspector Rajesh Kumar (SHO)");

  // History & toast
  const [historyList, setHistoryList] = useState<FIRTransferRecord[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync pre-selection
  useEffect(() => {
    if (preSelectedFirId) {
      setSelectedFirIds((prev) => (prev.includes(preSelectedFirId) ? prev : [preSelectedFirId, ...prev]));
    }
  }, [preSelectedFirId]);

  // Sync active user
  useEffect(() => {
    if (currentUser?.name) {
      setTransferredBy(
        `${currentUser.name} (${currentUser.rankDisplay || currentUser.roleDisplay || "Officer"})`
      );
    }
  }, [currentUser, isOpen]);

  // Default order number
  useEffect(() => {
    if (!orderNumber) {
      const rnd = Math.floor(100 + Math.random() * 900);
      setOrderNumber(`SP/GGM/TRF/2026/${rnd}`);
    }
  }, [orderNumber]);

  // Load history
  const loadHistory = () => {
    try {
      const list = firService.getTransferHistory();
      setHistoryList(list);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, tab]);

  // Filtered FIRs
  const filteredFirs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return firs;
    return firs.filter((f) => {
      return (
        f.firNumber.toLowerCase().includes(q) ||
        f.complainantName.toLowerCase().includes(q) ||
        f.actsAndSections.toLowerCase().includes(q) ||
        f.incidentPlace.toLowerCase().includes(q)
      );
    });
  }, [firs, search]);

  const selectedFirs = useMemo(() => {
    return firs.filter((f) => selectedFirIds.includes(f.id) || selectedFirIds.includes(f.firNumber));
  }, [firs, selectedFirIds]);

  // Selection toggle
  const toggleFir = (id: string) => {
    setSelectedFirIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Sync perFirDest
  useEffect(() => {
    setPerFirDest((prev) => {
      const next = { ...prev };
      for (const id of selectedFirIds) {
        if (!next[id]) {
          next[id] = {
            targetState: commonState,
            targetDistrict: commonDistrict,
            targetPoliceStation: commonStation,
          };
        }
      }
      return next;
    });
  }, [selectedFirIds, commonState, commonDistrict, commonStation]);

  const updateIndividualDest = (firId: string, field: keyof FirDestItem, val: string) => {
    setPerFirDest((prev) => {
      const current = prev[firId] || {
        targetState: commonState,
        targetDistrict: commonDistrict,
        targetPoliceStation: commonStation,
      };
      return {
        ...prev,
        [firId]: {
          ...current,
          [field]: val,
        },
      };
    });
  };

  // Filtered history
  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return historyList;
    return historyList.filter((item) => {
      return (
        item.firNumber.toLowerCase().includes(q) ||
        item.targetState.toLowerCase().includes(q) ||
        item.targetDistrict.toLowerCase().includes(q) ||
        item.targetPoliceStation.toLowerCase().includes(q) ||
        (item.complainantName?.toLowerCase().includes(q) ?? false) ||
        (item.orderNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [historyList, historySearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFirIds.length === 0) {
      alert("कृपया कम से कम एक FIR चुनें (Please select at least one FIR).");
      return;
    }

    if (destMode === "SAME") {
      if (!commonDistrict.trim() || !commonStation.trim()) {
        alert("कृपया गंतव्य ज़िला एवं पुलिस स्टेशन दर्ज करें (Please enter District & Police Station).");
        return;
      }
    } else {
      for (const id of selectedFirIds) {
        const d = perFirDest[id];
        const f = firs.find((item) => item.id === id);
        if (!d?.targetDistrict?.trim() || !d?.targetPoliceStation?.trim()) {
          alert(`FIR ${f?.firNumber || id} के लिए ज़िला व पुलिस स्टेशन भरें।`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const updated = firService.transferMultipleFirsInterState({
        firIds: selectedFirIds,
        firDestinations: destMode === "DIFFERENT" ? perFirDest : undefined,
        targetState: commonState,
        targetDistrict: commonDistrict.trim(),
        targetPoliceStation: commonStation.trim(),
        statutoryGround: ground,
        transferReason: ground,
        orderNumber: orderNumber.trim(),
        dispatchDate,
        transferredBy,
      });

      setToast(`${updated.length} FIR(s) सफलतापूर्वक स्थानांतरित की गईं।`);
      loadHistory();
      onSuccess(updated);

      setTimeout(() => {
        setToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Error: ${err.message || "Failed to transfer FIR"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-xs">
        {/* Minimalist Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold tracking-tight text-white">
              Transfer FIR (Inter-State Only)
            </h2>
            <span className="text-[11px] text-slate-400 font-normal">| अंतर्राज्यीय स्थानांतरण</span>
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
              onClick={() => setTab("TRANSFER")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-all cursor-pointer ${
                tab === "TRANSFER"
                  ? "bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Transfer FIR ({selectedFirIds.length})
            </button>
            <button
              type="button"
              onClick={() => setTab("HISTORY")}
              className={`px-3 py-1.5 text-xs font-bold rounded-t-md transition-all cursor-pointer ${
                tab === "HISTORY"
                  ? "bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Transfer History ({historyList.length})
            </button>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">Haryana Police CMS</span>
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
          {tab === "TRANSFER" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. FIR Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    1. Select FIR(s) to Transfer:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {selectedFirIds.length} selected
                    </span>
                    {selectedFirIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedFirIds([])}
                        className="text-[11px] text-red-600 hover:underline cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Chips */}
                {selectedFirs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {selectedFirs.map((fir) => (
                      <span
                        key={fir.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-300 rounded text-[11px] text-slate-800"
                      >
                        <strong className="text-red-700">{fir.firNumber}</strong>
                        <span className="text-slate-400">({fir.complainantName})</span>
                        <button
                          type="button"
                          onClick={() => toggleFir(fir.id)}
                          className="text-slate-400 hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search & List */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search FIR No., Complainant, Sections..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                  {filteredFirs.length === 0 ? (
                    <div className="p-3 text-center text-slate-400">No FIR found.</div>
                  ) : (
                    filteredFirs.map((fir) => {
                      const isSel = selectedFirIds.includes(fir.id);
                      return (
                        <div
                          key={fir.id}
                          onClick={() => toggleFir(fir.id)}
                          className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
                            isSel ? "bg-blue-50/70" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isSel ? (
                              <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

              {/* 2. Destination (Same or Different) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    2. Destination Station & District (गंतव्य):
                  </label>
                  {selectedFirIds.length > 1 && (
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                      <button
                        type="button"
                        onClick={() => setDestMode("SAME")}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                          destMode === "SAME" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                        }`}
                      >
                        Same for All
                      </button>
                      <button
                        type="button"
                        onClick={() => setDestMode("DIFFERENT")}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                          destMode === "DIFFERENT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                        }`}
                      >
                        Different per FIR (अलग-अलग)
                      </button>
                    </div>
                  )}
                </div>

                {destMode === "SAME" || selectedFirIds.length <= 1 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">State / UT:</span>
                      <select
                        value={commonState}
                        onChange={(e) => setCommonState(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs font-semibold"
                      >
                        {INTER_STATE_LIST.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">District:</span>
                      <input
                        type="text"
                        placeholder="e.g. New Delhi, Patiala, Jaipur"
                        value={commonDistrict}
                        onChange={(e) => setCommonDistrict(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">Police Station:</span>
                      <input
                        type="text"
                        placeholder="e.g. PS Connaught Place"
                        value={commonStation}
                        onChange={(e) => setCommonStation(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  /* Different Destinations per FIR */
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedFirs.map((fir) => {
                      const dest = perFirDest[fir.id] || {
                        targetState: commonState,
                        targetDistrict: commonDistrict,
                        targetPoliceStation: commonStation,
                      };
                      return (
                        <div
                          key={fir.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-red-700">{fir.firNumber}</span>
                            <span className="text-slate-500">{fir.complainantName}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                              value={dest.targetState}
                              onChange={(e) =>
                                updateIndividualDest(fir.id, "targetState", e.target.value)
                              }
                              className="p-1 bg-white border border-slate-300 rounded text-xs"
                            >
                              {INTER_STATE_LIST.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="District"
                              value={dest.targetDistrict}
                              onChange={(e) =>
                                updateIndividualDest(fir.id, "targetDistrict", e.target.value)
                              }
                              className="p-1 bg-white border border-slate-300 rounded text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Police Station"
                              value={dest.targetPoliceStation}
                              onChange={(e) =>
                                updateIndividualDest(fir.id, "targetPoliceStation", e.target.value)
                              }
                              className="p-1 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Reason & Authority */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">Statutory Reason:</span>
                  <select
                    value={ground}
                    onChange={(e) => setGround(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                  >
                    {STATUTORY_GROUNDS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">SP / Court Order No.:</span>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-0.5 font-semibold">Dispatch Date:</span>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-500 text-[11px]">
                  {selectedFirIds.length} FIR(s) will be transferred and logged in history.
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
                    disabled={submitting || selectedFirIds.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Transfer ({selectedFirIds.length})</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* History Register Tab (कब, कहाँ, कौनसी FIR) */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search history by FIR No., Complainant, District, Station..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <span className="text-[11px] text-slate-500 font-semibold whitespace-nowrap">
                  Total Transfers: {filteredHistory.length}
                </span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 border border-slate-200 rounded-lg">
                  No transfer records found.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <th className="py-2 px-3">कौनसी FIR</th>
                        <th className="py-2 px-3">कब गया (Date & Time)</th>
                        <th className="py-2 px-3">कहाँ गया (Destination)</th>
                        <th className="py-2 px-3">आदेश व अधिकृत अधिकारी</th>
                        <th className="py-2 px-3">कारण / Ground</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 align-top">
                            <span className="font-mono font-bold text-red-700 block">{item.firNumber}</span>
                            {item.complainantName && (
                              <span className="text-[11px] text-slate-600 block">{item.complainantName}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 align-top whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{item.dispatchDate}</div>
                            <div className="text-[10px] text-slate-400">{item.dispatchTime || "10:00"} hrs</div>
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <div className="font-bold text-blue-700">{item.targetPoliceStation}</div>
                            <div className="text-[11px] text-slate-600">
                              {item.targetDistrict}, {item.targetState}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <div className="font-mono text-[11px] text-slate-800">{item.orderNumber || "—"}</div>
                            <div className="text-[10px] text-slate-500">{item.transferredBy}</div>
                          </td>
                          <td className="py-2.5 px-3 align-top max-w-xs text-slate-600 text-[11px]">
                            {item.statutoryGround}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
