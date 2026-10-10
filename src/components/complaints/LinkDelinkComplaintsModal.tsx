"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Link2,
  Unlink,
  Search,
  CheckCircle,
  Calendar,
  User,
  Shield,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  Layers,
  ChevronDown,
} from "lucide-react";
import { ComplaintItem, LinkedComplaintEntry } from "@/types";
import { ComplaintService } from "@/services/complaintService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";

interface LinkDelinkComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaints: ComplaintItem[];
  onSuccess: (result: { primary: ComplaintItem; target?: ComplaintItem }) => void;
  preSelectedComplaintId?: string;
}

const LINK_TYPE_OPTIONS = [
  {
    key: "CROSS",
    label: "Cross-Complaint (क्रॉस शिकायत)",
    desc: "एक ही घटना पर दोनों पक्षों द्वारा एक दूसरे के खिलाफ दर्ज शिकायतें",
    badgeColor: "bg-red-100 text-red-800 border-red-200",
  },
  {
    key: "RELATED",
    label: "Related Matter (संबंधित मामला)",
    desc: "समान घटना स्थल, विवाद या एक ही घटनाक्रम से जुड़ी शिकायतें",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    key: "DUPLICATE",
    label: "Duplicate / Repeat (डुप्लीकेट शिकायत)",
    desc: "एक ही व्यक्ति द्वारा उसी विषय पर दोबारा दी गई पूरक शिकायत",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    key: "SAME_ACCUSED",
    label: "Same Accused / Gang (समान आरोपी / गिरोह)",
    desc: "समान अपराधी या गिरोह द्वारा अलग-अलग पीड़ितों के साथ किया गया अपराध",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
  },
] as const;

const LINK_REASON_PRESETS = [
  "दोनों पक्षों द्वारा एक ही घटना पर परस्पर विरोधी आरोप लगाए गए हैं (Mutual cross-complaint)",
  "घटना स्थल, समय और मुख्य विवाद का कारण एक ही पाया गया",
  "समान आरोपी द्वारा एक ही मोडस ऑपरेंडी (Modus Operandi) से की गई धोखाधड़ी",
  "शिकायतकर्ता द्वारा पूर्व दर्ज शिकायत के संबंध में ही अतिरिक्त साक्ष्य/विवरण प्रस्तुत किया गया",
  "पुलिस अधीक्षक / एसीपी कार्यालय से संयुक्त जांच हेतु एक साथ जोड़ने के निर्देश",
];

const DELINK_REASON_PRESETS = [
  "प्रारंभिक जांच में दोनों मामलों का परस्पर कोई संबंध नहीं पाया गया, स्वतंत्र जांच आवश्यक है",
  "दोनों पक्षों के विवाद का घटना स्थल व समय पूर्णतः पृथक निकला",
  "क्लर्कियल / डेटा प्रविष्टि की असावधानी के कारण गलत लिंक हो गया था",
  "जांच अधिकारी के निष्कर्षानुसार मामलों की अलग-अलग चार्जशीट / रिपोर्ट प्रस्तुत की जाएगी",
];

