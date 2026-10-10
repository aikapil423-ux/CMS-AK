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
} from "lucide-react";
import { ComplaintItem, ComplaintTransferRecord } from "@/types";
import { ComplaintService } from "@/services/complaintService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

interface TransferComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: ComplaintItem[];
  onTransferSuccess: (updatedComplaint: ComplaintItem) => void;
  preSelectedComplaintId?: string;
}

const HARYANA_DISTRICTS = [
  "Gurugram",
  "Faridabad",
  "Karnal",
  "Panipat",
  "Rohtak",
  "Sonipat",
  "Ambala",
  "Panchkula",
  "Hisar",
  "Sirsa",
  "Jhajjar",
  "Rewari",
  "Palwal",
  "Kurukshetra",
  "Bhiwani",
  "Yamunanagar",
  "Fatehabad",
  "Kaithal",
  "Jind",
  "Mahendragarh",
  "Charkhi Dadri",
  "Nuh",
];

const GURUGRAM_STATIONS = [
  "PS DLF Phase 1",
  "PS DLF Phase 2",
  "PS DLF Phase 3",
  "PS Sector 29",
  "PS Sector 40",
  "PS Sector 53",
  "PS Sector 56",
  "PS Sadar Gurugram",
  "PS Sushant Lok",
  "PS Cyber Crime East",
  "PS Cyber Crime West",
  "PS Badshahpur",
  "PS Kherki Daula",
  "PS Manesar",
  "PS Bilaspur",
  "PS Pataudi",
  "PS Sector 10A",
  "PS Sector 14",
  "PS Sector 18",
  "PS Sector 5",
  "PS Civil Lines Gurugram",
  "PS Metro Gurugram",
  "Women Police Station East",
  "Women Police Station West",
  "Traffic Police Station East",
];

const STATES_LIST = [
  "Delhi",
  "Uttar Pradesh",
  "Rajasthan",
  "Punjab",
  "Chandigarh",
  "Himachal Pradesh",
  "Uttarakhand",
  "Madhya Pradesh",
  "Bihar",
  "Maharashtra",
  "Gujarat",
  "Other State",
];

const TRANSFER_REASON_PRESETS = [
  "घटना स्थल अन्य थाना अधिकार क्षेत्र में स्थित पाया गया (Jurisdiction of destination station)",
  "शिकायतकर्ता के स्थायी निवास / निकटतम थाना क्षेत्र में स्थानांतरण अनुरोध",
  "समान मामले व आरोपी की जांच गंतव्य जिले में पहले से प्रचलित है",
  "अंतरराज्यीय साइबर व आर्थिक धोखाधड़ी होने के कारण विशेष सेल / राज्य को अंतरण",
  "पुलिस आयुक्त / पुलिस अधीक्षक कार्यालय के प्रशासनिक आदेशानुसार",
  "सक्षम न्यायालय के निर्देशानुसार क्षेत्राधिकार अंतरण",
];

