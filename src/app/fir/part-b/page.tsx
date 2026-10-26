"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  FileCheck2,
  FileText,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Scale,
  Send,
  Building2,
  User,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Upload,
  UserCheck,
  X,
  Check,
  Gavel,
  Paperclip,
} from "lucide-react";
import { firService } from "@/services/firService";
import { FIRItem, OfficerNotification } from "@/types";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";

type PartBTab = "CHARGESHEET" | "SUPPLEMENTARY" | "CLOSURE" | "UNTRACED";

interface TabConfig {
  key: PartBTab;
  title: string;
  hindiTitle: string;
  badge: string;
  badgeColor: string;
  desc: string;
  statutoryForm: string;
}

const TAB_CONFIGS: Record<PartBTab, TabConfig> = {
  CHARGESHEET: {
    key: "CHARGESHEET",
    title: "Chargesheet / Challan",
    hindiTitle: "दोषारोप पत्र / चालान (IIF-V)",
    badge: "Final Report u/s 193 BNSS",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    desc: "वे FIR जिनकी Final Report / Chargesheet तैयार करके SHO को अग्रेषित की जा चुकी है अथवा न्यायालय में प्रेषित की गई है।",
    statutoryForm: "Form No. 24.5(2) • Sec 193 BNSS",
  },
  SUPPLEMENTARY: {
    key: "SUPPLEMENTARY",
    title: "Supplementary Challan",
    hindiTitle: "सप्लीमेंट्री चालान (Sec 193(9) BNSS)",
    badge: "Further Investigation",
    badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    desc: "अग्रिम विवेचना (Further Investigation) के उपरांत तैयार अतिरिक्त साक्ष्य व पूरक चालान।",
    statutoryForm: "Form No. 24.5(2A) • Sec 193(9) BNSS",
  },
  CLOSURE: {
    key: "CLOSURE",
    title: "Closure Report",
    hindiTitle: "खारिजी रिपोर्ट (Closure / Mistake / False)",
    badge: "Closure / False / Mistake of Fact",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    desc: "वे FIR जिनकी Closure Report (Mistake of Fact, Civil Dispute या असत्य / False पाई गई) तैयार की गई है।",
    statutoryForm: "Form No. 24.5(3) • Sec 193 & 190 BNSS",
  },
  UNTRACED: {
    key: "UNTRACED",
    title: "Untraced",
    hindiTitle: "अदम सुराग रिपोर्ट (Untraced / Adam Surag)",
    badge: "Culprit Not Found",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
    desc: "सघन अनुसंधान के बाद भी अज्ञात मुल्जिमों का सुराग न मिलने पर तैयार की गई अदम सुराग रिपोर्ट।",
    statutoryForm: "Form No. 24.5(4) • Sec 193 BNSS",
  },
};

