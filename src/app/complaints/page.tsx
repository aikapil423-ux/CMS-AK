"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Phone,
  MapPin,
  User,
  Shield,
  UserCheck,
  Eye,
  Check,
  CheckCircle,
  X,
  FileText,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Paperclip,
  Video,
  Music,
  Image as ImageIcon,
  Bell,
  Send,
  Printer,
  AlertCircle,
  Edit3,
  Scale,
  SlidersHorizontal,
  Columns3,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem, OfficerNotification, getMainComplaintStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState, LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ComplaintReceiptModal } from "@/components/complaints/ComplaintReceiptModal";

type ComplaintSortField =
  | "complaintNumber"
  | "createdAt"
  | "complainantName"
  | "categoryDisplay"
  | "status"
  | "assignedEoName"
  | "daysPending";

const STATUS_OPTIONS = [
  { key: "NOT_ASSIGNED", label: "Not Assigned" },
  { key: "PENDING", label: "Pending" },
  { key: "COMPLETE", label: "Complete" },
  { key: "FIR_REGISTER", label: "FIR Register" },
  { key: "FIR_REGISTERED", label: "FIR Registered" },
  { key: "CORRECTION_REQUIRED", label: "Correction Required" },
];

const ALL_STATUS_KEYS = [
  "NOT_ASSIGNED",
  "PENDING",
  "COMPLETE",
  "FIR_REGISTER",
  "FIR_REGISTERED",
  "CORRECTION_REQUIRED",
];

const DIRECTION_TEMPLATES = [
  {
    key: "SPOT_VERIFY",
    label: "Preliminary Spot Verification (BNSS 173(3))",
    text: "Conduct preliminary spot verification & inspect the scene within 48 hours. Record statements of immediate witnesses and local residents.",
    recommendedDays: 7,
  },
  {
    key: "SECTION_35_NOTICE",
    label: "Notice to Accused (Section 35(3) BNSS)",
    text: "Issue formal appearance notice under Section 35(3) BNSS to named suspect(s). Verify defense version and record formal explanation.",
    recommendedDays: 7,
  },
  {
    key: "DIGITAL_CCTV",
    label: "Collect CCTV & Digital Evidence",
    text: "Secure and preserve CCTV camera recordings from the spot, obtain bank transaction statements / UPI references, and preserve mobile communication records.",
    recommendedDays: 5,
  },
  {
    key: "MEDIATION",
    label: "Mediation & Mutual Settlement",
    text: "Convene joint meeting with both parties at Station Helpdesk. Facilitate peaceful mutual settlement or lawful compromise without coercion.",
    recommendedDays: 10,
  },
  {
    key: "MEDICAL_MLR",
    label: "Hospital MLR & Medical Verification",
    text: "Liaise with Government Civil Hospital to obtain formal Medico-Legal Report (MLR). Verify injury severity (simple vs grievous) with medical officer.",
    recommendedDays: 3,
  },
  {
    key: "REVENUE_LAND",
    label: "Revenue Patwari Land Demarcation",
    text: "Coordinate with Halqa Patwari / Tehsildar to inspect Khasra/Khatoni revenue demarcation and determine lawful possession of disputed land.",
    recommendedDays: 14,
  },
  {
    key: "CUSTOM",
    label: "Custom Supervisory Direction...",
    text: "",
    recommendedDays: 14,
  },
];

function ComplaintListContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const initialPriority = searchParams.get("priority") || "ALL";
  const unassignedComplaintNo = searchParams.get("unassigned");

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Status Filter with Dropdown and Checkboxes
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_STATUS_KEYS);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    notAssigned: 0,
    pending: 0,
    complete: 0,
    firRegister: 0,
    firRegistered: 0,
    correctionRequired: 0,
    unassigned: 0,
    underEnquiry: 0,
    underReview: 0,
    disposed: 0,
  });

  const isAllSelected = selectedStatuses.length === ALL_STATUS_KEYS.length;

  const isMhc = currentUser.role === "MHC_GD_INCHARGE";
  const isSho = currentUser.role === "SHO" || currentUser.role === "DSP_SUBDIV" || currentUser.id === "usr_sho_1";
  const isEo = currentUser.role === "ENQUIRY_OFFICER" || (!isSho && !isMhc && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "SP_DISTRICT");
  const eoFilterParam = isEo ? (currentUser.pno || currentUser.name) : undefined;

  // Column Selection Checkboxes state
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    complaintId: true,
    dateTime: true,
    complainant: true,
    categoryLocation: true,
    status: true,
    assignedEo: true,
    daysPending: true,
    action: true,
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetColumns = () => {
    setVisibleColumns({
      complaintId: true,
      dateTime: true,
      complainant: true,
      categoryLocation: true,
      status: true,
      assignedEo: true,
      daysPending: true,
      action: true,
    });
  };

  // Master Filter Tabs: ALL | DIRECT_FIR | NOT_ASSIGNED | PENDING | COMPLETE | FIR_REGISTERED | CORRECTION
  const [masterFilterTab, setMasterFilterTab] = useState<string>("ALL");

  const handleMasterTabChange = (tab: string) => {
    setMasterFilterTab(tab);
    if (tab === "ALL") {
      setSelectedStatuses([...ALL_STATUS_KEYS]);
    } else if (tab === "DIRECT_FIR") {
      setSelectedStatuses(["FIR_REGISTER"]);
    } else if (tab === "NOT_ASSIGNED") {
      setSelectedStatuses(["NOT_ASSIGNED"]);
    } else if (tab === "PENDING") {
      setSelectedStatuses(["PENDING"]);
    } else if (tab === "COMPLETE") {
      setSelectedStatuses(["COMPLETE"]);
    } else if (tab === "FIR_REGISTERED") {
      setSelectedStatuses(["FIR_REGISTERED"]);
    } else if (tab === "CORRECTION") {
      setSelectedStatuses(["CORRECTION_REQUIRED"]);
    }
  };

  const [priorityFilter, setPriorityFilter] = useState(initialPriority);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [sortField, setSortField] = useState<ComplaintSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected complaint for drawer/modal inspection
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  // Workflow Modals: SHO & EO Decision
  const [shoApproveModalComplaint, setShoApproveModalComplaint] = useState<ComplaintItem | null>(null);
  const [shoApproveRemarks, setShoApproveRemarks] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const [shoReEnquiryModalComplaint, setShoReEnquiryModalComplaint] = useState<ComplaintItem | null>(null);
  const [reEnquiryReason, setReEnquiryReason] = useState("");
  const [isSubmittingReEnquiry, setIsSubmittingReEnquiry] = useState(false);

  const [shoRejectModalComplaint, setShoRejectModalComplaint] = useState<ComplaintItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const [firRegisterModalComplaint, setFirRegisterModalComplaint] = useState<ComplaintItem | null>(null);
  const [firNumberInput, setFirNumberInput] = useState("");
  const [firSectionsInput, setFirSectionsInput] = useState("");
  const [firDateInput, setFirDateInput] = useState("");
  const [isRegisteringFir, setIsRegisteringFir] = useState(false);

  const [eoSendToShoModalComplaint, setEoSendToShoModalComplaint] = useState<ComplaintItem | null>(null);
  const [eoSendRemarks, setEoSendRemarks] = useState("");
  const [isSendingToSho, setIsSendingToSho] = useState(false);

  // Assignment Modal & Directions
  const [assigningComplaint, setAssigningComplaint] = useState<ComplaintItem | null>(null);
  const [selectedEoId, setSelectedEoId] = useState("");
  const [directionTemplate, setDirectionTemplate] = useState("SPOT_VERIFY");
  const [assignedDirections, setAssignedDirections] = useState(
    DIRECTION_TEMPLATES[0].text
  );
  const [targetDays, setTargetDays] = useState(14);
  const [lastAssignedNotification, setLastAssignedNotification] = useState<OfficerNotification | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Official Receipt of Registered Complaints modal state
  const [receiptComplaint, setReceiptComplaint] = useState<ComplaintItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Quick Assign EO dropdown state (directly opens dropdown on click, no dialogue box)
  const [assignDropdownComplaintId, setAssignDropdownComplaintId] = useState<string | null>(null);
  const [assignToast, setAssignToast] = useState<string | null>(null);
  const [isQuickAssigning, setIsQuickAssigning] = useState<boolean>(false);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-assign-dropdown]")) {
        setAssignDropdownComplaintId(null);
      }
    };
    if (assignDropdownComplaintId) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [assignDropdownComplaintId]);

  const handleQuickAssignEO = async (complaintId: string, eo: (typeof MOCK_ENQUIRY_OFFICERS)[0]) => {
    try {
      setIsQuickAssigning(true);
      const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
      await ComplaintService.assignEnquiryOfficer(
        complaintId,
        eo.id,
        eo.name,
        eo.rank,
        eo.pno,
        currentUser.name
      );
      setAssignDropdownComplaintId(null);
      await fetchComplaints();
      setAssignToast(`Enquiry Officer assigned: ${label}`);
      setTimeout(() => setAssignToast(null), 3500);
    } catch (err) {
      console.error("Failed to assign EO:", err);
      setAssignToast("Failed to assign Enquiry Officer.");
      setTimeout(() => setAssignToast(null), 3000);
    } finally {
      setIsQuickAssigning(false);
    }
  };

  const selectedEo = useMemo(() => {
    return MOCK_ENQUIRY_OFFICERS.find((e) => e.id === selectedEoId) || null;
  }, [selectedEoId]);

  const handleOpenAssignModal = (complaint: ComplaintItem) => {
    setAssigningComplaint(complaint);
    setAssignSuccess(false);
    setLastAssignedNotification(null);

    let defaultTemplate = "SPOT_VERIFY";
    if (complaint.category === "LAND_PROPERTY_DISPUTE") {
      defaultTemplate = "REVENUE_LAND";
    } else if (complaint.category === "DOMESTIC_VIOLENCE_DOWRY") {
      defaultTemplate = "MEDIATION";
    } else if (complaint.category === "PHYSICAL_ASSAULT_AFFRAY") {
      defaultTemplate = "MEDICAL_MLR";
    } else if (complaint.category === "CYBER_CRIME" || complaint.category === "FINANCIAL_FRAUD_CHEATING") {
      defaultTemplate = "DIGITAL_CCTV";
    }

    const tmpl = DIRECTION_TEMPLATES.find((t) => t.key === defaultTemplate);
    setSelectedEoId(complaint.assignedEoId || "");
    setDirectionTemplate(defaultTemplate);
    setAssignedDirections(tmpl?.text || "");
    setTargetDays(tmpl?.recommendedDays || 14);
  };

  const handleSelectEo = (eoId: string) => {
    setSelectedEoId(eoId);
  };

  const handleTemplateChange = (key: string) => {
    setDirectionTemplate(key);
    const tmpl = DIRECTION_TEMPLATES.find((t) => t.key === key);
    if (tmpl) {
      if (key !== "CUSTOM") {
        setAssignedDirections(tmpl.text);
      }
      setTargetDays(tmpl.recommendedDays);
    }
  };

  const handleAssignEO = async () => {
    if (!assigningComplaint || !selectedEoId) return;
    const eo = MOCK_ENQUIRY_OFFICERS.find((e) => e.id === selectedEoId);
    if (!eo) return;
    setIsAssigning(true);

    try {
      const result = await ComplaintService.assignEnquiryOfficer(
        assigningComplaint.id,
        eo.id,
        eo.name,
        eo.rank,
        eo.pno,
        currentUser.name,
        assignedDirections,
        targetDays
      );

      setLastAssignedNotification(result.notification);
      setAssignSuccess(true);
      fetchComplaints();

      // Immediately open Receipt of Registered Complaints modal!
      setReceiptComplaint(result.complaint);
      setShowReceiptModal(true);

      setTimeout(() => {
        setAssignSuccess(false);
        setAssigningComplaint(null);
        setLastAssignedNotification(null);
      }, 500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleShoApprove = async () => {
    if (!shoApproveModalComplaint) return;
    setIsApproving(true);
    try {
      await ComplaintService.shoApprove(
        shoApproveModalComplaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        shoApproveRemarks
      );
      setShoApproveModalComplaint(null);
      setShoApproveRemarks("");
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert("Error approving report");
    } finally {
      setIsApproving(false);
    }
  };

  const handleShoReEnquiry = async () => {
    if (!shoReEnquiryModalComplaint || !reEnquiryReason.trim()) {
      alert("Please provide the reason / instructions for re-enquiry.");
      return;
    }
    setIsSubmittingReEnquiry(true);
    try {
      await ComplaintService.shoReEnquiry(
        shoReEnquiryModalComplaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        reEnquiryReason
      );
      setShoReEnquiryModalComplaint(null);
      setReEnquiryReason("");
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert("Error ordering re-enquiry");
    } finally {
      setIsSubmittingReEnquiry(false);
    }
  };

  const handleShoReject = async () => {
    if (!shoRejectModalComplaint || !rejectionReason.trim()) {
      alert("Please provide the rejection reason / instructions for correction.");
      return;
    }
    setIsSubmittingReject(true);
    try {
      await ComplaintService.shoReject(
        shoRejectModalComplaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        rejectionReason.trim()
      );
      setShoRejectModalComplaint(null);
      setRejectionReason("");
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert("Error rejecting report");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleOpenFirRegisterModal = (c: ComplaintItem) => {
    const defaultFirNo = `HAR-KKR-2026-FIR-${String(Math.floor(100 + Math.random() * 900))}`;
    setFirNumberInput(defaultFirNo);
    setFirSectionsInput(c.firSections || "Section 115(2), 351(2), 3(5) BNS, 2023");
    setFirDateInput(new Date().toISOString().split("T")[0]);
    setFirRegisterModalComplaint(c);
  };

  const handleRegisterFirSubmit = async () => {
    if (!firRegisterModalComplaint || !firNumberInput.trim()) {
      alert("Please enter a valid FIR Number.");
      return;
    }
    setIsRegisteringFir(true);
    try {
      await ComplaintService.registerFir(
        firRegisterModalComplaint.id,
        firNumberInput.trim(),
        firSectionsInput.trim(),
        currentUser.name,
        currentUser.role,
        firDateInput
      );
      setFirRegisterModalComplaint(null);
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert("Error registering FIR");
    } finally {
      setIsRegisteringFir(false);
    }
  };

  const handleEoSendToShoSubmit = async () => {
    if (!eoSendToShoModalComplaint) return;
    setIsSendingToSho(true);
    try {
      await ComplaintService.sendReportToSho(
        eoSendToShoModalComplaint.id,
        currentUser.name,
        currentUser.pno || "04291882",
        eoSendRemarks
      );
      setEoSendToShoModalComplaint(null);
      setEoSendRemarks("");
      fetchComplaints();
    } catch (e) {
      console.error(e);
      alert("Error sending report to SHO");
    } finally {
      setIsSendingToSho(false);
    }
  };

  // Close status dropdown and column dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setColumnDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses([...ALL_STATUS_KEYS]);
    }
  };

  const handleToggleStatus = (key: string) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  const getStatusButtonLabel = () => {
    if (isAllSelected) {
      return "All Complaints";
    }
    if (selectedStatuses.length === 0) {
      return "No Status Selected";
    }
    if (selectedStatuses.length === 1) {
      const opt = STATUS_OPTIONS.find((o) => o.key === selectedStatuses[0]);
      return opt ? opt.label : "1 Selected";
    }
    if (selectedStatuses.length === 2) {
      const labels = selectedStatuses
        .map((k) => STATUS_OPTIONS.find((o) => o.key === k)?.label)
        .filter(Boolean);
      return labels.join(", ");
    }
    return `${selectedStatuses.length} Statuses Selected`;
  };

  const fetchComplaints = async () => {
    setLoading(true);
    const [data, counts] = await Promise.all([
      ComplaintService.getComplaints({
        search: searchQuery,
        statuses: selectedStatuses.length === 0 ? ["NONE_MATCHING"] : (isAllSelected ? undefined : selectedStatuses),
        priority: priorityFilter,
        category: categoryFilter,
        assignedEo: eoFilterParam,
        viewerRole: currentUser.role,
      }),
      ComplaintService.getStatusCounts(eoFilterParam),
    ]);
    setComplaints(data);
    setStatusCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
    const handleUpdate = () => {
      fetchComplaints();
    };
    window.addEventListener("complaints_updated", handleUpdate);
    return () => {
      window.removeEventListener("complaints_updated", handleUpdate);
    };
  }, [searchQuery, selectedStatuses, priorityFilter, categoryFilter, currentUser]);

  // Check if deep linked via query param
  useEffect(() => {
    const urlId = searchParams.get("id");
    if (urlId) {
      ComplaintService.getComplaintById(urlId).then((found) => {
        if (found) setSelectedComplaint(found);
      });
    }
  }, [searchParams]);


  const handleSort = (field: ComplaintSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedComplaints = useMemo(() => {
    return [...complaints].sort((a, b) => {
      if (sortField === "daysPending") {
        return sortOrder === "asc" ? a.daysPending - b.daysPending : b.daysPending - a.daysPending;
      }
      if (sortField === "createdAt") {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      }
      const aVal = (a[sortField] || "").toString().toLowerCase();
      const bVal = (b[sortField] || "").toString().toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [complaints, sortField, sortOrder]);

  const renderSortIcon = (field: ComplaintSortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 group-hover:text-slate-600 transition-opacity" />
      );
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 font-bold shrink-0" />
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              BNSS Section 173(3) • Police Register
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Complaints Management Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Station intake, preliminary verification, and enquiry monitoring
          </p>
        </div>
      </div>

      {/* Officer Persona & Assignment Scope Notice Banner */}
      {isEo ? (
        <div className="p-3.5 bg-blue-50/90 border border-blue-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>Personal Enquiry Docket: {currentUser.name}</span>
                <span className="text-[10px] font-semibold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full border border-blue-300">
                  Enquiry Officer View
                </span>
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Showing exclusively complaints assigned to you (PNO: <strong className="font-mono">{currentUser.pno}</strong>). Other complaints are restricted to their respective officers or station supervision.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs font-bold bg-white text-blue-800 border border-blue-200 px-3 py-1 rounded-lg">
              {complaints.length} Assigned {complaints.length === 1 ? "Case" : "Cases"}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Station Supervisory Registry ({currentUser.name}, {currentUser.roleDisplay}):</strong> Displaying all station complaints across all enquiry officers and assignment queues.
            </span>
          </div>
          <span className="font-mono text-xs font-bold bg-white text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md">
            {complaints.length} Total Complaints
          </span>
        </div>
      )}

      {/* Quick Assign Success Toast */}
      {assignToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold shadow-xs animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{assignToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAssignToast(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Unassigned Complaint Alert Banner (Directly routed to SHO) */}
      {unassignedComplaintNo && (
        <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-950 animate-in fade-in-50 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-950">
                Complaint #{unassignedComplaintNo} Registered — Awaiting EO Assignment
              </p>
              <p className="text-amber-800 leading-relaxed">
                यह शिकायत केंद्रीय रजिस्टर में दर्ज होकर सीधे SHO ID में प्राप्त हुई है। कृपया नीचे दिए गए <strong>&ldquo;Assign EO&rdquo;</strong> विकल्प पर क्लिक करके जांच अधिकारी (EO) नियुक्त करें। नियुक्त होते ही <strong>Receipt of registered complaints</strong> रसीद तुरंत जनरेट हो जाएगी।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Master Filter Bar (Requirement 10) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100/90 border border-slate-200 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => handleMasterTabChange("ALL")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "ALL"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-700 hover:text-slate-900 hover:bg-white/80"
          }`}
        >
          <span>All Enquiries</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
            {statusCounts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterTabChange("DIRECT_FIR")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "DIRECT_FIR"
              ? "bg-purple-700 text-white shadow-xs"
              : "text-purple-900 hover:bg-purple-50"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Direct FIR</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "DIRECT_FIR" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-800"}`}>
            {statusCounts.firRegister}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterTabChange("NOT_ASSIGNED")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "NOT_ASSIGNED"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-amber-900 hover:bg-amber-50"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Not Assigned</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "NOT_ASSIGNED" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
            {statusCounts.notAssigned}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterTabChange("PENDING")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "PENDING"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-blue-900 hover:bg-blue-50"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending / Under Enquiry</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "PENDING" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"}`}>
            {statusCounts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterTabChange("COMPLETE")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "COMPLETE"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-emerald-900 hover:bg-emerald-50"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Complete (Report Ready)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "COMPLETE" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"}`}>
            {statusCounts.complete}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterTabChange("FIR_REGISTERED")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "FIR_REGISTERED"
              ? "bg-red-700 text-white shadow-xs"
              : "text-red-900 hover:bg-red-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>FIR Registered</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "FIR_REGISTERED" ? "bg-white/20 text-white" : "bg-red-100 text-red-800"}`}>
            {statusCounts.firRegistered}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterTabChange("CORRECTION")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            masterFilterTab === "CORRECTION"
              ? "bg-rose-700 text-white shadow-xs"
              : "text-rose-900 hover:bg-rose-50"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Correction Required</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${masterFilterTab === "CORRECTION" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"}`}>
            {statusCounts.correctionRequired}
          </span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <Card className="border-slate-200 !overflow-visible relative z-30">
        <CardContent className="p-4 space-y-3 !overflow-visible">
          {/* Main Controls Row: Status Dropdown with Checkboxes + Search + Priority + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Status Dropdown Button with Checkboxes */}
            <div className="relative z-40" ref={statusDropdownRef}>
              <button
                type="button"
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
                className={`w-full h-10 px-3 text-xs sm:text-sm font-semibold rounded-lg border flex items-center justify-between gap-2 transition-all shadow-2xs ${
                  statusDropdownOpen
                    ? "border-blue-600 ring-2 ring-blue-100 bg-white text-blue-900"
                    : !isAllSelected && selectedStatuses.length > 0
                    ? "border-blue-300 bg-blue-50/70 text-blue-900"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{getStatusButtonLabel()}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedStatuses.length > 0 && selectedStatuses.length < ALL_STATUS_KEYS.length && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      {selectedStatuses.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      statusDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Status Dropdown Menu with Checkboxes */}
              {statusDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-3 animate-in fade-in-50 zoom-in-95 ring-1 ring-slate-900/10">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Filter by Status
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleAll}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 transition-colors"
                    >
                      {isAllSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  <div className="space-y-1">
                    {/* All Complaints Option with Checkbox */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={handleToggleAll}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleToggleAll(); }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors border select-none ${
                        isAllSelected
                          ? "bg-blue-50 border-blue-200 text-blue-950 font-bold"
                          : "hover:bg-slate-50 border-transparent text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 pointer-events-none"
                        />
                        <span className="text-xs">All Complaints</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {statusCounts.all}
                      </span>
                    </div>

                    {/* Specific Status Options with Checkboxes */}
                    {STATUS_OPTIONS.map((opt) => {
                      const isChecked = selectedStatuses.includes(opt.key);
                      const count =
                        opt.key === "NOT_ASSIGNED"
                          ? statusCounts.notAssigned
                          : opt.key === "PENDING"
                          ? statusCounts.pending
                          : opt.key === "COMPLETE"
                          ? statusCounts.complete
                          : opt.key === "FIR_REGISTER"
                          ? statusCounts.firRegister
                          : opt.key === "FIR_REGISTERED"
                          ? statusCounts.firRegistered
                          : statusCounts.correctionRequired;

                      return (
                        <div
                          key={opt.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleToggleStatus(opt.key)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleToggleStatus(opt.key); }}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                            isChecked
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 pointer-events-none"
                            />
                            <span className="text-xs">{opt.label}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isChecked
                                ? "bg-white border border-slate-200 text-slate-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedStatuses([...ALL_STATUS_KEYS])}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Reset Filter
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusDropdownOpen(false)}
                      className="px-3 py-1 text-xs font-bold bg-[#0b192c] hover:bg-slate-800 text-white rounded-md transition-colors shadow-2xs"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Search Bar (2 cols on lg) */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Complaint No, Complainant Name, Phone, Accused, Subject, Station..."
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0b192c] focus:outline-none"
              />
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0b192c] focus:outline-none font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="CM_WINDOW_VIP">CM Window (VIP)</option>
              </select>
            </div>

            {/* Legal Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0b192c] focus:outline-none font-medium"
              >
                <option value="ALL">All Legal Categories</option>
                <option value="CYBER_CRIME">Cyber Crime</option>
                <option value="FINANCIAL_FRAUD_CHEATING">Financial Fraud</option>
                <option value="LAND_PROPERTY_DISPUTE">Land Dispute</option>
                <option value="PHYSICAL_ASSAULT_AFFRAY">Physical Assault</option>
                <option value="DOMESTIC_VIOLENCE_DOWRY">Domestic Dispute</option>
              </select>
            </div>
          </div>

          {/* Active Status Badges / Filter Summary */}
          {!isAllSelected && selectedStatuses.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Filtered by:</span>
              {selectedStatuses.map((k) => {
                const opt = STATUS_OPTIONS.find((o) => o.key === k);
                return (
                  <span
                    key={k}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-xs font-medium"
                  >
                    <span>{opt?.label}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(k)}
                      className="hover:text-blue-950 font-bold ml-0.5"
                      title="Remove status filter"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedStatuses([...ALL_STATUS_KEYS])}
                className="text-[11px] text-blue-700 hover:text-blue-900 underline font-semibold ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count, Column Visibility Popover & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-800">{complaints.length}</strong> {isEo ? "complaint(s) assigned to your docket" : "complaints in register"}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-slate-500">
            Use horizontal scroll <span className="font-mono">↔</span> for wide columns
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Column Visibility Customizer Button & Dropdown (Requirement 9) */}
          <div className="relative" ref={columnDropdownRef}>
            <button
              type="button"
              onClick={() => setColumnDropdownOpen((prev) => !prev)}
              className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Select which columns are visible in the register table"
            >
              <Columns3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Columns</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${columnDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {columnDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 animate-in fade-in-50 zoom-in-95 ring-1 ring-slate-900/10">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Visible Columns
                  </span>
                  <button
                    type="button"
                    onClick={resetColumns}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900"
                  >
                    Reset All
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.complaintId}
                      onChange={() => toggleColumn("complaintId")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Complaint ID &amp; Priority</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.dateTime}
                      onChange={() => toggleColumn("dateTime")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Date &amp; Time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.complainant}
                      onChange={() => toggleColumn("complainant")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Complainant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.categoryLocation}
                      onChange={() => toggleColumn("categoryLocation")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Category &amp; Location</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.status}
                      onChange={() => toggleColumn("status")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Enquiry Status</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.assignedEo}
                      onChange={() => toggleColumn("assignedEo")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Enquiry Officer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.daysPending}
                      onChange={() => toggleColumn("daysPending")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Days Pending</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns.action}
                      onChange={() => toggleColumn("action")}
                      className="w-3.5 h-3.5 rounded text-blue-600"
                    />
                    <span>Action</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={fetchComplaints}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" /> Refresh
          </button>
        </div>
      </div>

      {/* Main Content: Table on Desktop, Cards on Mobile */}
      {loading ? (
        <LoadingSkeleton count={4} />
      ) : complaints.length === 0 ? (
        <EmptyState
          title={isEo ? `No complaints assigned to ${currentUser.name}` : "No complaints found"}
          description={
            isEo
              ? "You currently have no complaints marked to your PNO/Name matching the filters. Any complaint assigned to you by SHO will appear here automatically."
              : "Try clearing your search query or selecting different statuses from the status dropdown."
          }
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedStatuses([...ALL_STATUS_KEYS]);
            setPriorityFilter("ALL");
            setCategoryFilter("ALL");
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View with Horizontal Scrolling & Column Customization */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="min-w-[1050px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    {visibleColumns.complaintId && (
                      <th
                        onClick={() => handleSort("complaintNumber")}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Complaint ID &amp; Priority</span>
                          {renderSortIcon("complaintNumber")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.dateTime && (
                      <th
                        onClick={() => handleSort("createdAt")}
                        className="py-3 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Date &amp; Time</span>
                          {renderSortIcon("createdAt")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.complainant && (
                      <th
                        onClick={() => handleSort("complainantName")}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Complainant</span>
                          {renderSortIcon("complainantName")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.categoryLocation && (
                      <th
                        onClick={() => handleSort("categoryDisplay")}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Category &amp; Incident Location</span>
                          {renderSortIcon("categoryDisplay")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.status && (
                      <th
                        onClick={() => handleSort("status")}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Enquiry Status</span>
                          {renderSortIcon("status")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.assignedEo && (
                      <th
                        onClick={() => handleSort("assignedEoName")}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Enquiry Officer</span>
                          {renderSortIcon("assignedEoName")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.daysPending && (
                      <th
                        onClick={() => handleSort("daysPending")}
                        className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>Days Pending</span>
                          {renderSortIcon("daysPending")}
                        </div>
                      </th>
                    )}

                    {visibleColumns.action && (
                      <th className="py-3 px-4 text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedComplaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/90 transition-colors">
                      {visibleColumns.complaintId && (
                        <td className="py-3 px-4 font-mono">
                          <Link
                            href={`/complaints/${c.id}`}
                            className="font-bold text-[#0b192c] hover:text-blue-600 hover:underline block"
                          >
                            {c.complaintNumber}
                          </Link>
                          <div className="mt-1">
                            <PriorityBadge priority={c.priority} />
                          </div>
                        </td>
                      )}

                      {/* Date & Time */}
                      {visibleColumns.dateTime && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>{formatDate(c.createdAt)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {new Date(c.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Complainant: Display full name without truncation (Requirement 6) */}
                      {visibleColumns.complainant && (
                        <td className="py-3 px-4">
                          <Link
                            href={`/complaints/${c.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline block break-words"
                          >
                            {c.complainantName}
                          </Link>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>+91 {c.complainantMobile}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.categoryLocation && (
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{c.categoryDisplay}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="line-clamp-2">{c.incidentPlace}</span>
                          </div>
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="py-3 px-4">
                          <StatusBadge status={getMainComplaintStatus(c)} />
                        </td>
                      )}

                      {visibleColumns.assignedEo && (
                        <td className="py-3 px-4">
                          {c.directSendToFir || c.status === "FIR_REGISTER" || c.workflowState === "FIR_REGISTER" ? (
                            <div className="space-y-1">
                              <span className="text-purple-700 bg-purple-50 border border-purple-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-block">
                                Direct to FIR (No EO)
                              </span>
                            </div>
                          ) : c.assignedEoName ? (
                            <div className="space-y-1">
                              <div>
                                <p className="font-semibold text-slate-900">{c.assignedEoName}</p>
                                <p className="text-[10px] text-slate-500 font-mono">PNO: {c.assignedEoPno}</p>
                              </div>
                              {isSho && !isMhc && (
                                <div className="relative inline-block mt-0.5" data-assign-dropdown>
                                  <button
                                    type="button"
                                    onClick={() => setAssignDropdownComplaintId((prev) => prev === c.id ? null : c.id)}
                                    className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                    title="Reassign to another Enquiry Officer"
                                  >
                                    <UserCheck className="w-3 h-3 text-amber-700" />
                                    <span>Reassign EO ▾</span>
                                  </button>
                                  {assignDropdownComplaintId === c.id && (
                                    <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-in fade-in-50 text-left">
                                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span>Select EO / IO</span>
                                        <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                                      </div>
                                      <div className="max-h-56 overflow-y-auto py-0.5">
                                        {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                          const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                          const isSelected = c.assignedEoId === eo.id || c.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                                          return (
                                            <button
                                              key={eo.id}
                                              type="button"
                                              disabled={isQuickAssigning}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAssignEO(c.id, eo);
                                              }}
                                              className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                                isSelected
                                                  ? "bg-blue-50 text-blue-900 font-bold"
                                                  : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                              }`}
                                            >
                                              <span className="truncate">{label}</span>
                                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-amber-700 bg-amber-50 border border-amber-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-block">
                                Not Assigned
                              </span>
                              {isSho && !isMhc && (
                                <div className="relative inline-block" data-assign-dropdown>
                                  <button
                                    type="button"
                                    onClick={() => setAssignDropdownComplaintId((prev) => prev === c.id ? null : c.id)}
                                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shadow-2xs"
                                  >
                                    <UserCheck className="w-3 h-3 text-blue-700" />
                                    <span>Assign EO ▾</span>
                                  </button>
                                  {assignDropdownComplaintId === c.id && (
                                    <div className="absolute left-0 top-full mt-1 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-in fade-in-50 text-left">
                                      <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                        <span>Select EO / IO</span>
                                        <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                                      </div>
                                      <div className="max-h-56 overflow-y-auto py-0.5">
                                        {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                          const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                          return (
                                            <button
                                              key={eo.id}
                                              type="button"
                                              disabled={isQuickAssigning}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleQuickAssignEO(c.id, eo);
                                              }}
                                              className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
                                            >
                                              <span className="truncate">{label}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                      {visibleColumns.daysPending && (
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              c.daysPending > 10
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {c.daysPending}d
                          </span>
                        </td>
                      )}

                      {visibleColumns.action && (
                        <td className="py-2.5 px-4 text-right align-middle">
                          <div className="flex flex-col items-end gap-1.5 min-w-[130px]">
                            <Link href={`/complaints/${c.id}`} className="w-full">
                              <Button
                                size="sm"
                                variant="primary"
                                className="w-full text-xs font-semibold gap-1 justify-center"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Profile
                              </Button>
                            </Link>

                            {/* SHO Quick Assign / Reassign EO Dropdown (No dialogue box, rank & name only) */}
                            {!c.directSendToFir && c.status !== "FIR_REGISTER" && c.workflowState !== "FIR_REGISTER" && isSho && !isMhc && (
                              <div className="relative w-full" data-assign-dropdown>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => setAssignDropdownComplaintId((prev) => prev === c.id ? null : c.id)}
                                  className="w-full text-xs font-bold gap-1 justify-center bg-[#0b192c] text-white hover:bg-slate-800 cursor-pointer shadow-2xs"
                                >
                                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                                  <span>{c.assignedEoName ? "Reassign EO ▾" : "Assign EO ▾"}</span>
                                </Button>
                                {assignDropdownComplaintId === c.id && (
                                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 animate-in fade-in-50 text-left">
                                    <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                      <span>Select EO / IO</span>
                                      <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                                    </div>
                                    <div className="max-h-56 overflow-y-auto py-0.5">
                                      {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                        const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                        const isSelected = c.assignedEoId === eo.id || c.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                                        return (
                                          <button
                                            key={eo.id}
                                            type="button"
                                            disabled={isQuickAssigning}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleQuickAssignEO(c.id, eo);
                                            }}
                                            className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                              isSelected
                                                ? "bg-blue-50 text-blue-900 font-bold"
                                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                          >
                                            <span className="truncate">{label}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Direct FIR for SHO account: Show "Register FIR" button */}
                            {isSho && !isMhc && !c.isFirRegistered && (c.directSendToFir || c.status === "FIR_REGISTER" || c.workflowState === "FIR_REGISTER") && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenFirRegisterModal(c)}
                                className="w-full text-xs font-bold gap-1 justify-center bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-2xs animate-pulse"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Register FIR</span>
                              </Button>
                            )}

                            {/* EO: If Report prepared with Complete or FIR Recommend and not yet sent */}
                            {isEo && (c.eoOutcome === "Complete" || c.eoOutcome === "FIR Recommend" || c.isRecommendedForFir) && !c.isSentToSho && c.status !== "COMPLETE" && c.workflowState !== "CORRECTION_REQUIRED" && (
                              <Button
                                size="sm"
                                onClick={() => setEoSendToShoModalComplaint(c)}
                                className="w-full text-xs font-bold gap-1 justify-center bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send to SHO</span>
                              </Button>
                            )}

                            {/* EO: Display Rejection Reason & Correct Button if rejected by SHO */}
                            {isEo && (c.workflowState === "CORRECTION_REQUIRED" || c.shoDecision === "REJECT" || c.status === "CORRECTION_REQUIRED") && (
                              <div className="w-full text-left bg-amber-50 border border-amber-300 rounded p-1.5 text-[11px] text-amber-900 space-y-1">
                                <div className="font-bold flex items-center gap-1 text-amber-800">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Correction Required</span>
                                </div>
                                <p className="line-clamp-2 text-[10px] text-amber-950 font-medium bg-white/80 p-1 rounded border border-amber-200">
                                  <strong>Reason:</strong> {c.rejectionReason || "Report rejected by SHO. Correction required."}
                                </p>
                                <Link href={`/complaints/${c.id}`} className="block">
                                  <Button
                                    size="sm"
                                    className="w-full text-[11px] font-bold justify-center bg-amber-600 hover:bg-amber-700 text-white cursor-pointer h-6 px-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Correct &amp; Resubmit</span>
                                  </Button>
                                </Link>
                              </div>
                            )}

                            {/* SHO: Action on Completed EO Report -> Approve and Reject buttons */}
                            {isSho && !isMhc && !c.isFirRegistered && !c.directSendToFir && c.status !== "FIR_REGISTER" && (
                              c.status === "COMPLETE" ||
                              c.workflowState === "COMPLETE" ||
                              c.eoOutcome === "Complete" ||
                              (c.isSentToSho && !c.isFirApprovedBySho)
                            ) && c.workflowState !== "CORRECTION_REQUIRED" && c.status !== "CORRECTION_REQUIRED" && c.shoDecision !== "REJECT" && c.shoDecision !== "APPROVE" && (
                              <div className="flex items-center gap-1 w-full">
                                <Button
                                  size="sm"
                                  onClick={() => setShoApproveModalComplaint(c)}
                                  className="flex-1 text-[11px] font-bold justify-center bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-7 px-1.5"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setShoRejectModalComplaint(c);
                                    setRejectionReason("");
                                  }}
                                  className="flex-1 text-[11px] font-bold justify-center bg-rose-600 hover:bg-rose-700 text-white cursor-pointer h-7 px-1.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </Button>
                              </div>
                            )}

                            {/* SHO: Regular FIR Registration when recommended & approved */}
                            {isSho && !isMhc && (c.isFirApprovedBySho || c.workflowState === "FIR_REGISTRATION_PENDING") && !c.isFirRegistered && !c.directSendToFir && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenFirRegisterModal(c)}
                                className="w-full text-xs font-bold gap-1 justify-center bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-2xs animate-pulse"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Register FIR</span>
                              </Button>
                            )}

                            {/* Receipt Button */}
                            {c.assignedEoName && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReceiptComplaint(c);
                                  setShowReceiptModal(true);
                                }}
                                className="w-full text-xs font-semibold gap-1 justify-center text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer shadow-2xs"
                                title="Official Receipt of registered complaints"
                              >
                                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Receipt</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card-Based View */}
          <div className="md:hidden space-y-3">
            {sortedComplaints.map((c) => (
              <Card key={c.id} className="border-slate-200 shadow-xs">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/complaints/${c.id}`}
                      className="font-mono text-xs font-bold text-[#0b192c] hover:underline"
                    >
                      {c.complaintNumber}
                    </Link>
                    <PriorityBadge priority={c.priority} />
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-600" />
                      {formatDate(c.createdAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(c.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={`/complaints/${c.id}`}
                      className="text-sm font-bold text-slate-900 hover:underline block"
                    >
                      {c.complainantName}
                    </Link>
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {c.complainantMobile}
                      </span>
                      <span>•</span>
                      <span>{c.categoryDisplay}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <p className="line-clamp-2">{c.incidentDetails}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <StatusBadge status={getMainComplaintStatus(c)} />
                    <span className="text-[11px] text-slate-500 font-medium">
                      {c.directSendToFir || c.status === "FIR_REGISTER" || c.workflowState === "FIR_REGISTER"
                        ? "Direct to FIR"
                        : `EO: ${c.assignedEoName || "Not Assigned"}`}
                    </span>
                  </div>

                  <div className="pt-2 flex flex-col gap-2 border-t border-slate-100">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/complaints/${c.id}`} className="block">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs font-semibold gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </Button>
                      </Link>
                      {c.assignedEoName ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReceiptComplaint(c);
                              setShowReceiptModal(true);
                            }}
                            className="w-full text-xs font-semibold gap-1 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" /> Receipt
                          </Button>
                          {isSho && !isMhc && !c.directSendToFir && c.status !== "FIR_REGISTER" && c.workflowState !== "FIR_REGISTER" && (
                            <div className="relative w-full" data-assign-dropdown>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignDropdownComplaintId((prev) => prev === c.id ? null : c.id)}
                                className="w-full text-xs font-bold gap-1 text-slate-700 border-slate-300 hover:bg-slate-100"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-slate-600" /> Reassign EO ▾
                              </Button>
                              {assignDropdownComplaintId === c.id && (
                                <div className="absolute left-0 bottom-full mb-1 z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left animate-in fade-in-50">
                                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                    <span>Select EO / IO</span>
                                    <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto py-0.5">
                                    {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                      const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                      const isSelected = c.assignedEoId === eo.id || c.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                                      return (
                                        <button
                                          key={eo.id}
                                          type="button"
                                          disabled={isQuickAssigning}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickAssignEO(c.id, eo);
                                          }}
                                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                            isSelected ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                          }`}
                                        >
                                          <span className="truncate">{label}</span>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        isSho && !isMhc && !c.directSendToFir && c.status !== "FIR_REGISTER" && c.workflowState !== "FIR_REGISTER" && (
                          <div className="relative w-full" data-assign-dropdown>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setAssignDropdownComplaintId((prev) => prev === c.id ? null : c.id)}
                              className="w-full text-xs font-bold gap-1 bg-[#0b192c] text-white hover:bg-slate-800"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-amber-300" /> Assign EO ▾
                            </Button>
                            {assignDropdownComplaintId === c.id && (
                              <div className="absolute left-0 bottom-full mb-1 z-50 w-full bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left animate-in fade-in-50">
                                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                  <span>Select EO / IO</span>
                                  <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                                </div>
                                <div className="max-h-56 overflow-y-auto py-0.5">
                                  {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                                    const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                                    const isSelected = c.assignedEoId === eo.id || c.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                                    return (
                                      <button
                                        key={eo.id}
                                        type="button"
                                        disabled={isQuickAssigning}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuickAssignEO(c.id, eo);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                          isSelected ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        }`}
                                      >
                                        <span className="truncate">{label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {/* Direct FIR on mobile for SHO */}
                    {isSho && !isMhc && !c.isFirRegistered && (c.directSendToFir || c.status === "FIR_REGISTER" || c.workflowState === "FIR_REGISTER") && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenFirRegisterModal(c)}
                        className="w-full text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      >
                        <FileText className="w-3.5 h-3.5" /> Register FIR
                      </Button>
                    )}

                    {/* EO Rejection Banner & Correct Button on mobile */}
                    {isEo && (c.workflowState === "CORRECTION_REQUIRED" || c.shoDecision === "REJECT" || c.status === "CORRECTION_REQUIRED") && (
                      <div className="w-full text-left bg-amber-50 border border-amber-300 rounded p-2 text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Correction Required</span>
                        </div>
                        <p className="text-[11px] text-amber-950 font-medium bg-white/80 p-1.5 rounded border border-amber-200">
                          <strong>Reason:</strong> {c.rejectionReason || "Report rejected by SHO. Correction required."}
                        </p>
                        <Link href={`/complaints/${c.id}`} className="block">
                          <Button
                            size="sm"
                            className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white mt-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Correct &amp; Resubmit
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Additional action buttons on mobile */}
                    {isEo && (c.eoOutcome === "Complete" || c.eoOutcome === "FIR Recommend" || c.isRecommendedForFir) && !c.isSentToSho && c.status !== "COMPLETE" && c.workflowState !== "CORRECTION_REQUIRED" && (
                      <Button
                        size="sm"
                        onClick={() => setEoSendToShoModalComplaint(c)}
                        className="w-full text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="w-3.5 h-3.5" /> Send to SHO
                      </Button>
                    )}

                    {/* SHO: Approve / Reject buttons on Mobile */}
                    {isSho && !isMhc && !c.isFirRegistered && !c.directSendToFir && c.status !== "FIR_REGISTER" && (
                      c.status === "COMPLETE" ||
                      c.workflowState === "COMPLETE" ||
                      c.eoOutcome === "Complete" ||
                      (c.isSentToSho && !c.isFirApprovedBySho)
                    ) && c.workflowState !== "CORRECTION_REQUIRED" && c.status !== "CORRECTION_REQUIRED" && c.shoDecision !== "REJECT" && c.shoDecision !== "APPROVE" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => setShoApproveModalComplaint(c)}
                          className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1 inline" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setShoRejectModalComplaint(c);
                            setRejectionReason("");
                          }}
                          className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          <X className="w-3.5 h-3.5 mr-1 inline" /> Reject
                        </Button>
                      </div>
                    )}

                    {isSho && !isMhc && (c.isFirApprovedBySho || c.workflowState === "FIR_REGISTRATION_PENDING") && !c.isFirRegistered && !c.directSendToFir && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenFirRegisterModal(c)}
                        className="w-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white animate-pulse"
                      >
                        <FileText className="w-3.5 h-3.5" /> Register FIR
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Complaint Detail Inspection Modal / Drawer */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedComplaint(null)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col z-10 overflow-hidden animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#081225] text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {selectedComplaint.complaintNumber}
                  </span>
                  <PriorityBadge priority={selectedComplaint.priority} />
                </div>
                <h3 className="text-base font-bold text-white">
                  Complaint Case File • {selectedComplaint.policeStation}
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm">
              {/* Status and Officer Bar */}
              {/* Status and Officer Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-500 block">Current Status</span>
                  <StatusBadge status={selectedComplaint.status} />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Assigned Enquiry Officer</span>
                  <p className="font-bold text-slate-900">
                    {selectedComplaint.assignedEoName ? (
                      <span>
                        {selectedComplaint.assignedEoName}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          ({selectedComplaint.assignedEoRank}, PNO: {selectedComplaint.assignedEoPno})
                        </span>
                      </span>
                    ) : (
                      "Not yet assigned"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block">Intake Date</span>
                  <p className="font-semibold text-slate-700 font-mono">
                    {formatDate(selectedComplaint.createdAt)}
                  </p>
                </div>
              </div>

              {/* If assigned, show duty roster and directions box */}
              {selectedComplaint.assignedEoName && (
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-1.5">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-700" />
                      <span>Enquiry Officer Assignment & Roster Duty Details</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/70 text-blue-900">
                      Active Investigation
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-500 font-medium">Assigned Officer:</span>{" "}
                      <span className="font-semibold text-slate-900">{selectedComplaint.assignedEoName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Roster Duty:</span>{" "}
                      <span className="font-semibold text-blue-900">{selectedComplaint.assignedRosterDuty || "Beat Patrolling & Enquiries"}</span>
                    </div>
                    {selectedComplaint.targetResolutionDate && (
                      <div>
                        <span className="text-slate-500 font-medium">Target Completion:</span>{" "}
                        <span className="font-semibold text-slate-900">{formatDate(selectedComplaint.targetResolutionDate)}</span>
                      </div>
                    )}
                  </div>
                  {selectedComplaint.assignedDirections && (
                    <div className="pt-1">
                      <span className="text-slate-500 font-medium block mb-1">Supervisory Directions Transmitted:</span>
                      <div className="p-2 bg-white rounded border border-blue-200 text-slate-800 text-xs">
                        {selectedComplaint.assignedDirections}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Complainant Particulars */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1 text-[#0b192c]">
                  1. Complainant Particulars
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Full Name:</span>{" "}
                    <span className="font-bold text-slate-900">{selectedComplaint.complainantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Father/Spouse:</span>{" "}
                    <span className="font-medium text-slate-800">
                      {selectedComplaint.complainantFatherSpouse || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact Mobile:</span>{" "}
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedComplaint.complainantMobile}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Gender / Age:</span>{" "}
                    <span className="font-medium text-slate-800">
                      {selectedComplaint.complainantGender} • {selectedComplaint.complainantAge || "Adult"} Yrs
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">Residential Address:</span>{" "}
                    <span className="font-medium text-slate-800">
                      {selectedComplaint.complainantAddress}, {selectedComplaint.complainantCity},{" "}
                      {selectedComplaint.complainantDistrict}
                    </span>
                  </div>
                </div>
              </div>

              {/* Incident Facts */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1 text-[#0b192c]">
                  2. Incident Facts & Allegations
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-4 text-slate-600">
                    <span>
                      <strong>Date of Incident:</strong> {selectedComplaint.incidentDate || "Not specified"}
                    </span>
                    <span>
                      <strong>Location:</strong> {selectedComplaint.incidentPlace}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-slate-800 leading-relaxed font-sans text-xs sm:text-sm">
                    {selectedComplaint.incidentDetails}
                  </div>
                </div>
              </div>

              {/* Attached Evidence Files (If Any) */}
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider text-[#0b192c] flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                      <span>Attached Evidence ({selectedComplaint.attachments.length})</span>
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Digitally Sealed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {selectedComplaint.attachments.map((file) => (
                      <div
                        key={file.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {file.category === "video" && <Video className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                            {file.category === "audio" && <Music className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            {file.category === "image" && <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                            {file.category === "document" && <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            {file.category === "other" && <Paperclip className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                            <span className="font-semibold text-slate-900 truncate">{file.name}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 shrink-0">
                            {file.category}
                          </span>
                        </div>

                        {file.description && (
                          <p className="text-[11px] text-slate-600 italic">
                            &ldquo;{file.description}&rdquo;
                          </p>
                        )}

                        {file.category === "audio" && file.dataUrl && (
                          <audio controls src={file.dataUrl} className="w-full h-7 pt-1" />
                        )}

                        {file.category === "video" && file.dataUrl && (
                          <video controls src={file.dataUrl} className="w-full rounded max-h-36 bg-black" />
                        )}

                        {file.category === "image" && file.dataUrl && (
                          <img
                            src={file.dataUrl}
                            alt={file.name}
                            className="max-h-28 rounded object-contain border border-slate-200"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accused Suspects */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider border-b border-slate-100 pb-1 text-[#0b192c]">
                  3. Accused / Suspect Information
                </h4>
                {selectedComplaint.accusedList && selectedComplaint.accusedList.length > 0 ? (
                  <div className="space-y-2">
                    {selectedComplaint.accusedList.map((acc, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
                        <p className="font-bold text-slate-900">{acc.name}</p>
                        {acc.address && <p className="text-slate-600">Address: {acc.address}</p>}
                        {acc.phone && <p className="text-slate-600 font-mono">Contact: {acc.phone}</p>}
                        {acc.relationWithComplainant && (
                          <p className="text-slate-600">Relation: {acc.relationWithComplainant}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No specific suspect named or unknown offender.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Registered by: {selectedComplaint.registeredBy}
              </span>
              <div className="flex items-center gap-2">
                <Link href={`/complaints/${selectedComplaint.id}`}>
                  <Button size="sm" variant="primary" className="bg-[#0b192c] text-white hover:bg-slate-800 gap-1 text-xs">
                    <Eye className="w-3.5 h-3.5" /> Open Full Profile
                  </Button>
                </Link>
                {selectedComplaint.assignedEoName && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReceiptComplaint(selectedComplaint);
                      setShowReceiptModal(true);
                    }}
                    className="text-xs font-semibold gap-1 text-emerald-800 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-700" /> Print Receipt
                  </Button>
                )}
                {isSho && !isMhc && !selectedComplaint.directSendToFir && selectedComplaint.status !== "FIR_REGISTER" && selectedComplaint.workflowState !== "FIR_REGISTER" && (
                  <div className="relative" data-assign-dropdown>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setAssignDropdownComplaintId((prev) => prev === selectedComplaint.id ? null : selectedComplaint.id)}
                      className="text-xs font-bold gap-1 bg-[#0b192c] text-white hover:bg-slate-800 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                      <span>{selectedComplaint.assignedEoName ? "Reassign EO ▾" : "Assign Enquiry Officer ▾"}</span>
                    </Button>
                    {assignDropdownComplaintId === selectedComplaint.id && (
                      <div className="absolute right-0 bottom-full mb-1 z-50 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1 text-left animate-in fade-in-50">
                        <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Select EO / IO</span>
                          <span className="text-slate-400 font-mono text-[9px]">Rank &amp; Name</span>
                        </div>
                        <div className="max-h-56 overflow-y-auto py-0.5">
                          {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                            const label = eo.name.startsWith(eo.rank) ? eo.name : `${eo.rank} ${eo.name}`;
                            const isSelected = selectedComplaint.assignedEoId === eo.id || selectedComplaint.assignedEoName?.toLowerCase().includes(eo.name.toLowerCase());
                            return (
                              <button
                                key={eo.id}
                                type="button"
                                disabled={isQuickAssigning}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickAssignEO(selectedComplaint.id, eo);
                                  setSelectedComplaint((prev) => prev ? { ...prev, assignedEoId: eo.id, assignedEoName: eo.name, assignedEoPno: eo.pno, status: "ENQUIRY_IN_PROGRESS" } : null);
                                }}
                                className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-900 font-bold"
                                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                              >
                                <span className="truncate">{label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHO Assign EO Modal removed: SHO uses instant inline dropdown showing Rank & Name only (no dialogue box) */}

      {/* SHO Approve Modal */}
      {shoApproveModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-sm">SHO Report Approval</h3>
              </div>
              <button onClick={() => setShoApproveModalComplaint(null)} className="text-white hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {shoApproveModalComplaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {shoApproveModalComplaint.complainantName}</p>
                <p><strong>Enquiry Officer:</strong> {shoApproveModalComplaint.assignedEoName}</p>
                <p><strong>EO Outcome:</strong> <span className="font-bold text-blue-700">{shoApproveModalComplaint.eoOutcome || "Complete"}</span></p>
              </div>

              {shoApproveModalComplaint.eoOutcome === "FIR Recommend" ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 space-y-1">
                  <p className="font-bold text-sm">FIR Recommendation Approval</p>
                  <p className="text-xs">
                    Approving this report will sanction the EO&apos;s recommendation to register a regular FIR. You can subsequently click &quot;Register FIR&quot; to formally assign an FIR Number and register the criminal case.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 space-y-1">
                  <p className="font-bold text-sm">Enquiry Closure Approval</p>
                  <p className="text-xs">
                    Approving this report will formally close the preliminary enquiry as Complete.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SHO Supervisory Remarks / Directions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={shoApproveRemarks}
                  onChange={(e) => setShoApproveRemarks(e.target.value)}
                  placeholder="Enter supervisory remarks, observations or concurrence notes..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShoApproveModalComplaint(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShoApprove}
                disabled={isApproving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {isApproving ? "Approving..." : "Confirm & Approve Report"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SHO Re-Enquiry Modal */}
      {shoReEnquiryModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Order Re-Enquiry by SHO</h3>
              </div>
              <button onClick={() => setShoReEnquiryModalComplaint(null)} className="text-white hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {shoReEnquiryModalComplaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {shoReEnquiryModalComplaint.complainantName}</p>
                <p><strong>Enquiry Officer:</strong> {shoReEnquiryModalComplaint.assignedEoName}</p>
                <p className="text-amber-800 font-semibold pt-1">
                  This complaint will be returned to the SAME Enquiry Officer ({shoReEnquiryModalComplaint.assignedEoName}), status will remain &quot;Pending&quot;, and the EO will be notified immediately.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Re-Enquiry Reason &amp; Specific Directions <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={reEnquiryReason}
                  onChange={(e) => setReEnquiryReason(e.target.value)}
                  placeholder="Explain why re-enquiry is required (e.g. key witnesses not examined, site plan missing, clarification required)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShoReEnquiryModalComplaint(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShoReEnquiry}
                disabled={isSubmittingReEnquiry || !reEnquiryReason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {isSubmittingReEnquiry ? "Submitting..." : "Order Re-Enquiry & Notify EO"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SHO Reject Report Modal */}
      {shoRejectModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm">Reject Enquiry Report &amp; Return to EO</h3>
              </div>
              <button onClick={() => setShoRejectModalComplaint(null)} className="text-white hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {shoRejectModalComplaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {shoRejectModalComplaint.complainantName}</p>
                <p><strong>Assigned EO:</strong> {shoRejectModalComplaint.assignedEoName} (PNO: {shoRejectModalComplaint.assignedEoPno})</p>
                <p className="text-rose-800 font-semibold pt-1">
                  On rejection submission, this complaint will be returned to the same assigned EO ({shoRejectModalComplaint.assignedEoName}) for correction and resubmission.
                  The complaint status will change to <strong>&ldquo;Correction Required&rdquo;</strong>, and the rejection reason will be clearly displayed in the EO account.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason &amp; Specific Corrections Required <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter mandatory rejection reason and required corrections (e.g. statements incomplete, site plan missing, clarification required on suspect version)..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShoRejectModalComplaint(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShoReject}
                disabled={isSubmittingReject || !rejectionReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
              >
                {isSubmittingReject ? "Submitting..." : "Submit Rejection & Return to EO"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SHO Register FIR Modal */}
      {firRegisterModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-sm">Register Regular FIR (BNSS / BNS)</h3>
              </div>
              <button onClick={() => setFirRegisterModalComplaint(null)} className="text-white hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {firRegisterModalComplaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {firRegisterModalComplaint.complainantName}</p>
                <p><strong>Station:</strong> {firRegisterModalComplaint.policeStation}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  FIR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firNumberInput}
                  onChange={(e) => setFirNumberInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  placeholder="e.g. HAR-KKR-2026-FIR-0042"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sections of Law <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firSectionsInput}
                  onChange={(e) => setFirSectionsInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  placeholder="e.g. Section 115(2), 351(2), 3(5) BNS, 2023"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={firDateInput}
                  onChange={(e) => setFirDateInput(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setFirRegisterModalComplaint(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRegisterFirSubmit}
                disabled={isRegisteringFir || !firNumberInput.trim()}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isRegisteringFir ? "Registering..." : "Confirm FIR Registration"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EO Send to SHO Modal */}
      {eoSendToShoModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Send Report to SHO ID</h3>
              </div>
              <button onClick={() => setEoSendToShoModalComplaint(null)} className="text-white hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <p><strong>Complaint No:</strong> {eoSendToShoModalComplaint.complaintNumber}</p>
                <p><strong>Complainant:</strong> {eoSendToShoModalComplaint.complainantName}</p>
                <p><strong>Outcome Selected:</strong> <span className="font-bold text-blue-700">{eoSendToShoModalComplaint.eoOutcome || "Complete"}</span></p>
                <p className="text-slate-600 text-[11px] pt-1">
                  Once sent, this complaint will be dispatched to the Station House Officer (SHO) for formal review and decision, and will move out of your active daily queue until approved or returned for re-enquiry.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Remarks / Submission Note for SHO (Optional)
                </label>
                <textarea
                  rows={3}
                  value={eoSendRemarks}
                  onChange={(e) => setEoSendRemarks(e.target.value)}
                  placeholder="Enquiry completed as per directions. Submitted for approval..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEoSendToShoModalComplaint(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleEoSendToShoSubmit}
                disabled={isSendingToSho}
                className="bg-[#0b192c] hover:bg-slate-800 text-white font-bold"
              >
                {isSendingToSho ? "Sending..." : "Dispatch to SHO ID"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt of Registered Complaints Modal */}
      <ComplaintReceiptModal
        complaint={receiptComplaint}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}

export default function ComplaintListPage() {
  return (
    <React.Suspense fallback={<LoadingSkeleton count={4} />}>
      <ComplaintListContent />
    </React.Suspense>
  );
}
