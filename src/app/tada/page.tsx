"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Trash2,
  Printer,
  Save,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Building,
  User,
  Shield,
  CreditCard,
  History,
  Copy,
  ReceiptText,
  AlertCircle,
  Check,
  Sparkles,
  Eye,
  Download,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  TADABillRecord,
  TourProgrammeJourneyRow,
  TAClaimJourneyRow,
} from "@/types/tada";
import {
  tadaService,
  createBlankTADABill,
  createBlankTourJourneyRow,
  createBlankClaimJourneyRow,
} from "@/services/tadaService";
import {
  tadaAutoFillService,
  MonthInfo,
  getRecentMonthsList,
  getLastMonthInfo,
} from "@/services/tadaAutoFillService";
import { TADAPreviewModal } from "@/components/tada/TADAPreviewModal";
import { amountToWordsEnglish, amountToWordsHindi } from "@/utils/numberToWords";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ActiveTab = "FORM1" | "FORM2" | "FORM3" | "HISTORY";

export default function TADAPage() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id || "guest_user";
  const userName = currentUser?.name || "Officer";

  const [activeTab, setActiveTab] = useState<ActiveTab>("FORM1");
  const [bill, setBill] = useState<TADABillRecord>(() =>
    createBlankTADABill(userId, userName)
  );
  const [savedBills, setSavedBills] = useState<TADABillRecord[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [printTarget, setPrintTarget] = useState<"ALL" | "FORM1" | "FORM2" | "FORM3">("FORM1");
  const [printDropdownOpen, setPrintDropdownOpen] = useState(false);
  const printDropdownRef = useRef<HTMLDivElement | null>(null);

  // Preview Modal & Auto-sync states
  const [previewModalBill, setPreviewModalBill] = useState<TADABillRecord | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSyncingGd, setIsSyncingGd] = useState(false);
  const [autoSyncBanner, setAutoSyncBanner] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<MonthInfo[]>([]);
  const [selectedSyncMonthKey, setSelectedSyncMonthKey] = useState<string>("");

  useEffect(() => {
    setAvailableMonths(getRecentMonthsList(6));
  }, []);

  // Load user bills strictly isolated to active user
  const loadUserBills = () => {
    if (currentUser) {
      const records = tadaService.getByUser(currentUser.id, currentUser.pno, currentUser.name);
      setSavedBills(records);
      return records;
    }
    return [];
  };

  // Auto 01-date extraction from Roznamcha GD for last month on mount / user change
  useEffect(() => {
    if (currentUser && currentUser.id) {
      const records = tadaService.getByUser(currentUser.id, currentUser.pno, currentUser.name);
      setSavedBills(records);
      if (records.length > 0) {
        setBill(records[0]);
      } else {
        setBill(createBlankTADABill(currentUser.id, currentUser.name));
      }

      void tadaAutoFillService.autoSyncLastMonthBill(currentUser).then((res) => {
        if (res.generated && res.bill) {
          setBill(res.bill);
          setSavedBills((prev) => {
            const exists = prev.some((b) => b.id === res.bill.id);
            return exists ? prev.map((b) => (b.id === res.bill.id ? res.bill : b)) : [res.bill, ...prev];
          });
          setAutoSyncBanner(res.message);
        }
      });
    }

    const handleBillsChanged = () => {
      if (currentUser) {
        const records = tadaService.getByUser(currentUser.id, currentUser.pno, currentUser.name);
        setSavedBills(records);
      }
    };
    window.addEventListener("cms_tada_bills_changed", handleBillsChanged);
    return () => window.removeEventListener("cms_tada_bills_changed", handleBillsChanged);
  }, [currentUser]);

  const handleOpenPreview = (b: TADABillRecord) => {
    setPreviewModalBill(b);
    setIsPreviewOpen(true);
  };

  const handleDirectDownloadOrPrint = (b: TADABillRecord) => {
    setBill(b);
    handleTriggerPrint("ALL");
  };

  const handleManualSync = async (monthInfo?: MonthInfo) => {
    if (!currentUser || !currentUser.id) return;
    setIsSyncingGd(true);
    try {
      const res = monthInfo
        ? await tadaAutoFillService.syncSpecificMonthBill(currentUser, monthInfo, true)
        : await tadaAutoFillService.autoSyncLastMonthBill(currentUser, true);

      if (res.bill) {
        setBill(res.bill);
        setSavedBills((prev) => {
          const exists = prev.some((b) => b.id === res.bill.id);
          return exists ? prev.map((b) => (b.id === res.bill.id ? res.bill : b)) : [res.bill, ...prev];
        });
      }
      loadUserBills();
      setAutoSyncBanner(res.message);
      setActiveTab("HISTORY");
    } catch (err: any) {
      console.error("Failed to sync TA/DA bill:", err);
      alert("सिंक करने में त्रुटि: " + (err?.message || "अज्ञात समस्या"));
    } finally {
      setIsSyncingGd(false);
    }
  };

  // Click outside to close print dropdown
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (printDropdownRef.current && !printDropdownRef.current.contains(e.target as Node)) {
        setPrintDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Sync basic details between forms when edited
  const updateCommonField = (field: "employeeName" | "designation" | "month" | "year", value: string) => {
    setBill((prev) => {
      const next = { ...prev };
      if (field === "employeeName") {
        next.form1TourProgramme.employeeName = value;
        next.form1TourProgramme.claimantName = value;
        next.form2JourneyDetails.employeeName = value;
      } else if (field === "designation") {
        next.form1TourProgramme.designation = value;
        next.form2JourneyDetails.designation = value;
      } else if (field === "month") {
        next.form1TourProgramme.month = value;
        next.form2JourneyDetails.claimMonth = value;
      } else if (field === "year") {
        next.form1TourProgramme.year = value;
        next.form2JourneyDetails.claimYear = value;
      }
      return next;
    });
  };

  // Helper for image uploads (signatures / stamps)
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          onSuccess(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // ===================== FORM 1 (TOUR PROGRAMME) HANDLERS =====================
  const addTourJourneyRow = () => {
    setBill((prev) => {
      const current = prev.form1TourProgramme.journeys;
      const newRow = createBlankTourJourneyRow(current.length + 1);
      return {
        ...prev,
        form1TourProgramme: {
          ...prev.form1TourProgramme,
          journeys: [...current, newRow],
        },
      };
    });
  };

  const updateTourJourneyRow = (id: string, updates: Partial<TourProgrammeJourneyRow>) => {
    setBill((prev) => {
      const journeys = prev.form1TourProgramme.journeys.map((j) =>
        j.id === id ? { ...j, ...updates } : j
      );
      return {
        ...prev,
        form1TourProgramme: {
          ...prev.form1TourProgramme,
          journeys,
        },
      };
    });
  };

  const deleteTourJourneyRow = (id: string) => {
    setBill((prev) => {
      const filtered = prev.form1TourProgramme.journeys
        .filter((j) => j.id !== id)
        .map((j, idx) => ({ ...j, srNo: idx + 1 }));
      return {
        ...prev,
        form1TourProgramme: {
          ...prev.form1TourProgramme,
          journeys: filtered.length ? filtered : [createBlankTourJourneyRow(1)],
        },
      };
    });
  };

  // ===================== FORM 2 (JOURNEY DETAILS) HANDLERS =====================
  const addClaimJourneyRow = () => {
    setBill((prev) => {
      const current = prev.form2JourneyDetails.journeys;
      const newRow = createBlankClaimJourneyRow(current.length + 1);
      return {
        ...prev,
        form2JourneyDetails: {
          ...prev.form2JourneyDetails,
          journeys: [...current, newRow],
        },
      };
    });
  };

  const updateClaimJourneyRow = (id: string, updates: Partial<TAClaimJourneyRow>) => {
    setBill((prev) => {
      const journeys = prev.form2JourneyDetails.journeys.map((j) => {
        if (j.id !== id) return j;
        const nextRow = { ...j, ...updates };

        // Auto calculate daily allowance amount = days * rate
        const days = Number(nextRow.dailyAllowanceDays) || 0;
        const rate = Number(nextRow.dailyAllowanceRate) || 0;
        nextRow.dailyAllowanceAmount = Number((days * rate).toFixed(2));

        // Auto calculate row total = fare + road mileage + actual expenses + da amount
        const fare = Number(nextRow.railSteamerFareAmount) || 0;
        const mileage = Number(nextRow.roadMileageAmount) || 0;
        const actual = Number(nextRow.actualExpenses) || 0;
        nextRow.totalAmount = Number((fare + mileage + actual + nextRow.dailyAllowanceAmount).toFixed(2));

        return nextRow;
      });

      // Recalculate total claim amount across all rows
      const totalClaim = journeys.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const passedAmount = prev.form2JourneyDetails.passedForPaymentAmount || totalClaim;
      const advanceDrawn = prev.form2JourneyDetails.minusAdvanceDrawn || 0;
      const netPayable = Number((passedAmount - advanceDrawn).toFixed(2));

      return {
        ...prev,
        form2JourneyDetails: {
          ...prev.form2JourneyDetails,
          journeys,
          totalClaimAmount: Number(totalClaim.toFixed(2)),
          totalClaimAmountWordsEn: amountToWordsEnglish(totalClaim),
          totalClaimAmountWordsHi: amountToWordsHindi(totalClaim),
          netPayableAmount: netPayable,
          netPayableAmountWordsEn: amountToWordsEnglish(netPayable),
          netPayableAmountWordsHi: amountToWordsHindi(netPayable),
        },
      };
    });
  };

  const deleteClaimJourneyRow = (id: string) => {
    setBill((prev) => {
      const filtered = prev.form2JourneyDetails.journeys
        .filter((j) => j.id !== id)
        .map((j, idx) => ({ ...j, srNo: idx + 1 }));
      const journeys = filtered.length ? filtered : [createBlankClaimJourneyRow(1)];

      const totalClaim = journeys.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const passedAmount = prev.form2JourneyDetails.passedForPaymentAmount || totalClaim;
      const advanceDrawn = prev.form2JourneyDetails.minusAdvanceDrawn || 0;
      const netPayable = Number((passedAmount - advanceDrawn).toFixed(2));

      return {
        ...prev,
        form2JourneyDetails: {
          ...prev.form2JourneyDetails,
          journeys,
          totalClaimAmount: Number(totalClaim.toFixed(2)),
          totalClaimAmountWordsEn: amountToWordsEnglish(totalClaim),
          totalClaimAmountWordsHi: amountToWordsHindi(totalClaim),
          netPayableAmount: netPayable,
          netPayableAmountWordsEn: amountToWordsEnglish(netPayable),
          netPayableAmountWordsHi: amountToWordsHindi(netPayable),
        },
      };
    });
  };

  // Import rows from Tour Programme into Form 2
  const handleImportTourJourneys = () => {
    if (!bill.form1TourProgramme.journeys.length) {
      alert("टूर प्रोग्राम (Form 1) में कोई यात्रा पंक्ति नहीं है!");
      return;
    }
    const converted = tadaService.convertTourJourneysToClaim(bill.form1TourProgramme.journeys);
    setBill((prev) => {
      const journeys = converted.length ? converted : [createBlankClaimJourneyRow(1)];
      const totalClaim = journeys.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
      const passedAmount = prev.form2JourneyDetails.passedForPaymentAmount || totalClaim;
      const advanceDrawn = prev.form2JourneyDetails.minusAdvanceDrawn || 0;
      const netPayable = Number((passedAmount - advanceDrawn).toFixed(2));

      return {
        ...prev,
        form2JourneyDetails: {
          ...prev.form2JourneyDetails,
          journeys,
          totalClaimAmount: Number(totalClaim.toFixed(2)),
          totalClaimAmountWordsEn: amountToWordsEnglish(totalClaim),
          totalClaimAmountWordsHi: amountToWordsHindi(totalClaim),
          netPayableAmount: netPayable,
          netPayableAmountWordsEn: amountToWordsEnglish(netPayable),
          netPayableAmountWordsHi: amountToWordsHindi(netPayable),
        },
      };
    });
    alert(`सफलतापूर्वक ${converted.length} यात्रा पंक्तियाँ टूर प्रोग्राम से आयात (Import) कर ली गईं!`);
  };

  // Recalculate Form 2 Deductions and Net
  const updateForm2PaymentField = (
    field: "passedForPaymentAmount" | "minusAdvanceDrawn" | "amountOfAdvanceTaken",
    val: number
  ) => {
    setBill((prev) => {
      const f2 = { ...prev.form2JourneyDetails, [field]: val };
      const passed = field === "passedForPaymentAmount" ? val : f2.passedForPaymentAmount;
      const advance = field === "minusAdvanceDrawn" ? val : f2.minusAdvanceDrawn;
      const net = Number((passed - advance).toFixed(2));

      f2.passedAmountWordsEn = amountToWordsEnglish(passed);
      f2.passedAmountWordsHi = amountToWordsHindi(passed);
      f2.netPayableAmount = net;
      f2.netPayableAmountWordsEn = amountToWordsEnglish(net);
      f2.netPayableAmountWordsHi = amountToWordsHindi(net);

      return { ...prev, form2JourneyDetails: f2 };
    });
  };

  // ===================== FORM 3 (MAIN BILL PAGE) HANDLERS =====================
  const updateForm3Appropriation = (
    field: "appropriationAmount" | "expenditureIncludingBill" | "passedForAmount",
    val: number
  ) => {
    setBill((prev) => {
      const f3 = { ...prev.form3MainPage, [field]: val };
      const approp = field === "appropriationAmount" ? val : f3.appropriationAmount;
      const exp = field === "expenditureIncludingBill" ? val : f3.expenditureIncludingBill;
      f3.balanceAvailable = Number((approp - exp).toFixed(2));

      if (field === "passedForAmount") {
        f3.passedAmountWordsEn = amountToWordsEnglish(val);
        f3.passedAmountWordsHi = amountToWordsHindi(val);
      }
      return { ...prev, form3MainPage: f3 };
    });
  };

  // Save current bill to user history
  const handleSaveBill = (status: "DRAFT" | "SUBMITTED" = "DRAFT") => {
    const toSave: TADABillRecord = {
      ...bill,
      status,
      userId: currentUser?.id || userId,
      userName: bill.form1TourProgramme.employeeName || userName,
    };
    const saved = tadaService.save(toSave, currentUser?.id || userId);
    setBill(saved);
    setSavedBills((prev) => {
      const exists = prev.some((b) => b.id === saved.id);
      return exists ? prev.map((b) => (b.id === saved.id ? saved : b)) : [saved, ...prev];
    });
    loadUserBills();
    setSaveSuccessMsg(`सफलतापूर्वक सुरक्षित (Saved)! ID: ${saved.id}`);
    setTimeout(() => setSaveSuccessMsg(""), 4000);
  };

  // Start new blank bill
  const handleNewBlankBill = () => {
    if (confirm("क्या आप नया खाली दावा (New Blank TA Claim) शुरू करना चाहते हैं? वर्तमान असहेजे गए बदलाव हट जाएंगे।")) {
      const blank = createBlankTADABill(userId, userName);
      setBill(blank);
      setActiveTab("FORM1");
    }
  };

  // Delete bill from history
  const handleDeleteBill = (id: string) => {
    if (confirm("क्या आप इस बिल रिकॉर्ड को हटाना चाहते हैं?")) {
      tadaService.delete(id, userId);
      loadUserBills();
      if (bill.id === id) {
        setBill(createBlankTADABill(userId, userName));
      }
    }
  };

  // Load bill from history
  const handleLoadBill = (rec: TADABillRecord) => {
    setBill(rec);
    setActiveTab("FORM1");
  };

  // Trigger browser print
  const handleTriggerPrint = (target: "ALL" | "FORM1" | "FORM2" | "FORM3") => {
    setPrintTarget(target);
    setPrintDropdownOpen(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 pb-16">
      {/* ===================== SCREEN HEADER (Hidden in Print) ===================== */}
      <div className="no-print bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Travelling Allowance / TA Bill (यात्रा भत्ता प्रपत्र)
                </h1>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  Haryana Civil Services Rules
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Bilingual Tour Programme, Journey Details Claim &amp; Main Bill Page (Rule 77)
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewBlankBill}
            className="text-xs font-bold gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            title="Start completely empty form"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Form (नया खाली प्रपत्र)</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSaveBill("DRAFT")}
            className="text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft (सहेजें)</span>
          </Button>

          {/* Print Dropdown */}
          <div className="relative" ref={printDropdownRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrintDropdownOpen(!printDropdownOpen)}
              className="text-xs font-bold gap-1.5 border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print / PDF (प्रिंट करें)</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Button>

            {printDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1 text-xs">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase">
                  Select Form to Print / PDF
                </div>
                <button
                  type="button"
                  onClick={() => handleTriggerPrint("FORM1")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between"
                >
                  <span className="font-semibold">Form 1: Tour Programme</span>
                  <span className="text-[10px] text-slate-500 font-mono">A4 Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerPrint("FORM2")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between"
                >
                  <span className="font-semibold">Form 2: Journey Details</span>
                  <span className="text-[10px] text-slate-500 font-mono">A4 Landscape</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerPrint("FORM3")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between"
                >
                  <span className="font-semibold">Form 3: TA Bill (Rule 77)</span>
                  <span className="text-[10px] text-slate-500 font-mono">A4 Portrait</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  type="button"
                  onClick={() => handleTriggerPrint("ALL")}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 font-bold text-slate-800 flex items-center justify-between"
                >
                  <span>Print Complete Set (All 3)</span>
                  <Printer className="w-3 h-3 text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="no-print p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in-50">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* ===================== TAB NAVIGATION (Screen View) ===================== */}
      <div className="no-print bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("FORM1")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "FORM1"
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">1</span>
            <span>Tour Programme (टूर प्रोग्राम)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FORM2")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "FORM2"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>Journey Details Claim (यात्रा विवरण)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("FORM3")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "FORM3"
                ? "bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
            <span>TA Bill Main Page (बिल मुख्य पृष्ठ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "HISTORY"
                ? "bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            <span>My TA History (मेरी प्रविष्टियाँ)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-800 font-bold">
              {savedBills.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] font-semibold text-slate-500 px-2">
          Officer: <strong className="text-slate-800">{userName}</strong>
        </div>
      </div>

      {/* ===================== TAB 1: FORM 1 — TOUR PROGRAMME ===================== */}
      {activeTab === "FORM1" && (
        <Card className="no-print border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  FORM 1 — TOUR PROGRAMME (टूर प्रोग्राम)
                </h2>
                <p className="text-xs text-slate-500">
                  प्रस्थान, आगमन, ड्यूटी प्रयोजन एवं वाहन विवरण प्रविष्टि
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleTriggerPrint("FORM1")}
                className="text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Printer className="w-3 h-3" />
                <span>Print Form 1</span>
              </Button>
            </div>

            {/* A. Top Details Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                A. ऊपर का विवरण (Employee &amp; Office Particulars)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    1. Department / विभाग
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.department}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, department: e.target.value },
                      }))
                    }
                    placeholder="e.g. Police Department"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    2. District / जिला
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.district}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, district: e.target.value },
                      }))
                    }
                    placeholder="e.g. Dabwali / Sirsa"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    3. Employee Name / कर्मचारी का नाम
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.employeeName}
                    onChange={(e) => updateCommonField("employeeName", e.target.value)}
                    placeholder="नाम दर्ज करें"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    4. Designation / पद
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.designation}
                    onChange={(e) => updateCommonField("designation", e.target.value)}
                    placeholder="e.g. Constable / Head Constable"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    5. Belt / Employee No. / बेल्ट या कर्मचारी नम्बर
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.beltEmployeeNumber}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, beltEmployeeNumber: e.target.value },
                      }))
                    }
                    placeholder="e.g. 505/DWL"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    6. Month / माह
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.month}
                    onChange={(e) => updateCommonField("month", e.target.value)}
                    placeholder="e.g. July"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    7. Year / वर्ष
                  </label>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.year}
                    onChange={(e) => updateCommonField("year", e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* B. Journey Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  B. यात्रा की सूची (Tour Journeys — 13 Columns)
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addTourJourneyRow}
                  className="text-xs font-bold gap-1 border-amber-300 text-amber-900 bg-amber-50/70 hover:bg-amber-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>नई पंक्ति जोड़ें (Add Row)</span>
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200 text-center w-10">क्र. सं.</th>
                      <th className="p-2 border-r border-slate-200 w-24">प्रस्थान DD No.</th>
                      <th className="p-2 border-r border-slate-200 min-w-[140px]">तैनाती स्थान व प्रस्थान स्टेशन</th>
                      <th className="p-2 border-r border-slate-200 w-28">प्रस्थान दिनांक</th>
                      <th className="p-2 border-r border-slate-200 w-24">प्रस्थान समय</th>
                      <th className="p-2 border-r border-slate-200 min-w-[140px]">आगमन स्टेशन</th>
                      <th className="p-2 border-r border-slate-200 w-24">आगमन DD No.</th>
                      <th className="p-2 border-r border-slate-200 w-28">आगमन दिनांक</th>
                      <th className="p-2 border-r border-slate-200 w-24">आगमन समय</th>
                      <th className="p-2 border-r border-slate-200 w-20 text-center">दिन (Days)</th>
                      <th className="p-2 border-r border-slate-200 min-w-[130px]">यात्रा का उद्देश्य</th>
                      <th className="p-2 border-r border-slate-200 w-28">यात्रा साधन</th>
                      <th className="p-2 border-r border-slate-200 w-20 text-right">दूरी (KM)</th>
                      <th className="p-2 text-center w-10">हटाएं</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bill.form1TourProgramme.journeys.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-amber-50/20">
                        <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.departureDdNo}
                            onChange={(e) => updateTourJourneyRow(row.id, { departureDdNo: e.target.value })}
                            placeholder="DD No."
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.postingAndDepStation}
                            onChange={(e) => updateTourJourneyRow(row.id, { postingAndDepStation: e.target.value })}
                            placeholder="Place of Posting & Dep."
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="date"
                            value={row.departureDate}
                            onChange={(e) => updateTourJourneyRow(row.id, { departureDate: e.target.value })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="time"
                            value={row.departureTime}
                            onChange={(e) => updateTourJourneyRow(row.id, { departureTime: e.target.value })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.arrivalStation}
                            onChange={(e) => updateTourJourneyRow(row.id, { arrivalStation: e.target.value })}
                            placeholder="Arrival Station"
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.arrivalDdNo}
                            onChange={(e) => updateTourJourneyRow(row.id, { arrivalDdNo: e.target.value })}
                            placeholder="DD No."
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="date"
                            value={row.arrivalDate}
                            onChange={(e) => updateTourJourneyRow(row.id, { arrivalDate: e.target.value })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="time"
                            value={row.arrivalTime}
                            onChange={(e) => updateTourJourneyRow(row.id, { arrivalTime: e.target.value })}
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={row.noOfDays || ""}
                            onChange={(e) => updateTourJourneyRow(row.id, { noOfDays: e.target.value })}
                            placeholder="Days"
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.purposeOfJourney}
                            onChange={(e) => updateTourJourneyRow(row.id, { purposeOfJourney: e.target.value })}
                            placeholder="Purpose (e.g. Law & Order Duty)"
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.modeOfVehicle}
                            onChange={(e) => updateTourJourneyRow(row.id, { modeOfVehicle: e.target.value })}
                            placeholder="Govt. Vehicle / Bus / Train"
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.distanceKm}
                            onChange={(e) => updateTourJourneyRow(row.id, { distanceKm: e.target.value })}
                            placeholder="KM"
                            className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-right"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => deleteTourJourneyRow(row.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="पंक्ति हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* C. Signatures & Approvals */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                C. नीचे के हस्ताक्षर और अनुमोदन (Signatures &amp; Approvals)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Approving Officer */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <span className="font-bold text-slate-700 block">
                    1. Approving Officer / अनुमोदन अधिकारी
                  </span>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.approvalRemarks}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, approvalRemarks: e.target.value },
                      }))
                    }
                    placeholder="Approval Remarks (e.g. Approved)"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={bill.form1TourProgramme.approvingOfficerNameTitle}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, approvingOfficerNameTitle: e.target.value },
                      }))
                    }
                    placeholder="e.g. Deputy Superintendent of Police (HQ)"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Stamp / Sign</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form1TourProgramme: { ...prev.form1TourProgramme, approvingOfficerSignatureImg: dataUrl },
                            }))
                          )
                        }
                      />
                    </label>
                    {bill.form1TourProgramme.approvingOfficerSignatureImg && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Attached</span>
                    )}
                  </div>
                </div>

                {/* 2. Forwarding / Line Officer */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <span className="font-bold text-slate-700 block">
                    2. Forwarding Officer / अग्रेषित अधिकारी
                  </span>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.forwardingRemarks}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, forwardingRemarks: e.target.value },
                      }))
                    }
                    placeholder="e.g. Sir Forwarded Please / FORWARD PL"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={bill.form1TourProgramme.forwardingOfficerNameTitle}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, forwardingOfficerNameTitle: e.target.value },
                      }))
                    }
                    placeholder="e.g. Line Officer, Police Line"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Stamp / Sign</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form1TourProgramme: { ...prev.form1TourProgramme, forwardingOfficerSignatureImg: dataUrl },
                            }))
                          )
                        }
                      />
                    </label>
                    {bill.form1TourProgramme.forwardingOfficerSignatureImg && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Attached</span>
                    )}
                  </div>
                </div>

                {/* 3. Claimant Signature */}
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <span className="font-bold text-slate-700 block">
                    3. Claimant Signature / दावेदार के हस्ताक्षर
                  </span>
                  <input
                    type="text"
                    value={bill.form1TourProgramme.claimantName}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, claimantName: e.target.value },
                      }))
                    }
                    placeholder="दावेदार का नाम"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={bill.form1TourProgramme.claimantDesignationBelt}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form1TourProgramme: { ...prev.form1TourProgramme, claimantDesignationBelt: e.target.value },
                      }))
                    }
                    placeholder="पद एवं बेल्ट नम्बर"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <label className="cursor-pointer text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      <span>Upload Signature</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form1TourProgramme: { ...prev.form1TourProgramme, claimantSignatureImg: dataUrl },
                            }))
                          )
                        }
                      />
                    </label>
                    {bill.form1TourProgramme.claimantSignatureImg && (
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Attached</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== TAB 2: FORM 2 — JOURNEY DETAILS CLAIM ===================== */}
      {activeTab === "FORM2" && (
        <Card className="no-print border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  FORM 2 — TRAVELLING ALLOWANCE CLAIM: JOURNEY DETAILS (यात्रा विवरण दावा)
                </h2>
                <p className="text-xs text-slate-500">
                  रेल/सड़क किराया, दैनिक भत्ता (DA), वास्तविक व्यय, कुल दावा व अग्रिम कटौती
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleImportTourJourneys}
                  className="text-xs font-bold gap-1 border-blue-300 text-blue-800 bg-blue-50/70 hover:bg-blue-100 cursor-pointer"
                  title="Copy rows from Form 1 into this table"
                >
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tour Programme से यात्रा जोड़ें</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleTriggerPrint("FORM2")}
                  className="text-xs font-bold gap-1 bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Printer className="w-3 h-3" />
                  <span>Print Form 2 (Landscape)</span>
                </Button>
              </div>
            </div>

            {/* A. Top Details Grid */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                A. ऊपर का विवरण (Claim Particulars)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    1. Claim Month / दावे का माह
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.claimMonth}
                    onChange={(e) => updateCommonField("month", e.target.value)}
                    placeholder="e.g. July"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    2. Claim Year / दावे का वर्ष
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.claimYear}
                    onChange={(e) => updateCommonField("year", e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    3. Employee Name / नाम
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.employeeName}
                    onChange={(e) => updateCommonField("employeeName", e.target.value)}
                    placeholder="कर्मचारी का नाम"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    4. Designation / पद
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.designation}
                    onChange={(e) => updateCommonField("designation", e.target.value)}
                    placeholder="e.g. Constable"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    5. Basic Pay / मूल वेतन
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.basicPay}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form2JourneyDetails: { ...prev.form2JourneyDetails, basicPay: e.target.value },
                      }))
                    }
                    placeholder="e.g. 25500"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    6. Headquarters / मुख्यालय
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.headquarters}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form2JourneyDetails: { ...prev.form2JourneyDetails, headquarters: e.target.value },
                      }))
                    }
                    placeholder="e.g. Dabwali"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    7. Grade of Govt. Servant / कर्मचारी ग्रेड
                  </label>
                  <input
                    type="text"
                    value={bill.form2JourneyDetails.gradeOfGovtServant}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form2JourneyDetails: { ...prev.form2JourneyDetails, gradeOfGovtServant: e.target.value },
                      }))
                    }
                    placeholder="e.g. Grade III"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* B. 19-Column Grouped Expenses Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  B. यात्रा एवं खर्च की सूची (19 Grouped Columns — Auto Calculates DA &amp; Row Total)
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addClaimJourneyRow}
                  className="text-xs font-bold gap-1 border-emerald-300 text-emerald-900 bg-emerald-50/70 hover:bg-emerald-100 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>नई पंक्ति जोड़ें (Add Row)</span>
                </Button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left border-collapse min-w-[1400px]">
                  <thead>
                    {/* Top Group Headers */}
                    <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-center uppercase tracking-tight text-[11px]">
                      <th rowSpan={2} className="p-2 border-r border-slate-300 w-10">क्र.</th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-300 bg-amber-50/90 text-amber-950">
                        Departure / प्रस्थान
                      </th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-300 bg-teal-50/90 text-teal-950">
                        Arrival / आगमन
                      </th>
                      <th colSpan={3} className="p-1.5 border-r border-slate-300 bg-blue-50/90 text-blue-950">
                        Journey / यात्रा विवरण
                      </th>
                      <th colSpan={8} className="p-1.5 border-r border-slate-300 bg-emerald-50/90 text-emerald-950">
                        Fare &amp; Allowance / किराया, सड़क मील भत्ता एवं दैनिक भत्ता (DA)
                      </th>
                      <th rowSpan={2} className="p-2 border-r border-slate-300 min-w-[100px]">टिप्पणी</th>
                      <th rowSpan={2} className="p-2 w-10 text-center">हटाएं</th>
                    </tr>
                    {/* Sub Headers */}
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center text-[10px]">
                      {/* Departure */}
                      <th className="p-1.5 border-r border-slate-200 min-w-[120px]">स्थान / स्टेशन</th>
                      <th className="p-1.5 border-r border-slate-200 w-24">दिनांक</th>
                      <th className="p-1.5 border-r border-slate-200 w-20">समय</th>
                      {/* Arrival */}
                      <th className="p-1.5 border-r border-slate-200 min-w-[120px]">स्थान / स्टेशन</th>
                      <th className="p-1.5 border-r border-slate-200 w-24">दिनांक</th>
                      <th className="p-1.5 border-r border-slate-200 w-20">समय</th>
                      {/* Journey */}
                      <th className="p-1.5 border-r border-slate-200 min-w-[130px]">उद्देश्य</th>
                      <th className="p-1.5 border-r border-slate-200 w-24">साधन</th>
                      <th className="p-1.5 border-r border-slate-200 w-24">श्रेणी (Class)</th>
                      {/* Fare & Allowance */}
                      <th className="p-1.5 border-r border-slate-200 w-20">रेल/स्टीमर वर्ग</th>
                      <th className="p-1.5 border-r border-slate-200 w-20">रेल किराया (₹)</th>
                      <th className="p-1.5 border-r border-slate-200 w-16">सड़क KM</th>
                      <th className="p-1.5 border-r border-slate-200 w-20">सड़क भत्ता (₹)</th>
                      <th className="p-1.5 border-r border-slate-200 w-20">वास्तविक व्यय</th>
                      <th className="p-1.5 border-r border-slate-200 w-14">DA दिन</th>
                      <th className="p-1.5 border-r border-slate-200 w-16">DA दर (₹)</th>
                      <th className="p-1.5 border-r border-slate-200 w-20 text-emerald-900 bg-emerald-50">DA राशि (₹)</th>
                      <th className="p-1.5 border-r border-slate-200 w-24 text-slate-900 bg-slate-200/80 font-black">
                        कुल राशि (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bill.form2JourneyDetails.journeys.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-1 border-r border-slate-200 text-center font-bold text-slate-600">
                          {idx + 1}
                        </td>
                        {/* Departure */}
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.departureStation}
                            onChange={(e) => updateClaimJourneyRow(row.id, { departureStation: e.target.value })}
                            placeholder="Dep. Station"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="date"
                            value={row.departureDate}
                            onChange={(e) => updateClaimJourneyRow(row.id, { departureDate: e.target.value })}
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="time"
                            value={row.departureTime}
                            onChange={(e) => updateClaimJourneyRow(row.id, { departureTime: e.target.value })}
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        {/* Arrival */}
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.arrivalStation}
                            onChange={(e) => updateClaimJourneyRow(row.id, { arrivalStation: e.target.value })}
                            placeholder="Arrival Station"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="date"
                            value={row.arrivalDate}
                            onChange={(e) => updateClaimJourneyRow(row.id, { arrivalDate: e.target.value })}
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="time"
                            value={row.arrivalTime}
                            onChange={(e) => updateClaimJourneyRow(row.id, { arrivalTime: e.target.value })}
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        {/* Journey */}
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.purposeOfJourney}
                            onChange={(e) => updateClaimJourneyRow(row.id, { purposeOfJourney: e.target.value })}
                            placeholder="Purpose"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.modeOfTravel}
                            onChange={(e) => updateClaimJourneyRow(row.id, { modeOfTravel: e.target.value })}
                            placeholder="Govt. / Bus / Train"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.accommodationClass}
                            onChange={(e) => updateClaimJourneyRow(row.id, { accommodationClass: e.target.value })}
                            placeholder="Class"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        {/* Fare & Allowance */}
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.railSteamerFareClass}
                            onChange={(e) => updateClaimJourneyRow(row.id, { railSteamerFareClass: e.target.value })}
                            placeholder="e.g. 2nd / Sleeper"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            value={row.railSteamerFareAmount || ""}
                            onChange={(e) =>
                              updateClaimJourneyRow(row.id, { railSteamerFareAmount: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.roadMileageKm}
                            onChange={(e) => updateClaimJourneyRow(row.id, { roadMileageKm: e.target.value })}
                            placeholder="KM"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            value={row.roadMileageAmount || ""}
                            onChange={(e) =>
                              updateClaimJourneyRow(row.id, { roadMileageAmount: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            value={row.actualExpenses || ""}
                            onChange={(e) =>
                              updateClaimJourneyRow(row.id, { actualExpenses: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.5"
                            value={row.dailyAllowanceDays || ""}
                            onChange={(e) =>
                              updateClaimJourneyRow(row.id, { dailyAllowanceDays: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-center font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            value={row.dailyAllowanceRate || ""}
                            onChange={(e) =>
                              updateClaimJourneyRow(row.id, { dailyAllowanceRate: parseFloat(e.target.value) || 0 })
                            }
                            placeholder="0.00"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs text-right font-mono"
                          />
                        </td>
                        <td className="p-1 border-r border-slate-200 bg-emerald-50 text-right font-mono font-bold text-emerald-900">
                          ₹{row.dailyAllowanceAmount.toFixed(2)}
                        </td>
                        <td className="p-1 border-r border-slate-200 bg-slate-100 text-right font-mono font-black text-slate-900">
                          ₹{row.totalAmount.toFixed(2)}
                        </td>
                        <td className="p-1 border-r border-slate-200">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) => updateClaimJourneyRow(row.id, { remarks: e.target.value })}
                            placeholder="Remarks"
                            className="w-full px-1 py-0.5 border border-slate-200 rounded text-xs"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => deleteClaimJourneyRow(row.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="पंक्ति हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Total Summary Footer */}
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                    <tr>
                      <td colSpan={17} className="p-2 text-right text-slate-800 uppercase tracking-wider text-xs">
                        TOTAL CLAIM AMOUNT / कुल दावा राशि:
                      </td>
                      <td className="p-2 text-right text-sm font-black text-emerald-900 font-mono bg-emerald-100/80">
                        ₹{bill.form2JourneyDetails.totalClaimAmount.toFixed(2)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* C. Totals, Deductions & Net Payable */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                C. नीचे का राशि एवं भुगतान विवरण (Payment, Advance &amp; Net Payable)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Left: Calculation Box */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-600">1. Total Claim Amount / कुल दावा राशि:</span>
                    <strong className="text-sm font-mono text-slate-900">
                      ₹{bill.form2JourneyDetails.totalClaimAmount.toFixed(2)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">2. Amount in Words / शब्दों में:</span>
                    <div className="text-[11px] text-slate-800 font-bold mt-0.5">
                      EN: {bill.form2JourneyDetails.totalClaimAmountWordsEn || amountToWordsEnglish(bill.form2JourneyDetails.totalClaimAmount)}
                    </div>
                    <div className="text-[11px] text-slate-700 mt-0.5 font-medium">
                      HI: {bill.form2JourneyDetails.totalClaimAmountWordsHi || amountToWordsHindi(bill.form2JourneyDetails.totalClaimAmount)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        6. Passed for Payment / पारित राशि
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={bill.form2JourneyDetails.passedForPaymentAmount || ""}
                        onChange={(e) =>
                          updateForm2PaymentField("passedForPaymentAmount", parseFloat(e.target.value) || 0)
                        }
                        placeholder={String(bill.form2JourneyDetails.totalClaimAmount)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        8. Minus Advance Drawn / घटाएँ: अग्रिम
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={bill.form2JourneyDetails.minusAdvanceDrawn || ""}
                        onChange={(e) =>
                          updateForm2PaymentField("minusAdvanceDrawn", parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Net Payable Highlight */}
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-emerald-950 uppercase tracking-wider">
                        11. NET PAYABLE AMOUNT / शुद्ध देय राशि:
                      </span>
                      <span className="text-base font-black text-emerald-900 font-mono">
                        ₹{bill.form2JourneyDetails.netPayableAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold">
                      {bill.form2JourneyDetails.netPayableAmountWordsEn || amountToWordsEnglish(bill.form2JourneyDetails.netPayableAmount)}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      {bill.form2JourneyDetails.netPayableAmountWordsHi || amountToWordsHindi(bill.form2JourneyDetails.netPayableAmount)}
                    </div>
                  </div>
                </div>

                {/* Right: Advance References & Signatures */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        4. Treasury Voucher No.
                      </label>
                      <input
                        type="text"
                        value={bill.form2JourneyDetails.treasuryVoucherNumber}
                        onChange={(e) =>
                          setBill((prev) => ({
                            ...prev,
                            form2JourneyDetails: {
                              ...prev.form2JourneyDetails,
                              treasuryVoucherNumber: e.target.value,
                            },
                          }))
                        }
                        placeholder="वाउचर नम्बर"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        5. Treasury Voucher Date
                      </label>
                      <input
                        type="date"
                        value={bill.form2JourneyDetails.treasuryVoucherDate}
                        onChange={(e) =>
                          setBill((prev) => ({
                            ...prev,
                            form2JourneyDetails: {
                              ...prev.form2JourneyDetails,
                              treasuryVoucherDate: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        9. Advance Reference No.
                      </label>
                      <input
                        type="text"
                        value={bill.form2JourneyDetails.advanceRefNumber}
                        onChange={(e) =>
                          setBill((prev) => ({
                            ...prev,
                            form2JourneyDetails: {
                              ...prev.form2JourneyDetails,
                              advanceRefNumber: e.target.value,
                            },
                          }))
                        }
                        placeholder="अग्रिम संदर्भ संख्या"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        10. Advance Reference Date
                      </label>
                      <input
                        type="date"
                        value={bill.form2JourneyDetails.advanceRefDate}
                        onChange={(e) =>
                          setBill((prev) => ({
                            ...prev,
                            form2JourneyDetails: {
                              ...prev.form2JourneyDetails,
                              advanceRefDate: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    {/* DDO Details */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        14. Signature of DDO
                      </label>
                      <input
                        type="text"
                        value={bill.form2JourneyDetails.ddoNameTitle}
                        onChange={(e) =>
                          setBill((prev) => ({
                            ...prev,
                            form2JourneyDetails: {
                              ...prev.form2JourneyDetails,
                              ddoNameTitle: e.target.value,
                            },
                          }))
                        }
                        placeholder="e.g. DDO / Superintendent"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs mb-1"
                      />
                      <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>Upload DDO Sign</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(e, (dataUrl) =>
                              setBill((prev) => ({
                                ...prev,
                                form2JourneyDetails: { ...prev.form2JourneyDetails, ddoSignatureImg: dataUrl },
                              }))
                            )
                          }
                        />
                      </label>
                      {bill.form2JourneyDetails.ddoSignatureImg && (
                        <span className="text-[9px] text-emerald-600 font-bold block">✓ DDO Sign Attached</span>
                      )}
                    </div>

                    {/* Claimant Details */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        13. Signature of Claimant
                      </label>
                      <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1 mt-4">
                        <Upload className="w-3 h-3" />
                        <span>Upload Claimant Sign</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleImageUpload(e, (dataUrl) =>
                              setBill((prev) => ({
                                ...prev,
                                form2JourneyDetails: { ...prev.form2JourneyDetails, claimantSignatureImg: dataUrl },
                              }))
                            )
                          }
                        />
                      </label>
                      {bill.form2JourneyDetails.claimantSignatureImg && (
                        <span className="text-[9px] text-emerald-600 font-bold block">✓ Claimant Sign Attached</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions Text Area (Configurable by user/admin) */}
              <div className="pt-2">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Printed Instructions / Declarations (निर्देश सम्पादित करने योग्य)
                </label>
                <textarea
                  rows={3}
                  value={bill.form2JourneyDetails.printedInstructionsText}
                  onChange={(e) =>
                    setBill((prev) => ({
                      ...prev,
                      form2JourneyDetails: {
                        ...prev.form2JourneyDetails,
                        printedInstructionsText: e.target.value,
                      },
                    }))
                  }
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-sans text-slate-700"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== TAB 3: FORM 3 — TA BILL MAIN PAGE (RULE 77) ===================== */}
      {activeTab === "FORM3" && (
        <Card className="no-print border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  FORM 3 — TRAVELLING ALLOWANCE BILL / CLAIM: MAIN PAGE (Rule 77)
                </h2>
                <p className="text-xs text-slate-500">
                  लेखा कोड विवरण (Accounting Codes), प्रमाणन, बजट समायोजन, ट्रेजरी एवं AG कार्यालय उपयोग
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => handleTriggerPrint("FORM3")}
                className="text-xs font-bold gap-1 bg-blue-700 hover:bg-blue-800 text-white"
              >
                <Printer className="w-3 h-3" />
                <span>Print Form 3 (Rule 77)</span>
              </Button>
            </div>

            {/* A. Bill Details & Establishment */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                A. Bill Details / बिल विवरण
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">1. Bill Number / बिल नम्बर</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.billNumber}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, billNumber: e.target.value },
                      }))
                    }
                    placeholder="e.g. TA/2026/042"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">2. Bill Date / बिल दिनांक</label>
                  <input
                    type="date"
                    value={bill.form3MainPage.billDate}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, billDate: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-600 block mb-1">
                    3. Establishment of / कार्यालय या स्थापना का नाम
                  </label>
                  <input
                    type="text"
                    value={bill.form3MainPage.establishmentOf}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, establishmentOf: e.target.value },
                      }))
                    }
                    placeholder="e.g. Superintendent of Police, Dabwali"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">4. Voucher No. / वाउचर नम्बर</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.voucherNumber}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, voucherNumber: e.target.value },
                      }))
                    }
                    placeholder="वाउचर संख्या"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">5. Voucher Date / दिनांक</label>
                  <input
                    type="date"
                    value={bill.form3MainPage.voucherDate}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, voucherDate: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>

            {/* B. Accounting Codes Grid (Preserving Leading Zeros) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  B. Accounting Details / लेखा विवरण (Preserves Leading Zeros)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">11 Code Fields</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">1. Treasury Code</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.treasuryCode}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, treasuryCode: e.target.value },
                        },
                      }))
                    }
                    placeholder="00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">2. DDO Code</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.ddoCode}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, ddoCode: e.target.value },
                        },
                      }))
                    }
                    placeholder="000"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">3. Major Head</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.majorHead}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, majorHead: e.target.value },
                        },
                      }))
                    }
                    placeholder="2055"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">4. Sub Major Head</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.subMajorHead}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, subMajorHead: e.target.value },
                        },
                      }))
                    }
                    placeholder="00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">5. Minor Head</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.minorHead}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, minorHead: e.target.value },
                        },
                      }))
                    }
                    placeholder="109"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">6. Sub Head / Scheme</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.subHeadScheme}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, subHeadScheme: e.target.value },
                        },
                      }))
                    }
                    placeholder="01"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">7. Detailed Head</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.detailedHead}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, detailedHead: e.target.value },
                        },
                      }))
                    }
                    placeholder="03"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">8. Object Code</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.objectCode}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, objectCode: e.target.value },
                        },
                      }))
                    }
                    placeholder="04 (TA)"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">9. Demand / Grant No.</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.accounting.demandGrantNumber}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: { ...prev.form3MainPage.accounting, demandGrantNumber: e.target.value },
                        },
                      }))
                    }
                    placeholder="Grant No."
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">10. Plan / Non Plan</label>
                  <select
                    value={bill.form3MainPage.accounting.planNonPlan}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: {
                            ...prev.form3MainPage.accounting,
                            planNonPlan: e.target.value as any,
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Select --</option>
                    <option value="NP">Non Plan (NP)</option>
                    <option value="P">Plan (P)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">11. Voted / Charged</label>
                  <select
                    value={bill.form3MainPage.accounting.votedCharged}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          accounting: {
                            ...prev.form3MainPage.accounting,
                            votedCharged: e.target.value as any,
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  >
                    <option value="">-- Select --</option>
                    <option value="V">Voted (V)</option>
                    <option value="C">Charged (C)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">12. Major Head Stamp</label>
                  <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1 mt-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload Stamp Img</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageUpload(e, (dataUrl) =>
                          setBill((prev) => ({
                            ...prev,
                            form3MainPage: {
                              ...prev.form3MainPage,
                              accounting: { ...prev.form3MainPage.accounting, majorHeadStampImg: dataUrl },
                            },
                          }))
                        )
                      }
                    />
                  </label>
                  {bill.form3MainPage.accounting.majorHeadStampImg && (
                    <span className="text-[9px] text-emerald-600 font-bold block">✓ Stamp Attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* C. Certificates */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                C. Certificates / प्रमाणन (Checkboxes not selected by default)
              </h3>
              <div className="space-y-2 text-xs">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bill.form3MainPage.certContentsVerified}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, certContentsVerified: e.target.checked },
                      }))
                    }
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>
                    1. <strong>Verified the contents of this bill.</strong> / इस बिल के समस्त विवरण सत्यापित किए गए हैं।
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={bill.form3MainPage.certTaRulesCompliance}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, certTaRulesCompliance: e.target.checked },
                      }))
                    }
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>
                    2. Certified that the amount being drawn in this bill is in accordance with the provision in{" "}
                    <strong>Haryana Civil Services (Travelling Allowance) Rules, 2016</strong> as amended from time to time.
                  </span>
                </label>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Certifying Officer Name / Designation
                    </label>
                    <input
                      type="text"
                      value={bill.form3MainPage.certifyingOfficerNameTitle}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          form3MainPage: { ...prev.form3MainPage, certifyingOfficerNameTitle: e.target.value },
                        }))
                      }
                      placeholder="e.g. Inspector / SHO / Head of Office"
                      className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Officer Stamp / Signature
                    </label>
                    <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1 mt-1.5">
                      <Upload className="w-3 h-3" />
                      <span>Upload Certifying Officer Stamp/Sign</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form3MainPage: { ...prev.form3MainPage, certifyingOfficerSignatureImg: dataUrl },
                            }))
                          )
                        }
                      />
                    </label>
                    {bill.form3MainPage.certifyingOfficerSignatureImg && (
                      <span className="text-[9px] text-emerald-600 font-bold block">✓ Signature Attached</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* D. Appropriation (Budget) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                D. Appropriation / बजट विवरण (Auto Calculates Balance Available)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Financial Year (From - To)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={bill.form3MainPage.financialYearFrom}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          form3MainPage: { ...prev.form3MainPage, financialYearFrom: e.target.value },
                        }))
                      }
                      placeholder="2025"
                      className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                    <span>-</span>
                    <input
                      type="text"
                      value={bill.form3MainPage.financialYearTo}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          form3MainPage: { ...prev.form3MainPage, financialYearTo: e.target.value },
                        }))
                      }
                      placeholder="2026"
                      className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Appropriation for Year (स्वीकृत बजट ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bill.form3MainPage.appropriationAmount || ""}
                    onChange={(e) =>
                      updateForm3Appropriation("appropriationAmount", parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Expenditure Incl. This Bill (व्यय ₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bill.form3MainPage.expenditureIncludingBill || ""}
                    onChange={(e) =>
                      updateForm3Appropriation("expenditureIncludingBill", parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Balance Available / शेष बजट
                  </label>
                  <div className="w-full px-2.5 py-1.5 bg-slate-200 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900">
                    ₹{bill.form3MainPage.balanceAvailable.toFixed(2)}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Passed for Amount / पारित राशि (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bill.form3MainPage.passedForAmount || ""}
                    onChange={(e) =>
                      updateForm3Appropriation("passedForAmount", parseFloat(e.target.value) || 0)
                    }
                    placeholder={String(bill.form2JourneyDetails.totalClaimAmount)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-black text-emerald-900"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="font-semibold text-slate-600 block mb-1">
                    Passed Amount in Words / पारित राशि शब्दों में
                  </label>
                  <input
                    type="text"
                    value={bill.form3MainPage.passedAmountWordsEn || amountToWordsEnglish(bill.form3MainPage.passedForAmount)}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, passedAmountWordsEn: e.target.value },
                      }))
                    }
                    className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            {/* E. Treasury Office & F. AG Office (Office Use) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* E. Treasury Office */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  E. For Use in Treasury Office / ट्रेजरी कार्यालय हेतु
                </h3>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pay Amount / भुगतान राशि (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bill.form3MainPage.treasuryPayAmount || ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: {
                          ...prev.form3MainPage,
                          treasuryPayAmount: v,
                          treasuryPayAmountWordsEn: amountToWordsEnglish(v),
                          treasuryPayAmountWordsHi: amountToWordsHindi(v),
                        },
                      }));
                    }}
                    placeholder="0.00"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Pay Amount Words</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.treasuryPayAmountWordsEn}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, treasuryPayAmountWordsEn: e.target.value },
                      }))
                    }
                    placeholder="Rupees..."
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Treasury Clerk</label>
                    <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" /> Sign
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form3MainPage: { ...prev.form3MainPage, treasuryClerkSignatureImg: dUrl },
                            }))
                          )
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">AST</label>
                    <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" /> Sign
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form3MainPage: { ...prev.form3MainPage, treasuryAstSignatureImg: dUrl },
                            }))
                          )
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Treasury Officer</label>
                    <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                      <Upload className="w-2.5 h-2.5" /> Sign
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleImageUpload(e, (dUrl) =>
                            setBill((prev) => ({
                              ...prev,
                              form3MainPage: { ...prev.form3MainPage, treasuryOfficerSignatureImg: dUrl },
                            }))
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* F. AG Office */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  F. For Use in AG Office / महालेखाकार कार्यालय हेतु
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Admitted Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bill.form3MainPage.agAdmittedAmount || ""}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          form3MainPage: {
                            ...prev.form3MainPage,
                            agAdmittedAmount: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      placeholder="0.00"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Objected Amount (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={bill.form3MainPage.agObjectedAmount || ""}
                      onChange={(e) =>
                        setBill((prev) => ({
                          ...prev,
                          form3MainPage: {
                            ...prev.form3MainPage,
                            agObjectedAmount: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      placeholder="0.00"
                      className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-rose-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Reasons of Objections / आपत्ति के कारण</label>
                  <input
                    type="text"
                    value={bill.form3MainPage.agReasonsOfObjections}
                    onChange={(e) =>
                      setBill((prev) => ({
                        ...prev,
                        form3MainPage: { ...prev.form3MainPage, agReasonsOfObjections: e.target.value },
                      }))
                    }
                    placeholder="आपत्ति टिप्पणी"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block">Accounts Officer Signature</label>
                  <label className="cursor-pointer text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                    <Upload className="w-2.5 h-2.5" /> Upload Sign
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageUpload(e, (dUrl) =>
                          setBill((prev) => ({
                            ...prev,
                            form3MainPage: { ...prev.form3MainPage, agAccountsOfficerSignatureImg: dUrl },
                          }))
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ===================== TAB 4: MY TA HISTORY (User Isolated) ===================== */}
      {activeTab === "HISTORY" && (
        <Card className="no-print border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Auto-Sync Banner notification */}
            {autoSyncBanner && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{autoSyncBanner}</p>
                    <p className="text-[11px] text-emerald-700">
                      रोज़नामचा आम (GD) प्रविष्टियों से TA/DA टूर प्रोग्राम, यात्रा भत्ता विवरण तथा ट्रेजरी बिल स्वतः तैयार कर लिए गए हैं।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoSyncBanner(null)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded hover:bg-emerald-100"
                >
                  ✕ बंद करें
                </button>
              </div>
            )}

            {/* Officer Confidentiality / Isolation Info */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>गोपनीय एवं सुरक्षित:</strong> आप <strong>{currentUser?.name || userName}</strong> (PNO: {currentUser?.pno || "N/A"}) के रूप में लॉग-इन हैं। केवल आपके TA/DA दावे यहाँ प्रदर्शित हैं।
                </span>
              </div>
              <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-200">
                हर माह 01 तारीख ऑटो-सिंक सक्रिय
              </span>
            </div>

            {/* Header with Title and Action Buttons */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-amber-600" />
                  My TA DA Claims History (मेरी दावा प्रविष्टियाँ)
                </h2>
                <p className="text-xs text-slate-500">
                  माहवार स्वतः जनरेटेड एवं मैन्युअल रूप से तैयार किए गए TA/DA दावों की सूची व पूर्वावलोकन
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {/* Specific Month Sync Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 border border-slate-200 rounded-lg">
                  <select
                    value={selectedSyncMonthKey}
                    onChange={(e) => setSelectedSyncMonthKey(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- माह चुनें (Select Month) --</option>
                    {availableMonths.map((m) => (
                      <option key={`${m.month}-${m.year}`} value={`${m.month}-${m.year}`}>
                        {m.monthHindi} {m.year}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSyncingGd || !selectedSyncMonthKey}
                    onClick={() => {
                      const found = availableMonths.find(
                        (m) => `${m.month}-${m.year}` === selectedSyncMonthKey
                      );
                      if (found) {
                        void handleManualSync(found);
                      }
                    }}
                    className="text-xs font-bold gap-1 border-slate-300 text-slate-700 hover:bg-slate-100 h-7 px-2"
                  >
                    {isSyncingGd ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>सिंक करें</span>
                  </Button>
                </div>

                {/* 01 Date Auto-Generation Last Month Button */}
                <Button
                  type="button"
                  size="sm"
                  disabled={isSyncingGd}
                  onClick={() => handleManualSync()}
                  className="text-xs font-bold gap-1.5 bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
                  title="पिछले माह की सभी रोज़नामचा GD प्रविष्टियों से TA/DA दावा स्वतः निकालें"
                >
                  {isSyncingGd ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>⚡ 01 तारीख GD ऑटो-जनरेशन</span>
                </Button>

                {/* New Blank Claim Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNewBlankBill}
                  className="text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>नया दावा भरें</span>
                </Button>
              </div>
            </div>

            {savedBills.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <ReceiptText className="w-12 h-12 mx-auto text-slate-300" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-700 text-sm">कोई पूर्व TA/DA दावा नहीं मिला</p>
                  <p className="text-xs max-w-md mx-auto text-slate-500">
                    आप ऊपर दिए गए <strong>&apos;⚡ 01 तारीख GD ऑटो-जनरेशन&apos;</strong> बटन पर क्लिक करके रोज़नामचा आम से पिछले माह का TA/DA बिल स्वतः तैयार कर सकते हैं, अथवा नया दावा भर सकते हैं।
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleManualSync()}
                  disabled={isSyncingGd}
                  className="text-xs font-bold gap-1.5 bg-blue-700 hover:bg-blue-800 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>अभी GD से TA/DA बिल जनरेट करें</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ID / Reference</th>
                      <th className="p-3">Claim Month &amp; Year</th>
                      <th className="p-3">Journeys (यात्राएँ)</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Designation</th>
                      <th className="p-3 text-right">Net Payable</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Saved Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {savedBills.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-blue-700">{b.id}</div>
                          {b.autoGenerated || b.source === "ROZNAMCHA_GD_AUTO" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              01 तारीख GD ऑटो
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                              मैन्युअल प्रविष्टि
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">
                            {b.form1TourProgramme.month || b.form2JourneyDetails.claimMonth || "—"}{" "}
                            {b.form1TourProgramme.year || b.form2JourneyDetails.claimYear || ""}
                          </div>
                          {b.claimPeriod && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {b.claimPeriod}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-bold text-[11px] border border-blue-200">
                            {b.totalJourneysCount || b.form1TourProgramme.journeys?.length || 0} यात्राएँ
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800">
                            {b.form1TourProgramme.employeeName || b.form2JourneyDetails.employeeName || "—"}
                          </div>
                          {b.form1TourProgramme.beltEmployeeNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Belt: {b.form1TourProgramme.beltEmployeeNumber}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {b.form1TourProgramme.designation || b.form2JourneyDetails.designation || "—"}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">
                          ₹{b.form2JourneyDetails.netPayableAmount?.toFixed(2) || "0.00"}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              b.status === "SUBMITTED"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {b.updatedAt ? b.updatedAt.slice(0, 16).replace("T", " ") : "—"}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Preview Modal Button */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPreview(b)}
                              className="h-7 px-2 text-[11px] font-bold border-blue-200 text-blue-700 hover:bg-blue-50 gap-1"
                              title="फॉर्म 1, 2 व 3 का पूर्ण पूर्वावलोकन देखें"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Preview</span>
                            </Button>

                            {/* Direct Download / Print Button */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDirectDownloadOrPrint(b)}
                              className="h-7 px-2 text-[11px] font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1"
                              title="प्रपत्र प्रिंट / डाउनलोड करें"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Print</span>
                            </Button>

                            {/* Edit / Open in Form editor */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadBill(b)}
                              className="h-7 px-2 text-[11px] font-bold border-slate-300 text-slate-700 hover:bg-slate-100 gap-1"
                              title="प्रपत्र में खोलकर संशोधन करें"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>

                            {/* Delete Button */}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBill(b.id)}
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 border-slate-200"
                              title="दावा हटाएं (Delete this record)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ===================== PRINT VIEWS (Visible only on Print) ================ */}
      {/* ========================================================================= */}

      {/* ----------------- PRINT: FORM 1 — TOUR PROGRAMME (A4 Portrait) ----------------- */}
      {(printTarget === "ALL" || printTarget === "FORM1") && (
        <div className="print-sheet hidden print:block portrait-sheet font-serif text-black p-4 bg-white text-[11px] leading-tight">
          <div className="text-center font-bold pb-2 border-b border-black">
            <h2 className="text-sm uppercase tracking-wide">
              {bill.form1TourProgramme.department || "POLICE DEPARTMENT"}
            </h2>
            <h1 className="text-base font-black uppercase mt-0.5">
              TOUR PROGRAMME — {bill.form1TourProgramme.employeeName || "____________________"}{" "}
              {bill.form1TourProgramme.beltEmployeeNumber ? `(${bill.form1TourProgramme.beltEmployeeNumber})` : ""}
            </h1>
            <div className="flex justify-between items-center text-[10px] mt-1 font-normal">
              <span>District: <strong>{bill.form1TourProgramme.district || "_______________"}</strong></span>
              <span>Designation: <strong>{bill.form1TourProgramme.designation || "_______________"}</strong></span>
              <span>
                For the Month of:{" "}
                <strong>
                  {bill.form1TourProgramme.month || "_______________"} {bill.form1TourProgramme.year || "____"}
                </strong>
              </span>
            </div>
          </div>

          {/* Table: Exactly matches handwritten sheet photo */}
          <table className="w-full mt-3 border-collapse border border-black text-[10px] leading-snug">
            <thead>
              <tr className="border-b border-black bg-slate-50 text-center font-bold">
                <th className="border-r border-black p-1 w-6">Sr. No.</th>
                <th className="border-r border-black p-1 w-14">Departure DD No.</th>
                <th className="border-r border-black p-1 min-w-[120px]">Place of Posting &amp; Dep. Station</th>
                <th className="border-r border-black p-1 w-16">Departure Date</th>
                <th className="border-r border-black p-1 w-14">Departure Time</th>
                <th className="border-r border-black p-1 min-w-[120px]">Arrival Station</th>
                <th className="border-r border-black p-1 w-14">Arrival DD No.</th>
                <th className="border-r border-black p-1 w-16">Arrival Date</th>
                <th className="border-r border-black p-1 w-14">Arrival Time</th>
                <th className="border-r border-black p-1 w-10 text-center">Days</th>
                <th className="border-r border-black p-1 min-w-[110px]">Purpose of Journey</th>
                <th className="border-r border-black p-1 w-20">Mode of Vehicle</th>
                <th className="p-1 w-12 text-right">KM</th>
              </tr>
            </thead>
            <tbody>
              {bill.form1TourProgramme.journeys.map((row, idx) => (
                <tr key={row.id} className="border-b border-black">
                  <td className="border-r border-black p-1 text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-black p-1 font-mono">{row.departureDdNo || "—"}</td>
                  <td className="border-r border-black p-1">{row.postingAndDepStation || "—"}</td>
                  <td className="border-r border-black p-1 font-mono">{row.departureDate || "—"}</td>
                  <td className="border-r border-black p-1 font-mono">{row.departureTime || "—"}</td>
                  <td className="border-r border-black p-1">{row.arrivalStation || "—"}</td>
                  <td className="border-r border-black p-1 font-mono">{row.arrivalDdNo || "—"}</td>
                  <td className="border-r border-black p-1 font-mono">{row.arrivalDate || "—"}</td>
                  <td className="border-r border-black p-1 font-mono">{row.arrivalTime || "—"}</td>
                  <td className="border-r border-black p-1 text-center font-mono">{row.noOfDays || "—"}</td>
                  <td className="border-r border-black p-1">{row.purposeOfJourney || "—"}</td>
                  <td className="border-r border-black p-1">{row.modeOfVehicle || "—"}</td>
                  <td className="p-1 text-right font-mono font-bold">{row.distanceKm || "—"}</td>
                </tr>
              ))}
              {/* Extra blank rows if fewer than 6 entries */}
              {Array.from({ length: Math.max(0, 6 - bill.form1TourProgramme.journeys.length) }).map((_, i) => (
                <tr key={`blank_${i}`} className="border-b border-black h-7">
                  <td className="border-r border-black p-1 text-center text-slate-300">
                    {bill.form1TourProgramme.journeys.length + i + 1}
                  </td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom Signatures Block: Matches handwritten photo with stamps */}
          <div className="mt-12 grid grid-cols-3 gap-6 pt-4 items-end text-[10px]">
            {/* Approving Officer (GO) */}
            <div className="space-y-1">
              <div className="font-bold underline uppercase">{bill.form1TourProgramme.approvalRemarks || "Approved"}</div>
              <div className="italic text-slate-700">Go&apos;s Stamp</div>
              {bill.form1TourProgramme.approvingOfficerSignatureImg ? (
                <img
                  src={bill.form1TourProgramme.approvingOfficerSignatureImg}
                  alt="Approving Officer Stamp"
                  className="max-h-14 max-w-[140px] object-contain my-1"
                />
              ) : (
                <div className="h-10"></div>
              )}
              <div className="font-bold border-t border-black pt-1">
                {bill.form1TourProgramme.approvingOfficerNameTitle || "Deputy Superintendent of Police"}
              </div>
            </div>

            {/* Forwarding Officer (Line Officer) */}
            <div className="space-y-1 text-center">
              <div className="font-bold uppercase text-blue-900">
                {bill.form1TourProgramme.forwardingRemarks || "FORWARD PL"}
              </div>
              {bill.form1TourProgramme.forwardingOfficerSignatureImg ? (
                <img
                  src={bill.form1TourProgramme.forwardingOfficerSignatureImg}
                  alt="Forwarding Officer Stamp"
                  className="max-h-14 max-w-[140px] mx-auto object-contain my-1"
                />
              ) : (
                <div className="h-10"></div>
              )}
              <div className="font-bold border-t border-black pt-1">
                {bill.form1TourProgramme.forwardingOfficerNameTitle || "Line Officer, Police Line"}
              </div>
            </div>

            {/* Claimant Signature */}
            <div className="space-y-1 text-right">
              {bill.form1TourProgramme.claimantSignatureImg ? (
                <img
                  src={bill.form1TourProgramme.claimantSignatureImg}
                  alt="Claimant Signature"
                  className="max-h-14 max-w-[140px] ml-auto object-contain my-1"
                />
              ) : (
                <div className="h-10"></div>
              )}
              <div className="font-bold border-t border-black pt-1">
                {bill.form1TourProgramme.claimantName || bill.form1TourProgramme.employeeName || "Claimant"}
              </div>
              <div className="text-slate-700">Signature of Claimant</div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- PRINT: FORM 2 — JOURNEY DETAILS CLAIM (A4 Landscape) ----------------- */}
      {(printTarget === "ALL" || printTarget === "FORM2") && (
        <div className="print-sheet hidden print:block landscape-sheet font-serif text-black p-4 bg-white text-[10px] leading-tight page-break-before">
          <div className="text-center pb-2 border-b border-black">
            <h1 className="text-sm font-black uppercase tracking-wider">
              FORM OF TRAVELLING ALLOWANCE CLAIM
            </h1>
            <div className="grid grid-cols-4 gap-2 text-[9px] mt-1.5 text-left">
              <div>
                1. Claim for Month/Year:{" "}
                <strong>
                  {bill.form2JourneyDetails.claimMonth || "__________"} {bill.form2JourneyDetails.claimYear || "____"}
                </strong>
              </div>
              <div>
                2. Name: <strong>{bill.form2JourneyDetails.employeeName || "____________________"}</strong>
              </div>
              <div>
                3. Designation: <strong>{bill.form2JourneyDetails.designation || "____________________"}</strong>
              </div>
              <div>
                4. Basic Pay: <strong>{bill.form2JourneyDetails.basicPay ? `₹${bill.form2JourneyDetails.basicPay}` : "__________"}</strong>
              </div>
              <div>
                5. Headquarters: <strong>{bill.form2JourneyDetails.headquarters || "____________________"}</strong>
              </div>
              <div className="col-span-3">
                6. Grade of Government Servant:{" "}
                <strong>{bill.form2JourneyDetails.gradeOfGovtServant || "____________________"}</strong>
              </div>
            </div>
          </div>

          {/* 19 Columns Table (Matches Green Sheet Photo) */}
          <table className="w-full mt-2 border-collapse border border-black text-[9px] leading-snug">
            <thead>
              <tr className="border-b border-black bg-slate-100 text-center font-bold">
                <th rowSpan={2} className="border-r border-black p-0.5 w-6">1</th>
                <th colSpan={3} className="border-r border-black p-0.5">Departure</th>
                <th colSpan={3} className="border-r border-black p-0.5">Arrival</th>
                <th colSpan={3} className="border-r border-black p-0.5">Journey</th>
                <th colSpan={8} className="border-r border-black p-0.5">Fare &amp; Allowance</th>
                <th rowSpan={2} className="p-0.5">Remarks</th>
              </tr>
              <tr className="border-b border-black text-center font-semibold text-[8px]">
                <th className="border-r border-black p-0.5">Place &amp; Station</th>
                <th className="border-r border-black p-0.5">Date</th>
                <th className="border-r border-black p-0.5">Time</th>
                <th className="border-r border-black p-0.5">Place &amp; Station</th>
                <th className="border-r border-black p-0.5">Date</th>
                <th className="border-r border-black p-0.5">Time</th>
                <th className="border-r border-black p-0.5">Purpose</th>
                <th className="border-r border-black p-0.5">Mode</th>
                <th className="border-r border-black p-0.5">Class</th>
                <th className="border-r border-black p-0.5">Rail Class</th>
                <th className="border-r border-black p-0.5">Rail Fare (₹)</th>
                <th className="border-r border-black p-0.5">Road KM</th>
                <th className="border-r border-black p-0.5">Road (₹)</th>
                <th className="border-r border-black p-0.5">Actual (₹)</th>
                <th className="border-r border-black p-0.5">DA Days</th>
                <th className="border-r border-black p-0.5">DA Rate</th>
                <th className="border-r border-black p-0.5">DA (₹)</th>
                <th className="border-r border-black p-0.5 font-bold">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {bill.form2JourneyDetails.journeys.map((row, idx) => (
                <tr key={row.id} className="border-b border-black">
                  <td className="border-r border-black p-0.5 text-center font-bold">{idx + 1}</td>
                  <td className="border-r border-black p-0.5">{row.departureStation || "—"}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.departureDate || "—"}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.departureTime || "—"}</td>
                  <td className="border-r border-black p-0.5">{row.arrivalStation || "—"}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.arrivalDate || "—"}</td>
                  <td className="border-r border-black p-0.5 font-mono">{row.arrivalTime || "—"}</td>
                  <td className="border-r border-black p-0.5">{row.purposeOfJourney || "—"}</td>
                  <td className="border-r border-black p-0.5">{row.modeOfTravel || "—"}</td>
                  <td className="border-r border-black p-0.5">{row.accommodationClass || "—"}</td>
                  <td className="border-r border-black p-0.5">{row.railSteamerFareClass || "—"}</td>
                  <td className="border-r border-black p-0.5 text-right font-mono">
                    {row.railSteamerFareAmount ? row.railSteamerFareAmount.toFixed(2) : "—"}
                  </td>
                  <td className="border-r border-black p-0.5 text-right font-mono">{row.roadMileageKm || "—"}</td>
                  <td className="border-r border-black p-0.5 text-right font-mono">
                    {row.roadMileageAmount ? row.roadMileageAmount.toFixed(2) : "—"}
                  </td>
                  <td className="border-r border-black p-0.5 text-right font-mono">
                    {row.actualExpenses ? row.actualExpenses.toFixed(2) : "—"}
                  </td>
                  <td className="border-r border-black p-0.5 text-center font-mono">{row.dailyAllowanceDays || "—"}</td>
                  <td className="border-r border-black p-0.5 text-right font-mono">{row.dailyAllowanceRate || "—"}</td>
                  <td className="border-r border-black p-0.5 text-right font-mono">
                    {row.dailyAllowanceAmount ? row.dailyAllowanceAmount.toFixed(2) : "—"}
                  </td>
                  <td className="border-r border-black p-0.5 text-right font-mono font-bold">
                    {row.totalAmount ? row.totalAmount.toFixed(2) : "0.00"}
                  </td>
                  <td className="p-0.5">{row.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-black font-bold">
                <td colSpan={17} className="border-r border-black p-1 text-right uppercase">
                  TOTAL CLAIM AMOUNT ₹:
                </td>
                <td className="border-r border-black p-1 text-right font-mono font-black">
                  ₹{bill.form2JourneyDetails.totalClaimAmount.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          {/* Bottom Totals & Advance Block */}
          <div className="mt-3 grid grid-cols-2 gap-4 text-[9px] border-t border-black pt-2">
            <div>
              <div>Total Claim Amount in Words: <strong>{bill.form2JourneyDetails.totalClaimAmountWordsEn}</strong></div>
              <div>Amount of Advance if already taken: <strong>₹{bill.form2JourneyDetails.amountOfAdvanceTaken || "0.00"}</strong></div>
              <div>
                Treasury Voucher No. &amp; Date:{" "}
                <strong>{bill.form2JourneyDetails.treasuryVoucherNumber || "__________"}</strong> dtd{" "}
                <strong>{bill.form2JourneyDetails.treasuryVoucherDate || "__________"}</strong>
              </div>
              <div className="mt-2 font-bold">
                Net Payable: <strong>₹{bill.form2JourneyDetails.netPayableAmount.toFixed(2)}</strong> (
                {bill.form2JourneyDetails.netPayableAmountWordsEn})
              </div>
            </div>

            <div className="space-y-4 text-right">
              <div>
                Passed for Amount ₹: <strong>₹{bill.form2JourneyDetails.passedForPaymentAmount || bill.form2JourneyDetails.totalClaimAmount}</strong>
              </div>
              <div>
                Minus Advance already taken ₹: <strong>₹{bill.form2JourneyDetails.minusAdvanceDrawn || "0.00"}</strong>
              </div>
              <div className="flex justify-between items-end pt-4">
                <div className="text-left">
                  {bill.form2JourneyDetails.claimantSignatureImg ? (
                    <img src={bill.form2JourneyDetails.claimantSignatureImg} alt="Claimant" className="max-h-10" />
                  ) : (
                    <div className="h-8"></div>
                  )}
                  <div className="border-t border-black pt-0.5 font-bold">Signature of Claimant</div>
                </div>

                <div className="text-right">
                  {bill.form2JourneyDetails.ddoSignatureImg ? (
                    <img src={bill.form2JourneyDetails.ddoSignatureImg} alt="DDO" className="max-h-10 ml-auto" />
                  ) : (
                    <div className="h-8"></div>
                  )}
                  <div className="border-t border-black pt-0.5 font-bold">
                    Signature of D.D.O. {bill.form2JourneyDetails.ddoNameTitle ? `(${bill.form2JourneyDetails.ddoNameTitle})` : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Footer */}
          {bill.form2JourneyDetails.printedInstructionsText && (
            <div className="mt-3 pt-1 border-t border-dotted border-black text-[8px] text-slate-700 whitespace-pre-line">
              <strong>INSTRUCTIONS:</strong> {bill.form2JourneyDetails.printedInstructionsText}
            </div>
          )}
        </div>
      )}

      {/* ----------------- PRINT: FORM 3 — TA BILL MAIN PAGE (Rule 77) (A4 Portrait) ----------------- */}
      {(printTarget === "ALL" || printTarget === "FORM3") && (
        <div className="print-sheet hidden print:block portrait-sheet font-serif text-black p-4 bg-white text-[10px] leading-tight page-break-before">
          <div className="text-center font-bold pb-2 border-b border-black">
            <span className="text-[9px] uppercase tracking-widest block text-slate-600">T.A. BILL</span>
            <h1 className="text-sm font-black uppercase tracking-wider mt-0.5">
              FORM OF TRAVELLING ALLOWANCE BILL / CLAIM
            </h1>
            <span className="text-[9px] italic block font-normal">(See Rule 77)</span>
          </div>

          <div className="mt-2 flex justify-between text-[10px]">
            <div>
              Bill No. &amp; Date: <strong>{bill.form3MainPage.billNumber || "__________"}</strong> dtd{" "}
              <strong>{bill.form3MainPage.billDate || "__________"}</strong>
              <div className="mt-0.5">
                Establishment of: <strong>{bill.form3MainPage.establishmentOf || "____________________"}</strong>
              </div>
            </div>
            <div className="text-right">
              Voucher No.: <strong>{bill.form3MainPage.voucherNumber || "__________"}</strong>
              <div className="mt-0.5">
                Voucher Date: <strong>{bill.form3MainPage.voucherDate || "__________"}</strong>
              </div>
            </div>
          </div>

          {/* Accounting Codes Grid (Matches Yellow Sheet Photo) */}
          <div className="mt-3 border border-black p-2 bg-slate-50">
            <span className="font-bold text-[9px] uppercase tracking-wider block mb-1">
              ACCOUNTING CODES (लेखा कोड)
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px]">
              <div>1. Treasury Code: <strong>{bill.form3MainPage.accounting.treasuryCode || "____"}</strong></div>
              <div>8. Object Code: <strong>{bill.form3MainPage.accounting.objectCode || "____"}</strong></div>
              <div>2. D.D.O. Code: <strong>{bill.form3MainPage.accounting.ddoCode || "____"}</strong></div>
              <div>9. Demand / Grant No.: <strong>{bill.form3MainPage.accounting.demandGrantNumber || "____"}</strong></div>
              <div>3. Major Head: <strong>{bill.form3MainPage.accounting.majorHead || "____"}</strong></div>
              <div>10. Plan / Non Plan: <strong>{bill.form3MainPage.accounting.planNonPlan || "____"}</strong></div>
              <div>4. Sub Major Head: <strong>{bill.form3MainPage.accounting.subMajorHead || "____"}</strong></div>
              <div>11. Voted / Charged: <strong>{bill.form3MainPage.accounting.votedCharged || "____"}</strong></div>
              <div>5. Minor Head: <strong>{bill.form3MainPage.accounting.minorHead || "____"}</strong></div>
              <div>6. Sub Head / Scheme: <strong>{bill.form3MainPage.accounting.subHeadScheme || "____"}</strong></div>
              <div>7. Detailed Head: <strong>{bill.form3MainPage.accounting.detailedHead || "____"}</strong></div>
            </div>
          </div>

          {/* Certificates */}
          <div className="mt-3 border-t border-black pt-2 space-y-1 text-[9px]">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-center">CERTIFICATES</h3>
            <p>
              1. {bill.form3MainPage.certContentsVerified ? "☑" : "☐"} Verified the contents of this bill.
            </p>
            <p>
              2. {bill.form3MainPage.certTaRulesCompliance ? "☑" : "☐"} Certified that the amount being drawn in this bill is in accordance with the provision in Haryana Civil Services (Travelling Allowance) Rules, 2016 as amended from time to time.
            </p>
            {bill.form3MainPage.certifyingOfficerSignatureImg && (
              <div className="text-right pt-2">
                <img
                  src={bill.form3MainPage.certifyingOfficerSignatureImg}
                  alt="Certifying Officer Sign"
                  className="max-h-10 ml-auto"
                />
                <span className="font-bold text-[8px] block">
                  {bill.form3MainPage.certifyingOfficerNameTitle || "Certifying Officer"}
                </span>
              </div>
            )}
          </div>

          {/* Appropriation Table */}
          <div className="mt-3 border-t border-black pt-2 space-y-1.5 text-[9px]">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-center">APPROPRIATION</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                Appropriation for year {bill.form3MainPage.financialYearFrom || "____"}-
                {bill.form3MainPage.financialYearTo || "____"}:
              </div>
              <div className="text-right font-mono font-bold">
                ₹{bill.form3MainPage.appropriationAmount?.toFixed(2) || "0.00"}
              </div>

              <div>Deduct Expenditure (including this bill):</div>
              <div className="text-right font-mono">
                ₹{bill.form3MainPage.expenditureIncludingBill?.toFixed(2) || "0.00"}
              </div>

              <div className="font-bold">Balance Available:</div>
              <div className="text-right font-mono font-bold">
                ₹{bill.form3MainPage.balanceAvailable?.toFixed(2) || "0.00"}
              </div>

              <div className="font-bold border-t border-black pt-1">Passed for:</div>
              <div className="text-right font-mono font-bold border-t border-black pt-1">
                ₹{bill.form3MainPage.passedForAmount || bill.form2JourneyDetails.totalClaimAmount}
              </div>
            </div>
            <div className="pt-1">
              (in words):{" "}
              <strong>
                {bill.form3MainPage.passedAmountWordsEn || amountToWordsEnglish(bill.form3MainPage.passedForAmount || bill.form2JourneyDetails.totalClaimAmount)}
              </strong>
            </div>

            <div className="flex justify-between items-end pt-6">
              <div className="text-left">
                {bill.form3MainPage.controllingOfficerSignatureImg && (
                  <img src={bill.form3MainPage.controllingOfficerSignatureImg} alt="Controlling Officer" className="max-h-10" />
                )}
                <div className="border-t border-black pt-0.5 font-bold">Signature of Controlling Officer</div>
              </div>

              <div className="text-right">
                {bill.form3MainPage.ddoSignatureImg && (
                  <img src={bill.form3MainPage.ddoSignatureImg} alt="DDO" className="max-h-10 ml-auto" />
                )}
                <div className="border-t border-black pt-0.5 font-bold">Signature of D.D.O.</div>
              </div>
            </div>
          </div>

          {/* Treasury & AG Office (Bottom Sections) */}
          <div className="mt-4 border-t border-black pt-2 grid grid-cols-2 gap-4 text-[9px]">
            {/* For use in Treasury Office */}
            <div className="border-r border-black pr-2 space-y-1">
              <span className="font-bold block text-center uppercase tracking-wider text-[9px]">
                (For use in Treasury Office)
              </span>
              <div>
                Pay ₹ <strong>{bill.form3MainPage.treasuryPayAmount ? `₹${bill.form3MainPage.treasuryPayAmount}` : "__________"}</strong>
              </div>
              <div>(Rupees: {bill.form3MainPage.treasuryPayAmountWordsEn || "____________________"})</div>
              <div className="pt-8 flex justify-between text-[8px]">
                <span>(Treasury Clerk)</span>
                <span>(AST)</span>
                <span>(Treasury Officer)</span>
              </div>
            </div>

            {/* For use in A.G. Office */}
            <div className="space-y-1 pl-2">
              <span className="font-bold block text-center uppercase tracking-wider text-[9px]">
                (For use in A.G. Office)
              </span>
              <div>
                Admitted for ₹: <strong>{bill.form3MainPage.agAdmittedAmount ? `₹${bill.form3MainPage.agAdmittedAmount}` : "__________"}</strong>
              </div>
              <div>
                Objected for ₹: <strong>{bill.form3MainPage.agObjectedAmount ? `₹${bill.form3MainPage.agObjectedAmount}` : "__________"}</strong>
              </div>
              <div>Reasons of objections: {bill.form3MainPage.agReasonsOfObjections || "____________________"}</div>
              <div className="pt-8 text-right text-[8px] font-bold">
                (Accounts Officer / J.)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== FULL FIDELITY PREVIEW & DOWNLOAD MODAL ===================== */}
      <TADAPreviewModal
        bill={previewModalBill}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onEdit={(loaded) => {
          handleLoadBill(loaded);
          setIsPreviewOpen(false);
        }}
      />
    </div>
  );
}