export function LinkDelinkComplaintsModal({
  isOpen,
  onClose,
  complaints,
  onSuccess,
  preSelectedComplaintId,
}: LinkDelinkComplaintsModalProps) {
  const { currentUser } = useAuth();
  const [mode, setMode] = useState<"LINK" | "DELINK">("LINK");

  // === LINK MODE STATE ===
  const [primaryComplaintId, setPrimaryComplaintId] = useState<string>(preSelectedComplaintId || "");
  const [targetComplaintId, setTargetComplaintId] = useState<string>("");
  const [primarySearch, setPrimarySearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [isPrimaryDropdownOpen, setIsPrimaryDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const [linkType, setLinkType] = useState<"RELATED" | "CROSS" | "DUPLICATE" | "SAME_ACCUSED">("CROSS");
  const [linkReason, setLinkReason] = useState(LINK_REASON_PRESETS[0]);
  const [customLinkReason, setCustomLinkReason] = useState("");

  // === DELINK MODE STATE ===
  const [delinkSourceComplaintId, setDelinkSourceComplaintId] = useState<string>(preSelectedComplaintId || "");
  const [delinkSourceSearch, setDelinkSourceSearch] = useState("");
  const [isDelinkSourceDropdownOpen, setIsDelinkSourceDropdownOpen] = useState(false);
  const [targetComplaintNumberToDelink, setTargetComplaintNumberToDelink] = useState<string>("");
  const [delinkReason, setDelinkReason] = useState(DELINK_REASON_PRESETS[0]);
  const [customDelinkReason, setCustomDelinkReason] = useState("");

  const [officerName, setOfficerName] = useState(currentUser?.name || "Inspector Rajesh Kumar (SHO)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const primaryRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const delinkSourceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preSelectedComplaintId) {
      setPrimaryComplaintId(preSelectedComplaintId);
      setDelinkSourceComplaintId(preSelectedComplaintId);
    }
  }, [preSelectedComplaintId]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (primaryRef.current && !primaryRef.current.contains(e.target as Node)) {
        setIsPrimaryDropdownOpen(false);
      }
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
      if (delinkSourceRef.current && !delinkSourceRef.current.contains(e.target as Node)) {
        setIsDelinkSourceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter complaints for Primary selector (search by name, date, complaint no)
  const filteredPrimaryComplaints = useMemo(() => {
    const q = primarySearch.trim().toLowerCase();
    if (!q) return complaints;
    return complaints.filter((c) => {
      const dateStr = formatDate(c.createdAt).toLowerCase();
      return (
        c.complaintNumber?.toLowerCase().includes(q) ||
        c.complainantName?.toLowerCase().includes(q) ||
        c.incidentPlace?.toLowerCase().includes(q) ||
        dateStr.includes(q) ||
        c.createdAt?.includes(q)
      );
    });
  }, [complaints, primarySearch]);

  const selectedPrimaryComplaint = useMemo(() => {
    return complaints.find((c) => c.id === primaryComplaintId || c.complaintNumber === primaryComplaintId);
  }, [complaints, primaryComplaintId]);

  // Filter complaints for Target selector (exclude primary complaint)
  const filteredTargetComplaints = useMemo(() => {
    const q = targetSearch.trim().toLowerCase();
    const available = complaints.filter(
      (c) => c.id !== primaryComplaintId && c.complaintNumber !== selectedPrimaryComplaint?.complaintNumber
    );
    if (!q) return available;
    return available.filter((c) => {
      const dateStr = formatDate(c.createdAt).toLowerCase();
      return (
        c.complaintNumber?.toLowerCase().includes(q) ||
        c.complainantName?.toLowerCase().includes(q) ||
        c.incidentPlace?.toLowerCase().includes(q) ||
        dateStr.includes(q) ||
        c.createdAt?.includes(q)
      );
    });
  }, [complaints, targetSearch, primaryComplaintId, selectedPrimaryComplaint]);

  const selectedTargetComplaint = useMemo(() => {
    return complaints.find((c) => c.id === targetComplaintId || c.complaintNumber === targetComplaintId);
  }, [complaints, targetComplaintId]);

  // Complaints that have active links (for Delink Mode)
  const complaintsWithLinks = useMemo(() => {
    return complaints.filter(
      (c) =>
        (c.linkedComplaintsList && c.linkedComplaintsList.length > 0) ||
        (c.linkedComplaintNumber && c.linkedComplaintNumber.trim().length > 0)
    );
  }, [complaints]);

  const filteredDelinkSourceComplaints = useMemo(() => {
    const q = delinkSourceSearch.trim().toLowerCase();
    if (!q) return complaintsWithLinks;
    return complaintsWithLinks.filter((c) => {
      const dateStr = formatDate(c.createdAt).toLowerCase();
      return (
        c.complaintNumber?.toLowerCase().includes(q) ||
        c.complainantName?.toLowerCase().includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [complaintsWithLinks, delinkSourceSearch]);

  const selectedDelinkSourceComplaint = useMemo(() => {
    return complaints.find(
      (c) => c.id === delinkSourceComplaintId || c.complaintNumber === delinkSourceComplaintId
    );
  }, [complaints, delinkSourceComplaintId]);

  // Active links inside the selected delink source complaint
  const activeLinksForSource = useMemo(() => {
    if (!selectedDelinkSourceComplaint) return [];
    const list: Array<{
      complaintNumber: string;
      complainantName?: string;
      linkType?: string;
      reason?: string;
      linkedAt?: string;
    }> = [];

    if (
      selectedDelinkSourceComplaint.linkedComplaintsList &&
      selectedDelinkSourceComplaint.linkedComplaintsList.length > 0
    ) {
      selectedDelinkSourceComplaint.linkedComplaintsList.forEach((item) => {
        list.push({
          complaintNumber: item.complaintNumber,
          complainantName: item.complainantName,
          linkType: item.linkType,
          reason: item.reason,
          linkedAt: item.linkedAt,
        });
      });
    } else if (selectedDelinkSourceComplaint.linkedComplaintNumber) {
      list.push({
        complaintNumber: selectedDelinkSourceComplaint.linkedComplaintNumber,
        complainantName: "Linked Case",
        linkType: selectedDelinkSourceComplaint.isCrossComplaint ? "CROSS" : "RELATED",
        reason: "Cross-referenced",
      });
    }

    return list;
  }, [selectedDelinkSourceComplaint]);

  // Submit Link
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrimaryComplaint) {
      alert("कृपया पहली (मुख्य) शिकायत चुनें। (Please select the primary complaint)");
      return;
    }
    if (!selectedTargetComplaint) {
      alert("कृपया जोड़ने वाली दूसरी शिकायत चुनें। (Please select the target complaint to link)");
      return;
    }
    if (selectedPrimaryComplaint.complaintNumber === selectedTargetComplaint.complaintNumber) {
      alert("एक ही शिकायत को स्वयं से लिंक नहीं किया जा सकता। (Cannot link a complaint to itself)");
      return;
    }

    const finalReason =
      linkReason === "OTHER_CUSTOM" ? customLinkReason.trim() : linkReason.trim();
    if (!finalReason) {
      alert("कृपया लिंक करने का कारण दर्ज करें। (Please provide linking reason)");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ComplaintService.linkComplaintsFull({
        primaryComplaintId: selectedPrimaryComplaint.id,
        targetComplaintId: selectedTargetComplaint.id,
        linkType,
        reason: finalReason,
        officerName: officerName.trim(),
      });

      setSuccessToast(
        `शिकायत ${selectedPrimaryComplaint.complaintNumber} और ${selectedTargetComplaint.complaintNumber} को सफलतापूर्वक लिंक कर दिया गया है!`
      );
      onSuccess(result);

      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(`लिंक करने में त्रुटि: ${err.message || "अज्ञात समस्या"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delink
  const handleDelinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelinkSourceComplaint) {
      alert("कृपया उस शिकायत का चयन करें जिससे लिंक हटाना है। (Select complaint to delink from)");
      return;
    }
    if (!targetComplaintNumberToDelink) {
      alert("कृपया डी-लिंक की जाने वाली संबंधित शिकायत का चयन करें। (Select target linked complaint to remove)");
      return;
    }

    const finalReason =
      delinkReason === "OTHER_CUSTOM" ? customDelinkReason.trim() : delinkReason.trim();
    if (!finalReason) {
      alert("कृपया डी-लिंक करने का कारण दर्ज करें। (Please provide delinking reason)");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ComplaintService.delinkComplaintsFull({
        primaryComplaintId: selectedDelinkSourceComplaint.id,
        targetComplaintNumber: targetComplaintNumberToDelink,
        reason: finalReason,
        officerName: officerName.trim(),
      });

      setSuccessToast(
        `शिकायत ${selectedDelinkSourceComplaint.complaintNumber} से ${targetComplaintNumberToDelink} को सफलतापूर्वक डी-लिंक कर दिया गया है!`
      );
      onSuccess(result);

      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(`डी-लिंक करने में त्रुटि: ${err.message || "अज्ञात समस्या"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in-50 zoom-in-95">
        
        {/* Header */}
        <div className="bg-[#0b192c] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <Link2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  शिकायत लिंक व डी-लिंक / Link & Delink
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  Case Association
                </span>
              </div>
              <p className="text-xs text-slate-300">
                क्रॉस शिकायतें, समान आरोपी या संबंधित मामलों को आपस में जोड़ें अथवा अलग करें
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

        {/* Mode Selector (Link vs Delink) */}
        <div className="bg-slate-100 border-b border-slate-200 p-2 sm:p-3 flex items-center justify-center gap-2 shrink-0">
          <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 shadow-2xs w-full max-w-md">
            <button
              type="button"
              onClick={() => setMode("LINK")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "LINK"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Link2 className="w-4 h-4" />
              <span>शिकायतें लिंक करें (Link Complaints)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("DELINK")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === "DELINK"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Unlink className="w-4 h-4" />
              <span>शिकायतें डी-लिंक करें (Delink Complaints)</span>
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="m-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm font-bold animate-in fade-in-50">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* ===================== MODE 1: LINK COMPLAINTS ===================== */}
        {mode === "LINK" && (
          <form onSubmit={handleLinkSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Step 1: Select Primary Complaint */}
            <div className="relative" ref={primaryRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. मुख्य शिकायत चुनें (Select Primary Complaint) <span className="text-red-500">*</span>
              </label>

              <div
                onClick={() => setIsPrimaryDropdownOpen(true)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  {selectedPrimaryComplaint ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-xs text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                        {selectedPrimaryComplaint.complaintNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedPrimaryComplaint.complainantName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:inline">
                        • {formatDate(selectedPrimaryComplaint.createdAt)}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={primarySearch}
                      onChange={(e) => {
                        setPrimarySearch(e.target.value);
                        setIsPrimaryDropdownOpen(true);
                      }}
                      onFocus={() => setIsPrimaryDropdownOpen(true)}
                      placeholder="शिकायत संख्या, नाम या तारीख (Date/Name/No) से खोजें..."
                      className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  )}
                </div>

                {selectedPrimaryComplaint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimaryComplaintId("");
                      setPrimarySearch("");
                      setIsPrimaryDropdownOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 font-bold px-1.5 py-0.5 rounded"
                  >
                    बदलें (Change)
                  </button>
                )}
              </div>

              {/* Primary Dropdown Menu */}
              {isPrimaryDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto z-50 p-1.5 animate-in fade-in-50">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={primarySearch}
                      onChange={(e) => setPrimarySearch(e.target.value)}
                      placeholder="नाम, शिकायत सं., या तारीख (DD/MM/YYYY) से खोजें..."
                      autoFocus
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                  {filteredPrimaryComplaints.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">कोई शिकायत नहीं मिली</div>
                  ) : (
                    filteredPrimaryComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setPrimaryComplaintId(c.id);
                          setIsPrimaryDropdownOpen(false);
                          setPrimarySearch("");
                        }}
                        className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          c.id === primaryComplaintId
                            ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                              {c.complaintNumber}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{c.complainantName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {c.categoryDisplay} • {c.incidentPlace || "N/A"}
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                          {formatDate(c.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Visual Arrow Indicator */}
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs">
                <Link2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            {/* Step 2: Select Target Complaint to Link */}
            <div className="relative" ref={targetRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. जिस शिकायत से लिंक करना है (Select Target Complaint to Link with) <span className="text-red-500">*</span>
              </label>

              <div
                onClick={() => setIsTargetDropdownOpen(true)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  {selectedTargetComplaint ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                        {selectedTargetComplaint.complaintNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedTargetComplaint.complainantName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:inline">
                        • {formatDate(selectedTargetComplaint.createdAt)}
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={targetSearch}
                      onChange={(e) => {
                        setTargetSearch(e.target.value);
                        setIsTargetDropdownOpen(true);
                      }}
                      onFocus={() => setIsTargetDropdownOpen(true)}
                      placeholder="दूसरी शिकायत संख्या, नाम या तारीख (Date/Name/No) से खोजें..."
                      className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  )}
                </div>

                {selectedTargetComplaint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetComplaintId("");
                      setTargetSearch("");
                      setIsTargetDropdownOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 font-bold px-1.5 py-0.5 rounded"
                  >
                    बदलें (Change)
                  </button>
                )}
              </div>

              {/* Target Dropdown Menu */}
              {isTargetDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto z-50 p-1.5 animate-in fade-in-50">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      placeholder="नाम, शिकायत सं., या तारीख (DD/MM/YYYY) से खोजें..."
                      autoFocus
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                    />
                  </div>
                  {filteredTargetComplaints.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">कोई शिकायत नहीं मिली</div>
                  ) : (
                    filteredTargetComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setTargetComplaintId(c.id);
                          setIsTargetDropdownOpen(false);
                          setTargetSearch("");
                        }}
                        className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          c.id === targetComplaintId
                            ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                              {c.complaintNumber}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{c.complainantName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {c.categoryDisplay} • {c.incidentPlace || "N/A"}
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                          {formatDate(c.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Link Type Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                3. संबंध का प्रकार (Select Relationship Type) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {LINK_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLinkType(opt.key)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      linkType === opt.key
                        ? "border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                        {opt.key}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Reason for Linking */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. लिंक करने का कारण व आधार (Ground / Reason for Linking) <span className="text-red-500">*</span>
              </label>
              <select
                value={linkReason}
                onChange={(e) => setLinkReason(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 mb-2"
              >
                {LINK_REASON_PRESETS.map((rs, idx) => (
                  <option key={idx} value={rs}>
                    {rs}
                  </option>
                ))}
                <option value="OTHER_CUSTOM">अन्य विशिष्ट कारण लिखें (Type custom reason)...</option>
              </select>

              {linkReason === "OTHER_CUSTOM" && (
                <textarea
                  rows={2}
                  value={customLinkReason}
                  onChange={(e) => setCustomLinkReason(e.target.value)}
                  placeholder="कारण का विवरण दर्ज करें..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              )}
            </div>

            {/* Step 5: Officer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                अधिकृत अधिकारी (Authorized By)
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
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
                disabled={isSubmitting || !selectedPrimaryComplaint || !selectedTargetComplaint}
                className="px-5 py-2.5 text-xs font-bold bg-[#0b192c] hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? "लिंक किया जा रहा है..." : "शिकायतें लिंक करें (Confirm Linking)"}</span>
              </button>
            </div>
          </form>
        )}

        {/* ===================== MODE 2: DELINK COMPLAINTS ===================== */}
        {mode === "DELINK" && (
          <form onSubmit={handleDelinkSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Step 1: Select Complaint that has active links */}
            <div className="relative" ref={delinkSourceRef}>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                1. वह शिकायत चुनें जिसमें लिंक मौजूद है (Select Complaint with Active Links) <span className="text-red-500">*</span>
              </label>

              <div
                onClick={() => setIsDelinkSourceDropdownOpen(true)}
                className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-slate-300 rounded-xl flex items-center justify-between cursor-pointer hover:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-600 shadow-2xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  {selectedDelinkSourceComplaint ? (
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-xs text-rose-900 bg-rose-100 px-2 py-0.5 rounded">
                        {selectedDelinkSourceComplaint.complaintNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedDelinkSourceComplaint.complainantName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:inline">
                        • {activeLinksForSource.length} Linked Case(s)
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={delinkSourceSearch}
                      onChange={(e) => {
                        setDelinkSourceSearch(e.target.value);
                        setIsDelinkSourceDropdownOpen(true);
                      }}
                      onFocus={() => setIsDelinkSourceDropdownOpen(true)}
                      placeholder="लिंक युक्त शिकायत संख्या, नाम या तारीख से खोजें..."
                      className="w-full text-xs text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                  )}
                </div>

                {selectedDelinkSourceComplaint && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDelinkSourceComplaintId("");
                      setTargetComplaintNumberToDelink("");
                      setDelinkSourceSearch("");
                      setIsDelinkSourceDropdownOpen(true);
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 font-bold px-1.5 py-0.5 rounded"
                  >
                    बदलें (Change)
                  </button>
                )}
              </div>

              {/* Delink Source Dropdown Menu */}
              {isDelinkSourceDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-y-auto z-50 p-1.5 animate-in fade-in-50">
                  <div className="p-2 border-b border-slate-100">
                    <input
                      type="text"
                      value={delinkSourceSearch}
                      onChange={(e) => setDelinkSourceSearch(e.target.value)}
                      placeholder="खोजें..."
                      autoFocus
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-rose-500"
                    />
                  </div>
                  {filteredDelinkSourceComplaints.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      कोई लिंक युक्त शिकायत उपलब्ध नहीं है (No linked complaints found)
                    </div>
                  ) : (
                    filteredDelinkSourceComplaints.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setDelinkSourceComplaintId(c.id);
                          setTargetComplaintNumberToDelink("");
                          setIsDelinkSourceDropdownOpen(false);
                          setDelinkSourceSearch("");
                        }}
                        className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                          c.id === delinkSourceComplaintId
                            ? "bg-rose-50 text-rose-900 font-bold border border-rose-200"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded">
                              {c.complaintNumber}
                            </span>
                            <span className="font-bold text-slate-900 truncate">{c.complainantName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            Linked: {c.linkedComplaintsList?.length || 1} complaints
                          </div>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                          {formatDate(c.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Choose which linked complaint to remove */}
            {selectedDelinkSourceComplaint && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. डी-लिंक करने हेतु जुड़ी हुई शिकायत चुनें (Select Linked Case to Delink) <span className="text-red-500">*</span>
                </label>

                {activeLinksForSource.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    इस शिकायत से वर्तमान में कोई अन्य शिकायत लिंक नहीं है।
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeLinksForSource.map((linkItem) => {
                      const isSelected = targetComplaintNumberToDelink === linkItem.complaintNumber;
                      return (
                        <div
                          key={linkItem.complaintNumber}
                          onClick={() => setTargetComplaintNumberToDelink(linkItem.complaintNumber)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-rose-600 bg-rose-50/80 ring-2 ring-rose-500/20 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                                {linkItem.complaintNumber}
                              </span>
                              {linkItem.linkType && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                                  {linkItem.linkType}
                                </span>
                              )}
                            </div>
                            {linkItem.reason && (
                              <p className="text-[11px] text-slate-600">
                                <strong>Reason:</strong> {linkItem.reason}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span
                              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                isSelected
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-800"
                              }`}
                            >
                              {isSelected ? "चयनित (Selected)" : "चुनें (Select)"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Delink Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                3. डी-लिंक करने का कारण (Reason for Delinking) <span className="text-red-500">*</span>
              </label>
              <select
                value={delinkReason}
                onChange={(e) => setDelinkReason(e.target.value)}
                className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 mb-2"
              >
                {DELINK_REASON_PRESETS.map((rs, idx) => (
                  <option key={idx} value={rs}>
                    {rs}
                  </option>
                ))}
                <option value="OTHER_CUSTOM">अन्य कारण लिखें (Type custom reason)...</option>
              </select>

              {delinkReason === "OTHER_CUSTOM" && (
                <textarea
                  rows={2}
                  value={customDelinkReason}
                  onChange={(e) => setCustomDelinkReason(e.target.value)}
                  placeholder="डी-लिंक करने का विस्तृत कारण दर्ज करें..."
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                />
              )}
            </div>

            {/* Step 4: Officer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                अधिकृत अधिकारी (Authorized By)
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
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
                disabled={isSubmitting || !selectedDelinkSourceComplaint || !targetComplaintNumberToDelink}
                className="px-5 py-2.5 text-xs font-bold bg-[#0b192c] hover:bg-slate-800 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Unlink className="w-4 h-4 text-rose-400" />
                <span>{isSubmitting ? "डी-लिंक किया जा रहा है..." : "शिकायत डी-लिंक करें (Confirm Delink)"}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