export function TransferComplaintModal({
  isOpen,
  onClose,
  complaints,
  onTransferSuccess,
  preSelectedComplaintId,
}: TransferComplaintModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"TRANSFER" | "HISTORY">("TRANSFER");

  // Transfer Form State
  const [transferType, setTransferType] = useState<"OTHER_STATION" | "OTHER_DISTRICT" | "OTHER_STATE">("OTHER_STATION");
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>(preSelectedComplaintId || "");
  const [complaintSearchQuery, setComplaintSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Destination State
  const [targetState, setTargetState] = useState("Haryana");
  const [targetDistrict, setTargetDistrict] = useState("Gurugram");
  const [targetPoliceStation, setTargetPoliceStation] = useState("");
  const [customStationInput, setCustomStationInput] = useState("");

  // Metadata
  const [orderNumber, setOrderNumber] = useState("");
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split("T")[0]);
  const [dispatchTime, setDispatchTime] = useState(
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
  const [transferredBy, setTransferredBy] = useState(currentUser?.name || "Inspector Rajesh Kumar");
  const [transferredByRank, setTransferredByRank] = useState("SHO / Inspector");
  const [transferReason, setTransferReason] = useState(TRANSFER_REASON_PRESETS[0]);
  const [remarks, setRemarks] = useState("");

  // History State
  const [transferHistoryList, setTransferHistoryList] = useState<ComplaintTransferRecord[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync pre-selected complaint if supplied
  useEffect(() => {
    if (preSelectedComplaintId) {
      setSelectedComplaintId(preSelectedComplaintId);
    }
  }, [preSelectedComplaintId]);

  // Set default order number on mount
  useEffect(() => {
    if (!orderNumber) {
      const rnd = Math.floor(100 + Math.random() * 900);
      setOrderNumber(`TRF/CP/GGM/2026/${rnd}`);
    }
  }, [orderNumber]);

  // Load transfer history
  const loadHistory = () => {
    try {
      const history = ComplaintService.getTransferHistory();
      setTransferHistoryList(history);
    } catch (e) {
      console.warn("Could not load transfer history", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, activeTab]);

  // Close combobox when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter complaints for combobox
  const filteredComplaints = useMemo(() => {
    const q = complaintSearchQuery.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter((c) => {
      return (
        c.complaintNumber?.toLowerCase().includes(q) ||
        c.complainantName?.toLowerCase().includes(q) ||
        c.complainantMobile?.includes(q) ||
        c.incidentPlace?.toLowerCase().includes(q) ||
        c.categoryDisplay?.toLowerCase().includes(q)
      );
    });
  }, [complaints, complaintSearchQuery]);

  const selectedComplaint = useMemo(() => {
    return complaints.find((c) => c.id === selectedComplaintId || c.complaintNumber === selectedComplaintId);
  }, [complaints, selectedComplaintId]);

  // Filter history
  const filteredHistory = useMemo(() => {
    const q = historySearchQuery.trim().toLowerCase();
    if (!q) return transferHistoryList;
    return transferHistoryList.filter((item) => {
      return (
        item.complaintNumber.toLowerCase().includes(q) ||
        (item.complainantName && item.complainantName.toLowerCase().includes(q)) ||
        item.targetPoliceStation.toLowerCase().includes(q) ||
        item.targetDistrict.toLowerCase().includes(q) ||
        item.targetState.toLowerCase().includes(q) ||
        (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) ||
        item.transferredBy.toLowerCase().includes(q) ||
        item.transferReason.toLowerCase().includes(q)
      );
    });
  }, [transferHistoryList, historySearchQuery]);

  // Handle scope change defaults
  const handleScopeChange = (type: "OTHER_STATION" | "OTHER_DISTRICT" | "OTHER_STATE") => {
    setTransferType(type);
    if (type === "OTHER_STATION") {
      setTargetState("Haryana");
      setTargetDistrict("Gurugram");
      setTargetPoliceStation(GURUGRAM_STATIONS[0]);
    } else if (type === "OTHER_DISTRICT") {
      setTargetState("Haryana");
      setTargetDistrict("Faridabad");
      setTargetPoliceStation("");
    } else {
      setTargetState("Delhi");
      setTargetDistrict("");
      setTargetPoliceStation("");
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) {
      alert("कृपया स्थानांतरित की जाने वाली शिकायत का चयन करें। (Please select a complaint to transfer)");
      return;
    }

    const finalStation =
      targetPoliceStation === "OTHER_CUSTOM" || !targetPoliceStation
        ? customStationInput.trim()
        : targetPoliceStation.trim();

    if (!finalStation) {
      alert("कृपया गंतव्य थाना (Destination Police Station) दर्ज करें।");
      return;
    }

    if (!targetDistrict.trim()) {
      alert("कृपया गंतव्य ज़िला (Target District) दर्ज करें।");
      return;
    }

    if (!targetState.trim()) {
      alert("कृपया गंतव्य राज्य (Target State) दर्ज करें।");
      return;
    }

    if (!transferReason.trim()) {
      alert("कृपया स्थानांतरण का कारण (Transfer Reason) दर्ज करें।");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await ComplaintService.transferComplaintFull({
        complaintId: selectedComplaint.id,
        transferType,
        targetState: targetState.trim(),
        targetDistrict: targetDistrict.trim(),
        targetPoliceStation: finalStation,
        transferReason: transferReason.trim(),
        orderNumber: orderNumber.trim(),
        dispatchDate,
        dispatchTime,
        transferredBy: transferredBy.trim(),
        transferredByRank: transferredByRank.trim(),
        remarks: remarks.trim() || undefined,
      });

      setSuccessToast(`शिकायत ${selectedComplaint.complaintNumber} सफलतापूर्वक स्थानांतरित कर दी गई है!`);
      loadHistory();
      onTransferSuccess(updated);

      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(`स्थानांतरण में त्रुटि: ${err.message || "अज्ञात समस्या"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in-50 zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#0b192c] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <ArrowRightLeft className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  शिकायत स्थानांतरण / Transfer Complaint
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full">
                  BNSS / Police Jurisdiction
                </span>
              </div>
              <p className="text-xs text-slate-300">
                अन्य थाना, अन्य ज़िला या अन्य राज्य में क्षेत्राधिकार अनुसार शिकायत अंतरित करें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 pt-2 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("TRANSFER")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "TRANSFER"
                ? "border-blue-700 text-blue-900 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-4 h-4 text-blue-600" />
            <span>नया स्थानांतरण (Transfer Complaint)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === "HISTORY"
                ? "border-blue-700 text-blue-900 bg-white rounded-t-lg shadow-2xs"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>स्थानांतरण इतिहास (Transfer History)</span>
            <span className="ml-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {transferHistoryList.length}
            </span>
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="m-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm font-bold animate-in fade-in-50">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Tab 1: Transfer Form */}
        {activeTab === "TRANSFER" && (
          <form onSubmit={handleSubmitTransfer} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Step 1: Select Scope */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. स्थानांतरण का क्षेत्राधिकार चुनें (Select Jurisdiction Scope) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Other Station */}
                <button
                  type="button"
                  onClick={() => handleScopeChange("OTHER_STATION")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    transferType === "OTHER_STATION"
                      ? "border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${transferType === "OTHER_STATION" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Other Station (अन्य थाना)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">समान ज़िला (Same District)</div>
                  </div>
                </button>

                {/* Other District */}
                <button
                  type="button"
                  onClick={() => handleScopeChange("OTHER_DISTRICT")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    transferType === "OTHER_DISTRICT"
                      ? "border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${transferType === "OTHER_DISTRICT" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Other District (अन्य ज़िला)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">समान राज्य (Same State)</div>
                  </div>
                </button>

                {/* Other State */}
                <button
                  type="button"
                  onClick={() => handleScopeChange("OTHER_STATE")}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3 ${
                    transferType === "OTHER_STATE"
                      ? "border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${transferType === "OTHER_STATE" ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    <Globe2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Other State (अन्य राज्य)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">अंतरराज्यीय अंतरण (Inter-State)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Select Complaint (Searchable Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. स्थानांतरित की जाने वाली शिकायत चुनें (Select Complaint from Register) <span className="text-red-500">*</span>
              </label>

              {/* Input trigger */}
              <div
                onClick={() => setIsDropdownOpen(true)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-600 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  {selectedComplaint ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        {selectedComplaint.complaintNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedComplaint.complainantName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                        • {selectedComplaint.categoryDisplay}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={complaintSearchQuery}
                      onChange={(e) => {
                        setComplaintSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="शिकायत संख्या, नाम या फोन नंबर से खोजें (Type to search complaint)..."
                      className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  )}
                </div>

                {selectedComplaint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComplaintId("");
                      setComplaintSearchQuery("");
                      setIsDropdownOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 font-bold px-1.5 py-0.5 rounded"
                  >
                    बदलें (Change)
                  </button>
                )}
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto z-50 p-1.5 animate-in fade-in-50">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={complaintSearchQuery}
                      onChange={(e) => setComplaintSearchQuery(e.target.value)}
                      placeholder="शिकायत संख्या, नाम या फोन दर्ज करें..."
                      autoFocus
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>

                  {filteredComplaints.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      कोई शिकायत नहीं मिली (No matching complaints)
                    </div>
                  ) : (
                    filteredComplaints.map((c) => {
                      const isSelected = c.id === selectedComplaintId;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedComplaintId(c.id);
                            setIsDropdownOpen(false);
                            setComplaintSearchQuery("");
                          }}
                          className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            isSelected
                              ? "bg-blue-50 border border-blue-200 text-blue-900 font-bold"
                              : "hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                                {c.complaintNumber}
                              </span>
                              <span className="font-bold text-slate-900 truncate">
                                {c.complainantName}
                              </span>
                              {c.isTransferred && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">
                                  Already Transferred
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {c.categoryDisplay} • {c.incidentPlace || "Place N/A"} • Mob: {c.complainantMobile}
                            </div>
                          </div>
                          <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                            {formatDate(c.createdAt)}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Selected Complaint Summary Card */}
              {selectedComplaint && (
                <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {selectedComplaint.complainantName}
                      </span>
                      <span className="text-slate-500 font-mono">
                        (+91 {selectedComplaint.complainantMobile})
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      <strong>Subject / Matter:</strong> {selectedComplaint.categoryDisplay} — {selectedComplaint.incidentPlace}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      <strong>Current Station:</strong> {selectedComplaint.policeStation}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-500 block">
                      Registered: {formatDate(selectedComplaint.createdAt)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Destination Details */}
            <div className="bg-slate-50/70 border border-slate-200 p-4 rounded-xl space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>3. गंतव्य विवरण (Destination Police Jurisdiction)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* State */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    गंतव्य राज्य (Target State) <span className="text-red-500">*</span>
                  </label>
                  {transferType === "OTHER_STATE" ? (
                    <select
                      value={targetState}
                      onChange={(e) => setTargetState(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      {STATES_LIST.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value="Haryana"
                      disabled
                      className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-not-allowed"
                    />
                  )}
                </div>

                {/* District */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    गंतव्य ज़िला (Target District) <span className="text-red-500">*</span>
                  </label>
                  {transferType === "OTHER_STATION" ? (
                    <input
                      type="text"
                      value="Gurugram"
                      disabled
                      className="w-full text-xs px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-semibold cursor-not-allowed"
                    />
                  ) : transferType === "OTHER_DISTRICT" ? (
                    <select
                      value={targetDistrict}
                      onChange={(e) => setTargetDistrict(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      {HARYANA_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={targetDistrict}
                      onChange={(e) => setTargetDistrict(e.target.value)}
                      placeholder="e.g. New Delhi / South West"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  )}
                </div>

                {/* Police Station */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    गंतव्य थाना (Destination Police Station) <span className="text-red-500">*</span>
                  </label>
                  {transferType === "OTHER_STATION" ? (
                    <select
                      value={targetPoliceStation}
                      onChange={(e) => setTargetPoliceStation(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      <option value="">-- थाना चुनें (Select Station) --</option>
                      {GURUGRAM_STATIONS.map((ps) => (
                        <option key={ps} value={ps}>
                          {ps}
                        </option>
                      ))}
                      <option value="OTHER_CUSTOM">अन्य थाना (Enter custom name)...</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={targetPoliceStation}
                      onChange={(e) => setTargetPoliceStation(e.target.value)}
                      placeholder="e.g. PS Cyber Crime / PS Sector 12"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  )}
                </div>
              </div>

              {/* If Custom Station selected */}
              {targetPoliceStation === "OTHER_CUSTOM" && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    कस्टम थाना नाम लिखें (Enter Custom Police Station Name)
                  </label>
                  <input
                    type="text"
                    value={customStationInput}
                    onChange={(e) => setCustomStationInput(e.target.value)}
                    placeholder="उदा. PS DLF Phase 4 / विशेष इकाई"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              )}
            </div>

            {/* Step 4: Order & Transfer Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Order / Memo No */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  स्थानांतरण आदेश / पत्र संख्या (Order / Memo No.)
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. TRF/DCP/2026/042"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Dispatch Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  प्रेषण तिथि (Dispatch Date) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Transferred By */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  हस्ताक्षरकर्ता / अधिकारी (Authorized By) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transferredBy}
                  onChange={(e) => setTransferredBy(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Step 5: Transfer Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. स्थानांतरण का कारण (Transfer Reason / Legal Ground) <span className="text-red-500">*</span>
              </label>
              <select
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 mb-2"
              >
                {TRANSFER_REASON_PRESETS.map((rs, idx) => (
                  <option key={idx} value={rs}>
                    {rs}
                  </option>
                ))}
                <option value="OTHER_CUSTOM_REASON">अन्य कारण (Type custom ground below)...</option>
              </select>

              {transferReason === "OTHER_CUSTOM_REASON" && (
                <textarea
                  rows={2}
                  placeholder="विस्तृत कारण दर्ज करें..."
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              )}
            </div>

            {/* Step 6: Remarks */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                5. प्राप्तकर्ता थाने के लिए विशेष निर्देश / टिप्पणी (Remarks / Instructions for Receiving PS)
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="उदा. फरियादी के मूल दस्तावेज व सीडी संलग्न हैं। प्राथमिकता पर जांच आरंभ की जाए।"
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedComplaint}
                className="px-5 py-2.5 text-xs font-bold bg-[#0b192c] hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                <span>{isSubmitting ? "स्थानांतरित किया जा रहा है..." : "शिकायत स्थानांतरित करें (Confirm Transfer)"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Transfer History */}
        {activeTab === "HISTORY" && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Search Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="शिकायत संख्या, थाना, अधिकारी या आदेश सं. से खोजें..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none"
                />
              </div>
              <div className="text-xs text-slate-500 font-mono">
                कुल {filteredHistory.length} स्थानांतरण रिकॉर्ड
              </div>
            </div>

            {/* History Table */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-600">कोई स्थानांतरण इतिहास उपलब्ध नहीं है</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  जब भी कोई शिकायत अन्य थाना या राज्य में भेजी जाएगी, उसका पूरा रिकॉर्ड यहाँ सुरक्षित रहेगा।
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-800">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3.5">तिथि व समय</th>
                        <th className="py-3 px-3.5">शिकायत सं. व फरियादी</th>
                        <th className="py-3 px-3.5">प्रकार</th>
                        <th className="py-3 px-3.5">स्रोत ➔ गंतव्य थाना</th>
                        <th className="py-3 px-3.5">आदेश सं. व अधिकारी</th>
                        <th className="py-3 px-3.5">कारण व टिप्पणी</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHistory.map((item) => {
                        const typeBadge =
                          item.transferType === "OTHER_STATION" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                              अन्य थाना
                            </span>
                          ) : item.transferType === "OTHER_DISTRICT" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                              अन्य ज़िला
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              अन्य राज्य
                            </span>
                          );

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Date */}
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                <span>{item.dispatchDate}</span>
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {item.dispatchTime || "N/A"}
                              </div>
                            </td>

                            {/* Complaint No & Complainant */}
                            <td className="py-3 px-3.5">
                              <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded block w-fit">
                                {item.complaintNumber}
                              </span>
                              <div className="font-bold text-slate-800 mt-0.5">
                                {item.complainantName || "Complainant"}
                              </div>
                            </td>

                            {/* Type */}
                            <td className="py-3 px-3.5">{typeBadge}</td>

                            {/* Source -> Destination */}
                            <td className="py-3 px-3.5">
                              <div className="text-[11px] text-slate-500">
                                {item.sourcePoliceStation} ({item.sourceDistrict})
                              </div>
                              <div className="flex items-center gap-1 font-bold text-slate-900 mt-0.5">
                                <span className="text-blue-600">➔</span>
                                <span>{item.targetPoliceStation}</span>
                              </div>
                              <div className="text-[10px] text-slate-600">
                                {item.targetDistrict}, {item.targetState}
                              </div>
                            </td>

                            {/* Order & Officer */}
                            <td className="py-3 px-3.5">
                              <div className="font-mono text-[11px] font-bold text-slate-800">
                                {item.orderNumber || "Ref: N/A"}
                              </div>
                              <div className="text-[11px] text-slate-600 mt-0.5">
                                {item.transferredBy}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {item.transferredByRank}
                              </div>
                            </td>

                            {/* Reason */}
                            <td className="py-3 px-3.5 max-w-xs">
                              <p className="text-slate-800 line-clamp-2 text-[11px]">
                                {item.transferReason}
                              </p>
                              {item.remarks && (
                                <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1">
                                  नोट: {item.remarks}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
