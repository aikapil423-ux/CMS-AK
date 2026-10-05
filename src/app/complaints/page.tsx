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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ComplaintService } from "@/services/complaintService";
import { ComplaintItem, OfficerNotification } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState, LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { formatDate, formatDateTime } from "@/lib/utils";

type ComplaintSortField =
  | "complaintNumber"
  | "createdAt"
  | "complainantName"
  | "categoryDisplay"
  | "status"
  | "assignedEoName"
  | "daysPending";

const STATUS_OPTIONS = [
  { key: "UNASSIGNED", label: "Unassigned" },
  { key: "UNDER_ENQUIRY", label: "Under Enquiry" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "DISPOSED", label: "Disposed" },
];

const ALL_STATUS_KEYS = ["UNASSIGNED", "UNDER_ENQUIRY", "UNDER_REVIEW", "DISPOSED"];

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

  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Status Filter with Dropdown and Checkboxes
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_STATUS_KEYS);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    unassigned: 0,
    underEnquiry: 0,
    underReview: 0,
    disposed: 0,
  });

  const isAllSelected = selectedStatuses.length === ALL_STATUS_KEYS.length;

  const isEo = currentUser.role === "ENQUIRY_OFFICER";
  const eoFilterParam = isEo ? (currentUser.pno || currentUser.name) : undefined;

  const [priorityFilter, setPriorityFilter] = useState(initialPriority);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [sortField, setSortField] = useState<ComplaintSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selected complaint for drawer/modal inspection
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);

  // Assignment Modal & Directions
  const [assigningComplaint, setAssigningComplaint] = useState<ComplaintItem | null>(null);
  const [selectedEoId, setSelectedEoId] = useState(MOCK_ENQUIRY_OFFICERS[0].id);
  const [directionTemplate, setDirectionTemplate] = useState("SPOT_VERIFY");
  const [assignedDirections, setAssignedDirections] = useState(
    DIRECTION_TEMPLATES[0].text
  );
  const [targetDays, setTargetDays] = useState(14);
  const [lastAssignedNotification, setLastAssignedNotification] = useState<OfficerNotification | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  const selectedEo = useMemo(() => {
    return MOCK_ENQUIRY_OFFICERS.find((e) => e.id === selectedEoId) || MOCK_ENQUIRY_OFFICERS[0];
  }, [selectedEoId]);

  const handleOpenAssignModal = (complaint: ComplaintItem) => {
    setAssigningComplaint(complaint);
    setAssignSuccess(false);
    setLastAssignedNotification(null);

    let defaultTemplate = "SPOT_VERIFY";
    let defaultEoId = "eo_1";

    if (complaint.category === "LAND_PROPERTY_DISPUTE") {
      defaultTemplate = "REVENUE_LAND";
      defaultEoId = "eo_2";
    } else if (complaint.category === "DOMESTIC_VIOLENCE_DOWRY") {
      defaultTemplate = "MEDIATION";
      defaultEoId = "eo_4";
    } else if (complaint.category === "PHYSICAL_ASSAULT_AFFRAY") {
      defaultTemplate = "MEDICAL_MLR";
      defaultEoId = "eo_1";
    } else if (complaint.category === "CYBER_CRIME" || complaint.category === "FINANCIAL_FRAUD_CHEATING") {
      defaultTemplate = "DIGITAL_CCTV";
      defaultEoId = "eo_1";
    } else {
      defaultEoId = "eo_3";
    }

    const tmpl = DIRECTION_TEMPLATES.find((t) => t.key === defaultTemplate);
    setSelectedEoId(defaultEoId);
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
    if (!assigningComplaint) return;
    setIsAssigning(true);
    const eo = selectedEo;

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

      setTimeout(() => {
        setAssignSuccess(false);
        setAssigningComplaint(null);
        setLastAssignedNotification(null);
      }, 3200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Close status dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
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
      }),
      ComplaintService.getStatusCounts(eoFilterParam),
    ]);
    setComplaints(data);
    setStatusCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    fetchComplaints();
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
                        opt.key === "UNASSIGNED"
                          ? statusCounts.unassigned
                          : opt.key === "UNDER_ENQUIRY"
                          ? statusCounts.underEnquiry
                          : opt.key === "UNDER_REVIEW"
                          ? statusCounts.underReview
                          : statusCounts.disposed;

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
                placeholder="Search by Complaint No, Complainant Name, Phone, Accused..."
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

      {/* Results Count & Quick Refresh */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{complaints.length}</strong> {isEo ? "complaint(s) assigned to your docket" : "complaints in register"}
        </span>
        <button
          onClick={fetchComplaints}
          className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
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
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort("complaintNumber")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Complaint ID & Priority</span>
                      {renderSortIcon("complaintNumber")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("createdAt")}
                    className="py-3 px-4 whitespace-nowrap cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Time</span>
                      {renderSortIcon("createdAt")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("complainantName")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Complainant</span>
                      {renderSortIcon("complainantName")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("categoryDisplay")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Category & Incident Location</span>
                      {renderSortIcon("categoryDisplay")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Enquiry Status</span>
                      {renderSortIcon("status")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("assignedEoName")}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Enquiry Officer</span>
                      {renderSortIcon("assignedEoName")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("daysPending")}
                    className="py-3 px-4 text-center cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Days Pending</span>
                      {renderSortIcon("daysPending")}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/90 transition-colors">
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

                    {/* Date & Time */}
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

                    <td className="py-3 px-4">
                      <Link
                        href={`/complaints/${c.id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline block"
                      >
                        {c.complainantName}
                      </Link>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.complainantMobile}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{c.categoryDisplay}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{c.incidentPlace}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-3 px-4">
                      {c.assignedEoName ? (
                        <div>
                          <p className="font-semibold text-slate-900">{c.assignedEoName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">PNO: {c.assignedEoPno}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-amber-700 bg-amber-50 border border-amber-200 font-bold text-[10px] px-2 py-0.5 rounded-full inline-block">
                            Unassigned
                          </span>
                          {(currentUser.role === "SHO" || currentUser.role === "DSP_SUBDIV") && (
                            <button
                              onClick={() => handleOpenAssignModal(c)}
                              className="text-[11px] font-semibold text-[#0b192c] hover:underline block"
                            >
                              + Assign EO
                            </button>
                          )}
                        </div>
                      )}
                    </td>

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

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/complaints/${c.id}`}>
                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs font-semibold gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Profile
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedComplaint(c)}
                          className="text-xs font-semibold"
                          title="Quick preview drawer"
                        >
                          Quick View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    <StatusBadge status={c.status} />
                    <span className="text-[11px] text-slate-500 font-medium">
                      EO: {c.assignedEoName || "Unassigned"}
                    </span>
                  </div>

                  <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100">
                    <Link href={`/complaints/${c.id}`} className="block">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs font-semibold gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Profile
                      </Button>
                    </Link>
                    {!c.assignedEoName ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignModal(c)}
                        className="text-xs font-semibold"
                      >
                        Assign EO
                      </Button>
                    ) : (
                      <a href={`tel:${c.complainantMobile}`} className="block">
                        <Button variant="secondary" size="sm" className="w-full text-xs font-semibold gap-1">
                          <Phone className="w-3.5 h-3.5" /> Call Complainant
                        </Button>
                      </a>
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
                {!selectedComplaint.assignedEoName && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      handleOpenAssignModal(selectedComplaint);
                      setSelectedComplaint(null);
                    }}
                    className="text-xs"
                  >
                    Assign Enquiry Officer
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setSelectedComplaint(null)} className="text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal with Roster Duty & Officer Directions */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => {
              if (!isAssigning) {
                setAssigningComplaint(null);
                setAssignSuccess(false);
                setLastAssignedNotification(null);
              }
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-[#081225] text-white flex items-center justify-between border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {assigningComplaint.complaintNumber}
                  </span>
                  <PriorityBadge priority={assigningComplaint.priority} />
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-400" />
                  <span>Assign Enquiry Officer (EO) & Roster Duty</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Complainant: <span className="font-semibold text-white">{assigningComplaint.complainantName}</span> • Category: <span className="font-semibold text-white">{assigningComplaint.categoryDisplay}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  if (!isAssigning) {
                    setAssigningComplaint(null);
                    setAssignSuccess(false);
                    setLastAssignedNotification(null);
                  }
                }}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {assignSuccess ? (
                <div className="p-4 sm:p-6 text-center space-y-4 animate-in fade-in-0 zoom-in-95">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">
                      Enquiry Officer Assigned & Marked in Database!
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Complaint status transitioned to <strong className="text-blue-700">Under Enquiry</strong>. Registered in Station General Diary.
                    </p>
                  </div>

                  {/* Dispatched Notification Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">Notice Dispatched to EO</p>
                          <p className="text-[11px] text-slate-500">
                            Sent to {selectedEo.name} ({selectedEo.rank}, PNO: {selectedEo.pno})
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Dispatched
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Assigned Roster Duty:</span>{" "}
                        <span className="font-semibold text-slate-800">{selectedEo.rosterDuty}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Target Completion:</span>{" "}
                        <span className="font-semibold text-blue-700">{targetDays} Days (Due within deadline)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Supervisory Directions:</span>
                        <div className="mt-1 p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-sans text-xs">
                          {assignedDirections || "Preliminary spot verification & witness examination."}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span>Recorded under Punjab Police Rules 22.48 (General Diary)</span>
                      <span className="font-mono text-[10px]">Station: {assigningComplaint.policeStation}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="primary"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setAssignSuccess(false);
                        setAssigningComplaint(null);
                        setLastAssignedNotification(null);
                      }}
                    >
                      Done & Return to Register
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Step 1: Officer Selection & Duty Roster */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#0b192c] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span>1. Active Officer Duty Roster</span>
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Click on any officer name to assign directions
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {MOCK_ENQUIRY_OFFICERS.map((eo) => {
                        const isSelected = selectedEoId === eo.id;
                        return (
                          <div
                            key={eo.id}
                            onClick={() => handleSelectEo(eo.id)}
                            className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-600 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20"
                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    isSelected
                                      ? "bg-[#0b192c] text-white"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {eo.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-slate-900 text-sm">{eo.name}</h4>
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      ({eo.rank})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                                    <span>PNO: {eo.pno}</span>
                                    <span>•</span>
                                    <span>{eo.beatZone}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {eo.availability}
                                </span>
                                <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                                  {eo.shift}
                                </span>
                                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {eo.activeCases} Active Cases
                                </span>
                              </div>
                            </div>

                            {/* Roster Duty Bar */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <span className="font-bold text-slate-900">Current Roster Duty:</span>
                                <span className="font-medium text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded">
                                  {eo.rosterDuty}
                                </span>
                              </div>
                              <span className={`font-semibold ${isSelected ? "text-blue-700" : "text-slate-400"}`}>
                                {isSelected ? "✓ Selected for Assignment" : "Click to Assign"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Directions Dropdown & Instructions (Opens for Selected Officer) */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#0b192c] flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. Supervisory Directions for {selectedEo.name} ({selectedEo.rank})</span>
                      </label>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                        Notice will be sent to EO
                      </span>
                    </div>

                    {/* Pre-set Direction Template Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Select Direction Template (or customize below)
                      </label>
                      <select
                        value={directionTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        {DIRECTION_TEMPLATES.map((tmpl) => (
                          <option key={tmpl.key} value={tmpl.key}>
                            {tmpl.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Directions Text Area */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Supervisory Directions & Specific Instructions
                      </label>
                      <textarea
                        rows={3}
                        value={assignedDirections}
                        onChange={(e) => setAssignedDirections(e.target.value)}
                        placeholder="Enter clear, actionable inquiry directions for the Enquiry Officer..."
                        className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-sans"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        These instructions will be formally dispatched to {selectedEo.name} and logged in the Station General Diary.
                      </p>
                    </div>

                    {/* Target Timeline */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Enquiry Completion Timeline
                      </label>
                      <select
                        value={targetDays}
                        onChange={(e) => setTargetDays(Number(e.target.value))}
                        className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      >
                        <option value={3}>3 Days - Urgent Priority / Sensitive Case</option>
                        <option value={7}>7 Days - Standard Spot Inquiry (BNSS 173(3))</option>
                        <option value={10}>10 Days - Complex / Witness Verification</option>
                        <option value={14}>14 Days - Regular Statutory Inquiry Period</option>
                        <option value={30}>30 Days - Extended Revenue / Multi-party Inquiry</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!assignSuccess && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-600 text-center sm:text-left">
                  <span>Assigning to: </span>
                  <strong className="text-slate-900">{selectedEo.name}</strong>
                  <span className="text-slate-500"> • Roster: {selectedEo.rosterDuty}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAssigningComplaint(null);
                      setAssignSuccess(false);
                      setLastAssignedNotification(null);
                    }}
                    disabled={isAssigning}
                    className="flex-1 sm:flex-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAssignEO}
                    disabled={isAssigning}
                    className="flex-1 sm:flex-none gap-1.5"
                  >
                    {isAssigning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Confirm Assign & Dispatch Notice</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
