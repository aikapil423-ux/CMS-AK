"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  ArrowRightLeft,
  Building2,
  MapPin,
  Globe2,
  Search,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  History,
  Send,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Scale,
  CheckSquare,
  Square,
  Layers,
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

// All Indian States & UTs EXCLUDING Haryana (since this system is Haryana Police CMS and transfer is Inter-State Only)
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
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Puducherry",
  "Arunachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
];

const STATUTORY_GROUNDS = [
  {
    key: "ZERO_FIR_BNSS",
    label: "Zero FIR Transfer u/s 173(1) BNSS, 2023",
    description: "Offence committed completely outside Haryana territorial jurisdiction; Zero FIR transferred to competent station for regular investigation.",
  },
  {
    key: "JURISDICTION_BNSS_197_209",
    label: "Jurisdiction Transfer u/s 197–209 BNSS, 2023",
    description: "Principal cause of action / continuous series of offences or conspiracy occurred within the destination State / UT.",
  },
  {
    key: "SUPREME_COURT_ORDER",
    label: "Order of the Hon'ble Supreme Court of India",
    description: "Transfer ordered pursuant to judicial directions / Special Leave Petition by the Hon'ble Supreme Court.",
  },
  {
    key: "HIGH_COURT_ORDER",
    label: "Order of the Hon'ble High Court",
    description: "Inter-state transfer ordered under Section 482 CrPC / Section 528 BNSS or writ jurisdiction by High Court.",
  },
  {
    key: "CENTRAL_AGENCY_SIT",
    label: "Takeover by CBI / NIA / Interstate Special Investigation Team",
    description: "Case handed over to designated central investigation agency or inter-state joint team under MHA notification.",
  },
  {
    key: "OTHER_STATUTORY",
    label: "Other Inter-State Administrative Transfer",
    description: "Transfer under Director General of Police (DGP) interstate police coordination sanction.",
  },
];