function FIRPartBContent() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const tabParam = searchParams.get("tab")?.toUpperCase();
  const initialTab: PartBTab =
    tabParam === "SUPPLEMENTARY"
      ? "SUPPLEMENTARY"
      : tabParam === "CLOSURE"
      ? "CLOSURE"
      : tabParam === "UNTRACED"
      ? "UNTRACED"
      : "CHARGESHEET";

  const [activeTab, setActiveTab] = useState<PartBTab>(initialTab);
  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Court Order Assignment Modal state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedFirIdForOrder, setSelectedFirIdForOrder] = useState("");
  const [courtName, setCourtName] = useState("Hon'ble Court of CJM, Panipat");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedIoId, setSelectedIoId] = useState("");
  const [uploadedOrderFileName, setUploadedOrderFileName] = useState("");
  const [uploadedOrderFileData, setUploadedOrderFileData] = useState("");
  const [orderDirections, setOrderDirections] = useState("");
  const [modalSuccessMsg, setModalSuccessMsg] = useState("");
  const [modalErrorMsg, setModalErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load FIRs
  useEffect(() => {
    try {
      const all = firService.getAllFirs();
      setFirs(all);
    } finally {
      setLoading(false);
    }

    const unsub = firService.subscribe(() => {
      setFirs(firService.getAllFirs());
    });
    return unsub;
  }, []);

  // Filter FIRs for each tab
  // 1. Chargesheet/Challan: finalFormType === 'CHARGESHEET' or status === 'CHARGESHEET_FILED' or sent to SHO with final report
  const chargesheetFirs = useMemo(() => {
    return firs.filter((fir) => {
      const isCs =
        fir.finalFormType === "CHARGESHEET" ||
        fir.status === "CHARGESHEET_FILED" ||
        fir.mainStatus === "Chargesheet Filed" ||
        fir.timeline?.some(
          (tl) =>
            tl.stage === "FINAL_REPORT" ||
            tl.title?.toLowerCase().includes("chargesheet") ||
            tl.title?.toLowerCase().includes("final report")
        ) ||
        fir.reports?.some((r) => r.reportType === "CHARGESHEET");
      return isCs;
    });
  }, [firs]);

  // 2. Supplementary Challan: tagged supplementary or timeline/report with supplementary
  const supplementaryFirs = useMemo(() => {
    return firs.filter((fir) => {
      const isSupp =
        fir.timeline?.some(
          (tl) =>
            tl.title?.toLowerCase().includes("supplementary") ||
            tl.description?.toLowerCase().includes("supplementary") ||
            tl.title?.toLowerCase().includes("पूरक")
        ) ||
        fir.reports?.some(
          (r) =>
            r.title?.toLowerCase().includes("supplementary") ||
            r.reportType?.toLowerCase().includes("supplementary")
        );
      return isSupp;
    });
  }, [firs]);

  // 3. Closure Report: closure / mistake of fact / false
  const closureFirs = useMemo(() => {
    return firs.filter((fir) => {
      const isCl =
        fir.finalFormType === "CLOSURE" ||
        fir.finalFormType === "CANCELLED" ||
        fir.status === "CLOSURE_REPORT_FILED" ||
        fir.status === "CANCELLED" ||
        fir.mainStatus === "Closure Filed" ||
        fir.mainStatus === "Cancelled" ||
        fir.timeline?.some(
          (tl) =>
            tl.title?.toLowerCase().includes("closure") ||
            tl.title?.toLowerCase().includes("mistake") ||
            tl.title?.toLowerCase().includes("false") ||
            tl.title?.toLowerCase().includes("cancel") ||
            tl.title?.toLowerCase().includes("खारिजी")
        ) ||
        fir.reports?.some(
          (r) =>
            r.reportType === "CLOSURE_REPORT" ||
            r.title?.toLowerCase().includes("closure") ||
            r.title?.toLowerCase().includes("cancellation")
        );
      return isCl;
    });
  }, [firs]);

  // 4. Untraced: Adam Surag / untraced
  const untracedFirs = useMemo(() => {
    return firs.filter((fir) => {
      const isUn =
        fir.finalFormType === "UNTRACED" ||
        fir.status === "UNTRACED" ||
        fir.mainStatus === "Untraced" ||
        fir.timeline?.some(
          (tl) =>
            tl.title?.toLowerCase().includes("untraced") ||
            tl.title?.toLowerCase().includes("adam surag") ||
            tl.title?.toLowerCase().includes("अदम सुराग")
        ) ||
        fir.reports?.some((r) => r.title?.toLowerCase().includes("untraced"));
      return isUn;
    });
  }, [firs]);

  // Active list based on tab
  const currentTabFirs = useMemo(() => {
    switch (activeTab) {
      case "CHARGESHEET":
        return chargesheetFirs;
      case "SUPPLEMENTARY":
        return supplementaryFirs;
      case "CLOSURE":
        return closureFirs;
      case "UNTRACED":
        return untracedFirs;
      default:
        return [];
    }
  }, [activeTab, chargesheetFirs, supplementaryFirs, closureFirs, untracedFirs]);

  // Search filter
  const filteredFirs = useMemo(() => {
    if (!searchQuery.trim()) return currentTabFirs;
    const q = searchQuery.toLowerCase().trim();
    return currentTabFirs.filter(
      (fir) =>
        fir.firNumber?.toLowerCase().includes(q) ||
        fir.complainantName?.toLowerCase().includes(q) ||
        fir.actsAndSections?.toLowerCase().includes(q) ||
        fir.assignedIoName?.toLowerCase().includes(q) ||
        fir.policeStation?.toLowerCase().includes(q) ||
        fir.courtName?.toLowerCase().includes(q) ||
        fir.courtOrderNumber?.toLowerCase().includes(q) ||
        fir.finalFormNumber?.toLowerCase().includes(q)
    );
  }, [currentTabFirs, searchQuery]);

  const counts: Record<PartBTab, number> = {
    CHARGESHEET: chargesheetFirs.length,
    SUPPLEMENTARY: supplementaryFirs.length,
    CLOSURE: closureFirs.length,
    UNTRACED: untracedFirs.length,
  };

  const currentConfig = TAB_CONFIGS[activeTab];

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedOrderFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedOrderFileData(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  // Open Court Order Assignment Modal
  const handleOpenOrderModal = (preSelectedFirId?: string) => {
    setSelectedFirIdForOrder(preSelectedFirId || currentTabFirs[0]?.id || firs[0]?.id || "");
    setCourtName("Hon'ble Court of CJM, Panipat");
    setOrderNumber(`ORD/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`);
    setOrderDate(new Date().toISOString().split("T")[0]);
    setSelectedIoId(MOCK_ENQUIRY_OFFICERS[2]?.id || MOCK_ENQUIRY_OFFICERS[0]?.id || "");
    setUploadedOrderFileName("");
    setUploadedOrderFileData("");
    setOrderDirections("");
    setModalSuccessMsg("");
    setModalErrorMsg("");
    setIsOrderModalOpen(true);
  };

  // Submit Court Order Assignment
  const handleSubmitCourtOrder = () => {
    if (!selectedFirIdForOrder) {
      setModalErrorMsg("कृपया एक FIR चुनें (Please select an FIR)");
      return;
    }
    if (!orderNumber.trim()) {
      setModalErrorMsg("कृपया कोर्ट ऑर्डर नंबर दर्ज करें (Please enter Court Order Number)");
      return;
    }
    if (!selectedIoId) {
      setModalErrorMsg("कृपया जांच अधिकारी (IO) चुनें (Please assign an IO)");
      return;
    }

    const targetFir = firs.find((f) => f.id === selectedFirIdForOrder);
    if (!targetFir) {
      setModalErrorMsg("चयनित FIR नहीं मिली (Selected FIR not found)");
      return;
    }

    const assignedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => eo.id === selectedIoId);
    if (!assignedOfficer) {
      setModalErrorMsg("चयनित जांच अधिकारी नहीं मिला (Assigned IO not found)");
      return;
    }

    setIsSubmitting(true);
    setModalErrorMsg("");

    try {
      // 1. Update FIR via firService
      firService.assignIoWithCourtOrder({
        firId: targetFir.id,
        ioId: assignedOfficer.id,
        ioName: assignedOfficer.name,
        rank: assignedOfficer.rank,
        courtName: courtName.trim() || "Hon'ble Court",
        courtOrderNumber: orderNumber.trim(),
        courtOrderDate: orderDate,
        courtOrderDocumentName: uploadedOrderFileName,
        courtOrderDocumentUrl: uploadedOrderFileData,
        directions: orderDirections.trim(),
        assignedBy: currentUser?.name || "Inspector Rajesh Kumar (SHO)",
      });

      // 2. Dispatch Officer Notification to the assigned IO
      const notification: OfficerNotification = {
        id: `notif-${Date.now()}`,
        recipientPno: assignedOfficer.pno || assignedOfficer.beltNumber || "PNO-DEFAULT",
        recipientName: assignedOfficer.name,
        complaintId: targetFir.id,
        complaintNumber: targetFir.firNumber,
        title: `Court Order Assignment: FIR ${targetFir.firNumber}`,
        message: `FIR No. ${targetFir.firNumber} has been assigned to you as per Court Order No. ${orderNumber} (${courtName}) dated ${orderDate}.`,
        directions: orderDirections || "Conduct further investigation / compliance as per court order.",
        priority: "URGENT",
        createdAt: new Date().toISOString(),
        read: false,
      };

      if (typeof window !== "undefined" && window.localStorage) {
        try {
          const stored = window.localStorage.getItem("haryana_police_cms_notifications_v1");
          const list: OfficerNotification[] = stored ? JSON.parse(stored) : [];
          list.unshift(notification);
          window.localStorage.setItem("haryana_police_cms_notifications_v1", JSON.stringify(list));
          window.dispatchEvent(new CustomEvent("officer_notifications_updated", { detail: notification }));
          window.dispatchEvent(new CustomEvent("firs_updated"));
        } catch (storageErr) {
          console.warn("Could not write notification to storage:", storageErr);
        }
      }

      setModalSuccessMsg(`FIR ${targetFir.firNumber} सफलतापूर्वक ${assignedOfficer.name} को असाइन कर दी गई है और नोटिफिकेशन भेज दिया गया है।`);

      setTimeout(() => {
        setIsOrderModalOpen(false);
        setModalSuccessMsg("");
      }, 1800);
    } catch (err) {
      console.error("Court order assignment failed:", err);
      setModalErrorMsg("ऑर्डर दर्ज करने में त्रुटि आई। कृपया पुनः प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                Part B • Case Disposal
              </span>
              <span className="text-slate-400 text-xs">/</span>
              <span className="text-xs text-slate-500 font-medium">Sec 193 BNSS</span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-slate-800" />
              <span>FIR Part B</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              अंतिम रिपोर्ट (Final Report) निस्तारण, सप्लीमेंट्री चालान, खारिजी एवं अदम सुराग रजिस्टर
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Court Order Assign Button */}
            <button
              type="button"
              onClick={() => handleOpenOrderModal()}
              className="text-xs font-bold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Gavel className="w-3.5 h-3.5 text-indigo-200" />
              <span>Reopen FIR</span>
            </button>

            <Link
              href="/fir"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              <span>FIR Register</span>
            </Link>

            <Link
              href={`/fir-workspace/drafts?type=${activeTab === "SUPPLEMENTARY" ? "CHARGESHEET" : activeTab}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>New {currentConfig.title} Draft</span>
            </Link>
          </div>
        </div>

        {/* Minimalist 4 Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar">
          {(Object.keys(TAB_CONFIGS) as PartBTab[]).map((key) => {
            const conf = TAB_CONFIGS[key];
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveTab(key);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-white border border-slate-200/80"
                }`}
              >
                <span>{conf.title}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* Tab Context Banner - Minimalist */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900">{currentConfig.title}</span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">{currentConfig.hindiTitle}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border ${currentConfig.badgeColor}`}>
                {currentConfig.statutoryForm}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{currentConfig.desc}</p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FIR No., Complainant, IO, Court..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Content Table / Minimal Card View */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading records...</div>
          ) : filteredFirs.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800">
                {searchQuery ? "No matching records found" : `No FIRs in ${currentConfig.title}`}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "Try searching with a different FIR number or name."
                  : `Currently there are no FIRs categorized under ${currentConfig.title}. You can submit a Final Report from FIR Workspace or upload Court Order to re-assign.`}
              </p>
              {!searchQuery && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenOrderModal()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    Reopen FIR
                  </button>
                  <Link
                    href={`/fir-workspace/drafts?type=${activeTab === "SUPPLEMENTARY" ? "CHARGESHEET" : activeTab}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                  >
                    Draft {currentConfig.title}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">FIR No. &amp; Date</th>
                    <th className="py-2.5 px-3">Complainant / Accused</th>
                    <th className="py-2.5 px-3">Acts &amp; Sections</th>
                    <th className="py-2.5 px-3">Investigating Officer</th>
                    <th className="py-2.5 px-3">Final Report / Court Order</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFirs.map((fir) => {
                    const accusedNames =
                      fir.accusedList?.map((a) => a.name).join(", ") || "Unknown";
                    const reportNo =
                      fir.finalFormNumber ||
                      fir.reports?.find(
                        (r) =>
                          r.reportType === "CHARGESHEET" ||
                          r.reportType === "CLOSURE_REPORT"
                      )?.dispatchNo ||
                      "Pending No.";
                    const court =
                      fir.courtName ||
                      fir.assignedDirections?.split("before")?.[1]?.trim() ||
                      "Hon'ble Court of CJM";

                    return (
                      <tr
                        key={fir.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* 1. FIR No & Date */}
                        <td className="py-3 px-3 align-top">
                          <Link
                            href={`/fir/${fir.id}`}
                            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1"
                          >
                            <span>{fir.firNumber}</span>
                          </Link>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {formatDate(fir.firDate)} {fir.firTime || ""}
                          </div>
                          {fir.cctnsFirNumber && (
                            <span className="text-[9px] text-slate-500 font-mono bg-slate-100 px-1 rounded">
                              {fir.cctnsFirNumber}
                            </span>
                          )}
                        </td>

                        {/* 2. Complainant / Accused */}
                        <td className="py-3 px-3 align-top max-w-[200px]">
                          <div className="font-medium text-slate-800 truncate" title={fir.complainantName}>
                            {fir.complainantName}
                          </div>
                          <div
                            className="text-[11px] text-slate-500 truncate mt-0.5"
                            title={`Accused: ${accusedNames}`}
                          >
                            <span className="text-[10px] font-semibold text-slate-400">Accused: </span>
                            {accusedNames}
                          </div>
                        </td>

                        {/* 3. Acts & Sections */}
                        <td className="py-3 px-3 align-top max-w-[200px]">
                          <div
                            className="text-slate-800 font-mono text-[11px] truncate"
                            title={fir.actsAndSections}
                          >
                            {fir.actsAndSections}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {fir.policeStation}
                          </div>
                        </td>

                        {/* 4. IO */}
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>{fir.assignedIoName || "Not Assigned"}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {fir.assignedIoRank || fir.assignedIoBeltNumber || ""}
                          </div>
                          {fir.courtOrderNumber && (
                            <div className="text-[9px] text-indigo-600 font-bold mt-0.5">
                              Assigned via Court Order
                            </div>
                          )}
                        </td>

                        {/* 5. Report / Court Order Details */}
                        <td className="py-3 px-3 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-semibold text-slate-800">
                              {reportNo}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${currentConfig.badgeColor}`}
                            >
                              {activeTab === "CHARGESHEET"
                                ? "Sent to SHO / Court"
                                : activeTab === "SUPPLEMENTARY"
                                ? "Supplementary"
                                : activeTab === "CLOSURE"
                                ? "Closure Submitted"
                                : "Untraced Filed"}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[220px]" title={court}>
                            {court}
                          </div>
                          {fir.courtOrderNumber && (
                            <div className="text-[10px] text-indigo-700 font-mono mt-0.5 flex items-center gap-1">
                              <Gavel className="w-3 h-3 text-indigo-600" />
                              <span>Order: {fir.courtOrderNumber}</span>
                              {fir.courtOrderDate && <span>({formatDate(fir.courtOrderDate)})</span>}
                            </div>
                          )}
                        </td>

                        {/* 6. Action */}
                        <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenOrderModal(fir.id)}
                              title="Reopen FIR"
                              className="px-2 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Gavel className="w-3 h-3" />
                              <span>Assign</span>
                            </button>
                            <Link
                              href={`/fir/${fir.id}`}
                              className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              View
                            </Link>
                            <Link
                              href={`/fir-workspace/drafts?firId=${fir.id}&type=${
                                activeTab === "SUPPLEMENTARY" ? "CHARGESHEET" : activeTab
                              }`}
                              className="px-2 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                            >
                              <span>Report</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* REOPEN FIR MODAL */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm tracking-tight">Reopen FIR (Court Order &amp; IO Assignment)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Alert Messages */}
              {modalErrorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalErrorMsg}</span>
                </div>
              )}
              {modalSuccessMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{modalSuccessMsg}</span>
                </div>
              )}

              {/* 1. FIR Selection Dropdown (Only FIRs on Part B / active page) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Select FIR (FIR Part B Dropdown) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedFirIdForOrder}
                  onChange={(e) => setSelectedFirIdForOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                >
                  <option value="">-- Choose FIR --</option>
                  {(currentTabFirs.length > 0 ? currentTabFirs : firs).map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.firNumber} — {f.complainantName} ({f.actsAndSections}) [{f.mainStatus || f.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Court Name, Order Number & Date in wider responsive grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Court Name</label>
                  <input
                    type="text"
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    placeholder="Court of CJM / Sessions Judge"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Order Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. ORD/2026/049"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Court Order Date</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* 3. Upload Court Order Document & Assign IO Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Court Order Document Column */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Court Order Document (Upload Copy)</label>
                  <div className="border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-3 text-center bg-slate-50/50 transition-colors h-[86px] flex items-center justify-center">
                    <input
                      type="file"
                      id="court-order-file-input"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="court-order-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center gap-1 w-full"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 truncate max-w-[280px]">
                        {uploadedOrderFileName ? uploadedOrderFileName : "Click to browse & upload Court Order"}
                      </span>
                      <span className="text-[10px] text-slate-400">PDF, JPG, PNG or DOCX (Max 10MB)</span>
                    </label>
                  </div>
                </div>

                {/* Assign to IO Dropdown */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Assign to IO (जांच अधिकारी) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedIoId}
                    onChange={(e) => setSelectedIoId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="">-- Choose Investigating Officer --</option>
                    {MOCK_ENQUIRY_OFFICERS.map((eo) => (
                      <option key={eo.id} value={eo.id}>
                        {eo.name} ({eo.rank}) — PNO: {eo.pno} [{eo.activeCases} Active Cases]
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    सबमिट करते ही FIR IO के FIR Register में दिखने लगेगी और नोटिफिकेशन भेजा जाएगा।
                  </p>
                </div>
              </div>

              {/* 6. Supervisory Directions */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Supervisory Directions / Remarks (Optional)</label>
                <textarea
                  value={orderDirections}
                  onChange={(e) => setOrderDirections(e.target.value)}
                  rows={2}
                  placeholder="e.g. Conduct further enquiry as per directions in court order and submit status report within 15 days."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmitCourtOrder}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Submitting...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Reopen FIR &amp; Assign IO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FIRPartBPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading FIR Part B...</div>}>
      <FIRPartBContent />
    </Suspense>
  );
}