export function TransferFIRModal({
  isOpen,
  onClose,
  firs,
  onSuccess,
  preSelectedFirId,
}: TransferFIRModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"TRANSFER" | "HISTORY">("TRANSFER");

  // Selection state (Supports MULTIPLE FIRs - 1, 2, 3 or more!)
  const [selectedFirIds, setSelectedFirIds] = useState<string[]>(() =>
    preSelectedFirId ? [preSelectedFirId] : []
  );
  const [firSearchQuery, setFirSearchQuery] = useState("");

  // Destination Details (Inter-State only)
  const [targetState, setTargetState] = useState(INTER_STATE_LIST[0]);
  const [targetDistrict, setTargetDistrict] = useState("");
  const [targetPoliceStation, setTargetPoliceStation] = useState("");

  // Statutory Grounds & Sanction
  const [statutoryGroundKey, setStatutoryGroundKey] = useState(STATUTORY_GROUNDS[0].key);
  const [customTransferReason, setCustomTransferReason] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [dispatchTime, setDispatchTime] = useState(
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
  const [transferredBy, setTransferredBy] = useState(currentUser?.name || "Inspector Rajesh Kumar");
  const [transferredByRank, setTransferredByRank] = useState("SHO / Inspector");
  const [remarks, setRemarks] = useState("");

  // History state
  const [historyList, setHistoryList] = useState<FIRTransferRecord[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pre-selection sync
  useEffect(() => {
    if (preSelectedFirId) {
      setSelectedFirIds((prev) => (prev.includes(preSelectedFirId) ? prev : [preSelectedFirId, ...prev]));
    }
  }, [preSelectedFirId]);

  // Set default order number
  useEffect(() => {
    if (!orderNumber) {
      const rnd = Math.floor(100 + Math.random() * 900);
      setOrderNumber(`SP/GGM/TRF/2026/${rnd}`);
    }
  }, [orderNumber]);

  // Load history
  const loadHistory = () => {
    try {
      const history = firService.getTransferHistory();
      setHistoryList(history);
    } catch (e) {
      console.warn("Could not load FIR transfer history", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  // Filter FIRs for list
  const filteredFirs = useMemo(() => {
    const q = firSearchQuery.trim().toLowerCase();
    if (!q) return firs;
    return firs.filter((f) => {
      return (
        f.firNumber.toLowerCase().includes(q) ||
        (f.cctnsFirNumber?.toLowerCase().includes(q) ?? false) ||
        f.complainantName.toLowerCase().includes(q) ||
        (f.complainantMobile?.includes(q) ?? false) ||
        f.actsAndSections.toLowerCase().includes(q) ||
        f.incidentPlace.toLowerCase().includes(q)
      );
    });
  }, [firs, firSearchQuery]);

  const selectedFirsList = useMemo(() => {
    return firs.filter((f) => selectedFirIds.includes(f.id) || selectedFirIds.includes(f.firNumber));
  }, [firs, selectedFirIds]);

  // Selection helpers
  const toggleSelectFir = (firId: string) => {
    setSelectedFirIds((prev) =>
      prev.includes(firId) ? prev.filter((id) => id !== firId) : [...prev, firId]
    );
  };

  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredFirs.map((f) => f.id);
    setSelectedFirIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const handleClearAllSelected = () => {
    setSelectedFirIds([]);
  };

  // Filter history
  const filteredHistory = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return historyList;
    return historyList.filter((item) => {
      return (
        item.firNumber.toLowerCase().includes(q) ||
        item.targetState.toLowerCase().includes(q) ||
        item.targetDistrict.toLowerCase().includes(q) ||
        item.targetPoliceStation.toLowerCase().includes(q) ||
        item.statutoryGround.toLowerCase().includes(q) ||
        (item.orderNumber?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [historyList, historySearchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFirIds.length === 0) {
      alert("Please select at least one FIR to transfer (You can select multiple FIRs).");
      return;
    }
    if (!targetDistrict.trim()) {
      alert("Please specify the destination District.");
      return;
    }
    if (!targetPoliceStation.trim()) {
      alert("Please specify the destination Police Station.");
      return;
    }

    const groundObj = STATUTORY_GROUNDS.find((g) => g.key === statutoryGroundKey);
    const statutoryGroundLabel = groundObj?.label || statutoryGroundKey;
    const finalReason = customTransferReason.trim()
      ? `${statutoryGroundLabel} - ${customTransferReason.trim()}`
      : groundObj?.description || statutoryGroundLabel;

    setIsSubmitting(true);
    try {
      const updatedList = firService.transferMultipleFirsInterState({
        firIds: selectedFirIds,
        targetState,
        targetDistrict: targetDistrict.trim(),
        targetPoliceStation: targetPoliceStation.trim(),
        statutoryGround: statutoryGroundLabel,
        transferReason: finalReason,
        orderNumber: orderNumber.trim() || undefined,
        orderDate,
        dispatchDate,
        dispatchTime,
        transferredBy,
        transferredByRank,
        remarks: remarks.trim() || undefined,
      });

      setToastMessage(
        `Successfully transferred ${updatedList.length} FIR(s) to ${targetPoliceStation}, ${targetDistrict} (${targetState}).`
      );
      loadHistory();
      onSuccess(updatedList);

      setTimeout(() => {
        setToastMessage(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      alert(`Transfer failed: ${err.message || "An error occurred"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-50">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#0b192c] via-[#1e293b] to-[#0b192c] text-white px-6 py-4.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Transfer FIR (Inter-State Only)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                  Batch & Multi-FIR
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  | अंतर्राज्यीय स्थानांतरण
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Statutory transfer of FIR docket(s) to another State / UT under BNSS 2023 / Zero FIR Jurisdiction
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
              onClick={() => setActiveTab("TRANSFER")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === "TRANSFER"
                  ? "bg-white text-blue-700 border-slate-200 border-b-transparent shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transfer FIR Form (स्थानांतरण प्रपत्र)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 cursor-pointer border-t border-x ${
                activeTab === "HISTORY"
                  ? "bg-white text-blue-700 border-slate-200 border-b-transparent shadow-2xs"
                  : "bg-transparent text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Transfer Register & History ({historyList.length})</span>
            </button>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 pb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Haryana Police CCTNS 2.0 Jurisdiction Protocol</span>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in-50 shadow-sm">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "TRANSFER" ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Important Statutory Notice */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-900">
                    Inter-State Jurisdiction Boundary Notice (अंतर्राज्यीय क्षेत्राधिकार निर्देश)
                  </p>
                  <p className="text-[11px] text-amber-800">
                    This statutory action transfers case docket(s) to another State / UT outside Haryana. You can select single or multiple FIRs (e.g. series of connected inter-state scam FIRs, continuous offences, or clubbed Zero FIRs) to transfer together under one dispatch order.
                  </p>
                </div>
              </div>

              {/* Step 1: Select Source FIRs (Supports Multi-Select: 1, 2, 3 or more FIRs) */}
              <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select FIR(s) to Transfer (प्राथमिकी का चयन करें - एक या अधिक) <span className="text-red-500">*</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      {selectedFirIds.length} FIR{selectedFirIds.length === 1 ? "" : "s"} Selected
                    </span>
                    {filteredFirs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                      >
                        Select All Filtered
                      </button>
                    )}
                    {selectedFirIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSelected}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Chips */}
                {selectedFirsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Selected:</span>
                    {selectedFirsList.map((fir) => (
                      <span
                        key={fir.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-300 rounded-md text-[11px] text-amber-950 font-medium"
                      >
                        <span className="font-mono font-bold text-red-700">{fir.firNumber}</span>
                        <span className="text-slate-500 text-[10px]">({fir.complainantName})</span>
                        <button
                          type="button"
                          onClick={() => toggleSelectFir(fir.id)}
                          className="w-3.5 h-3.5 text-slate-400 hover:text-red-600 rounded-full flex items-center justify-center cursor-pointer ml-0.5"
                          title="Remove from batch"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search Bar for Selection */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by FIR No., Complainant, Accused, Sections, Place to select..."
                    value={firSearchQuery}
                    onChange={(e) => setFirSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>

                {/* FIR Multi-Select List */}
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-inner">
                  {filteredFirs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">No matching FIR found.</div>
                  ) : (
                    filteredFirs.map((fir) => {
                      const isSelected = selectedFirIds.includes(fir.id);
                      return (
                        <div
                          key={fir.id}
                          onClick={() => toggleSelectFir(fir.id)}
                          className={`p-2.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-blue-50/60 ${
                            isSelected ? "bg-blue-50/80 font-medium" : ""
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-red-700 text-xs">{fir.firNumber}</span>
                              <span className="text-[10px] text-slate-500">{formatDate(fir.firDate)} {fir.firTime || "10:00"} hrs</span>
                            </div>
                            <div className="text-[11px] text-slate-800 font-semibold truncate mt-0.5">
                              {fir.complainantName}
                              {fir.complainantMobile ? ` • ${fir.complainantMobile}` : ""}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {fir.actsAndSections} — {fir.incidentPlace}
                            </div>
                            {fir.isTransferred && (
                              <span className="inline-block mt-1 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                Transferred ({fir.transferredToState})
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Destination State / UT (Inter-State Only) */}
              <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                    <Globe2 className="w-4 h-4 text-blue-600" />
                    <span>Step 2: Inter-State Destination Details (गंतव्य राज्य / केंद्र शासित प्रदेश)</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Inter-State Only (Excluding Haryana)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Target State Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination State / UT <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      {INTER_STATE_LIST.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Target District */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination District <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi, Jaipur, Patiala, Noida..."
                      value={targetDistrict}
                      onChange={(e) => setTargetDistrict(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>

                  {/* Target Police Station */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination Police Station / Unit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PS Connaught Place, PS Kotwali..."
                      value={targetPoliceStation}
                      onChange={(e) => setTargetPoliceStation(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Statutory Grounds & Justification */}
              <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Step 3: Statutory Ground for Transfer (स्थानांतरण का वैधानिक आधार)</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {STATUTORY_GROUNDS.map((ground) => (
                    <label
                      key={ground.key}
                      className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        statutoryGroundKey === ground.key
                          ? "bg-blue-50/80 border-blue-400 ring-1 ring-blue-400"
                          : "bg-white border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="statutory_ground"
                        value={ground.key}
                        checked={statutoryGroundKey === ground.key}
                        onChange={() => setStatutoryGroundKey(ground.key)}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">{ground.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{ground.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Justification / Investigation Findings (विस्तृत कारण):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide detailed facts explaining why these cases fall within the jurisdiction of the destination state..."
                    value={customTransferReason}
                    onChange={(e) => setCustomTransferReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Step 4: Sanction Order & Handover Metadata */}
              <div className="p-4 bg-slate-50/60 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Step 4: Sanction Order & Dispatch Details (अनुमति आदेश एवं प्रेषण विवरण)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SP / Court Sanction Order No.</label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Order Reference"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Order Date</label>
                    <input
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dispatch Date</label>
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Dispatch Time</label>
                    <input
                      type="time"
                      value={dispatchTime}
                      onChange={(e) => setDispatchTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Transferring Officer Name</label>
                    <input
                      type="text"
                      value={transferredBy}
                      onChange={(e) => setTransferredBy(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Rank / Designation</label>
                    <input
                      type="text"
                      value={transferredByRank}
                      onChange={(e) => setTransferredByRank(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="text-xs pt-1">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Case Property & Docket Handover Notes (केस डायरी, दस्तावेज एवं जब्त सामग्री विवरण):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter details of case file, physical case property, CD Zimnis, or vehicle handed over to the destination state escort officer..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {selectedFirIds.length === 0
                    ? "Select FIR(s) above to proceed"
                    : `${selectedFirIds.length} FIR${selectedFirIds.length > 1 ? "s" : ""} will be transferred simultaneously`}
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
                    disabled={isSubmitting || selectedFirIds.length === 0}
                    className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Processing Inter-State Transfer...</span>
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>
                          Confirm Transfer ({selectedFirIds.length} FIR{selectedFirIds.length > 1 ? "s" : ""})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search transferred FIRs, state, order no..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Total Inter-State Transfers: {filteredHistory.length}
                </span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 border border-slate-200 rounded-xl">
                  No inter-state FIR transfers recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 text-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-red-700">{item.firNumber}</span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            {item.targetState}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Dispatched: {item.dispatchDate} {item.dispatchTime || ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 pt-1">
                        <div>
                          <span className="text-slate-400">Transferred From:</span>{" "}
                          <span className="font-semibold">{item.sourcePoliceStation}, {item.sourceDistrict} ({item.sourceState})</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Transferred To:</span>{" "}
                          <span className="font-semibold text-blue-700">{item.targetPoliceStation}, {item.targetDistrict} ({item.targetState})</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-800">Statutory Ground:</span> {item.statutoryGround}
                        {item.transferReason && (
                          <div className="mt-0.5 text-slate-600">
                            <span className="font-semibold text-slate-700">Reason:</span> {item.transferReason}
                          </div>
                        )}
                        {item.orderNumber && (
                          <div className="mt-0.5 text-slate-500 font-mono text-[10px]">
                            Sanction Order: {item.orderNumber} {item.orderDate ? `(Dated: ${item.orderDate})` : ""}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Transferred by: {item.transferredBy} ({item.transferredByRank || "SHO"})</span>
                        {item.remarks && <span className="italic truncate max-w-xs">{item.remarks}</span>}
                      </div>
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
