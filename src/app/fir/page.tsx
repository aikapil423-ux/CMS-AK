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
  Printer,
  AlertCircle,
  Edit3,
  Scale,
  SlidersHorizontal,
  Columns3,
  PlusCircle,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { firService } from "@/services/firService";
import { FIRItem, MainFIRStatus, getMainFIRStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { EmptyState, LoadingSkeleton } from "@/components/ui/state-views";
import { MOCK_ENQUIRY_OFFICERS } from "@/lib/mockData";
import { formatDate, formatDateTime } from "@/lib/utils";
import { FIRReceiptModal } from "@/components/fir/FIRReceiptModal";
import { TableManagerService, ManagedColumn } from "@/services/tableManagerService";

type FIRSortField =
  | "firNumber"
  | "firDate"
  | "complainantName"
  | "actsAndSections"
  | "status"
  | "assignedIoName"
  | "daysPending";

const FIR_STATUS_OPTIONS = [
  { key: "UNDER_INVESTIGATION", label: "Under Investigation" },
  { key: "PENDING_SUPERVISORY_REVIEW", label: "Pending Review" },
  { key: "CHARGESHEET_FILED", label: "Chargesheet Filed" },
  { key: "CLOSURE_REPORT_FILED", label: "Closure Filed" },
  { key: "UNTRACED", label: "Untraced" },
  { key: "CANCELLED", label: "Cancelled" },
];

const ALL_FIR_STATUS_KEYS = FIR_STATUS_OPTIONS.map((o) => o.key);

export default function FIRRegisterPage() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Status Filter with Dropdown and Checkboxes
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(ALL_FIR_STATUS_KEYS);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement | null>(null);

  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    underInvestigation: 0,
    chargesheetFiled: 0,
    closureFiled: 0,
    untracedCancelled: 0,
    pendingReview: 0,
  });

  const isAllSelected = selectedStatuses.length === ALL_FIR_STATUS_KEYS.length;

  const isSho = currentUser.role === "SHO" || currentUser.id === "usr_sho_1";
  const isSuperior =
    currentUser.role === "DSP_SUBDIV" ||
    currentUser.role === "SP_DISTRICT" ||
    currentUser.role === "SUPER_ADMIN";
  const isMhc = currentUser.role === "MHC_GD_INCHARGE" || currentUser.role === "DUTY_OFFICER";
  const isIo = currentUser.role === "ENQUIRY_OFFICER" || (!isSho && !isMhc && !isSuperior);
  const canRegisterFir = isSho || isMhc || isSuperior;

  // Column visibility
  const [columnDropdownOpen, setColumnDropdownOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement | null>(null);
  // Custom columns from Table Manager
  const [customCols, setCustomCols] = useState<ManagedColumn[]>(() => {
    return TableManagerService.getCustomColumns("fir");
  });

  useEffect(() => {
    const handleUpdate = () => {
      setCustomCols(TableManagerService.getCustomColumns("fir"));
    };
    window.addEventListener("cms_table_columns_changed", handleUpdate);
    return () => window.removeEventListener("cms_table_columns_changed", handleUpdate);
  }, []);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    firNumber: true,
    dateTime: true,
    complainant: true,
    actsPlace: true,
    status: true,
    assignedIo: true,
    daysPending: true,
    action: true,
  });

  // Column Reordering (Grab & Drag)
  type FIRColKey = string;
  const DEFAULT_FIR_COLUMN_ORDER: FIRColKey[] = [
    "firNumber",
    "dateTime",
    "complainant",
    "actsPlace",
    "status",
    "assignedIo",
    "daysPending",
  ];

  const FIR_COL_TO_SORT_FIELD: Record<string, FIRSortField> = {
    firNumber: "firNumber",
    dateTime: "firDate",
    complainant: "complainantName",
    actsPlace: "actsAndSections",
    status: "status",
    assignedIo: "assignedIoName",
    daysPending: "daysPending",
  };

  const FIR_COL_LABELS: Record<string, string> = {
    firNumber: "FIR No. & Reference",
    dateTime: "Date & Time",
    complainant: "Complainant / Informant",
    actsPlace: "Acts, Sections & Place",
    status: "Status",
    assignedIo: "Investigating Officer (IO)",
    daysPending: "Days",
  };

  const getColLabel = (colKey: string) => {
    if (FIR_COL_LABELS[colKey]) return FIR_COL_LABELS[colKey];
    const found = customCols.find((c) => c.key === colKey);
    return found ? found.label : colKey;
  };

  const [columnOrder, setColumnOrder] = useState<FIRColKey[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("cms_fir_column_order");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= DEFAULT_FIR_COLUMN_ORDER.length) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_FIR_COLUMN_ORDER;
  });

  // Keep columnOrder and visibleColumns in sync with custom columns
  useEffect(() => {
    if (customCols.length > 0) {
      setColumnOrder((prev) => {
        const activeKeys = customCols.filter((c) => c.isActive).map((c) => c.key);
        const missing = activeKeys.filter((k) => !prev.includes(k));
        if (missing.length > 0) {
          const next = [...prev, ...missing];
          try {
            localStorage.setItem("cms_fir_column_order", JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
      setVisibleColumns((prev) => {
        const next = { ...prev };
        let changed = false;
        customCols.forEach((c) => {
          if (next[c.key] === undefined) {
            next[c.key] = c.isActive;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [customCols]);

  const [draggedCol, setDraggedCol] = useState<FIRColKey | null>(null);
  const [dragOverCol, setDragOverCol] = useState<FIRColKey | null>(null);

  const handleColumnDrop = (targetCol: FIRColKey) => {
    if (!draggedCol || draggedCol === targetCol) return;
    setColumnOrder((prev) => {
      const next = [...prev];
      const srcIdx = next.indexOf(draggedCol);
      const tgtIdx = next.indexOf(targetCol);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      next.splice(srcIdx, 1);
      next.splice(tgtIdx, 0, draggedCol);
      try {
        localStorage.setItem("cms_fir_column_order", JSON.stringify(next));
      } catch {}
      return next;
    });
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const resetColumnOrder = () => {
    const fullOrder = [
      ...DEFAULT_FIR_COLUMN_ORDER,
      ...customCols.filter((c) => c.isActive).map((c) => c.key),
    ];
    setColumnOrder(fullOrder);
    try {
      localStorage.removeItem("cms_fir_column_order");
    } catch {}
  };

  // Column-specific search states (click column name to search, click arrow to sort)
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const [activeSearchCol, setActiveSearchCol] = useState<string | null>(null);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetColumns = () => {
    const base: Record<string, boolean> = {
      firNumber: true,
      dateTime: true,
      complainant: true,
      actsPlace: true,
      status: true,
      assignedIo: true,
      daysPending: true,
      action: true,
    };
    customCols.forEach((c) => {
      base[c.key] = c.isActive;
    });
    setVisibleColumns(base);
    resetColumnOrder();
  };

  // Master Filter Tabs
  const [masterFilterTab, setMasterFilterTab] = useState<string>("ALL");

  const handleMasterTabChange = (tab: string) => {
    setMasterFilterTab(tab);
    if (tab === "ALL") {
      setSelectedStatuses(ALL_FIR_STATUS_KEYS);
    } else if (tab === "UNDER_INVESTIGATION") {
      setSelectedStatuses(["UNDER_INVESTIGATION"]);
    } else if (tab === "PENDING_REVIEW") {
      setSelectedStatuses(["PENDING_SUPERVISORY_REVIEW"]);
    } else if (tab === "CHARGESHEET") {
      setSelectedStatuses(["CHARGESHEET_FILED"]);
    } else if (tab === "CLOSURE") {
      setSelectedStatuses(["CLOSURE_REPORT_FILED"]);
    } else if (tab === "UNTRACED_CANCELLED") {
      setSelectedStatuses(["UNTRACED", "CANCELLED"]);
    }
  };

  // Sorting
  const [sortField, setSortField] = useState<FIRSortField>("firDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Receipt Modal
  const [receiptFir, setReceiptFir] = useState<FIRItem | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // IO Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedFirForAssign, setSelectedFirForAssign] = useState<FIRItem | null>(null);
  const [selectedIoId, setSelectedIoId] = useState("");
  const [assignmentDirections, setAssignmentDirections] = useState("");
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);

  // Close dropdowns on outside click
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch FIRs
  const fetchFirs = () => {
    setLoading(true);
    try {
      const data = firService.getAllFirs();
      setFirs(data);

      const underInvestigation = data.filter((f) => f.status === "UNDER_INVESTIGATION").length;
      const chargesheetFiled = data.filter((f) => f.status === "CHARGESHEET_FILED").length;
      const closureFiled = data.filter((f) => f.status === "CLOSURE_REPORT_FILED").length;
      const untracedCancelled = data.filter((f) => f.status === "UNTRACED" || f.status === "CANCELLED").length;
      const pendingReview = data.filter((f) => f.status === "PENDING_SUPERVISORY_REVIEW").length;

      setStatusCounts({
        all: data.length,
        underInvestigation,
        chargesheetFiled,
        closureFiled,
        untracedCancelled,
        pendingReview,
      });
    } catch (err) {
      console.error("Failed to load FIRs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirs();
    const unsubscribe = firService.subscribe(() => {
      fetchFirs();
    });
    return unsubscribe;
  }, []);

  // Close column search input on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-column-search-box]")) {
        setActiveSearchCol(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered FIRs
  const filteredFirs = useMemo(() => {
    return firs.filter((fir) => {
      // Status Check
      if (!selectedStatuses.includes(fir.status)) {
        return false;
      }

      // IO Filter for logged in IO
      if (isIo && !isSho && !isSuperior && !isMhc) {
        const matchesIo =
          fir.assignedIoId === currentUser.id ||
          fir.assignedIoName?.toLowerCase().includes(currentUser.name.toLowerCase());
        if (!matchesIo) return false;
      }

      // Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesNo = fir.firNumber.toLowerCase().includes(query);
        const matchesCctns = fir.cctnsFirNumber?.toLowerCase().includes(query) ?? false;
        const matchesComplaint = fir.sourceComplaintNumber?.toLowerCase().includes(query) ?? false;
        const matchesComplainant = fir.complainantName.toLowerCase().includes(query);
        const matchesPhone = fir.complainantMobile?.includes(query) ?? false;
        const matchesActs = fir.actsAndSections.toLowerCase().includes(query);
        const matchesPlace = fir.incidentPlace.toLowerCase().includes(query);
        const matchesIoName = fir.assignedIoName?.toLowerCase().includes(query) ?? false;
        const matchesAccused = fir.accusedList?.some((acc) => acc.name.toLowerCase().includes(query)) ?? false;

        if (
          !matchesNo &&
          !matchesCctns &&
          !matchesComplaint &&
          !matchesComplainant &&
          !matchesPhone &&
          !matchesActs &&
          !matchesPlace &&
          !matchesIoName &&
          !matchesAccused
        ) {
          return false;
        }
      }

      // Column-specific search filters
      for (const [col, term] of Object.entries(columnSearch)) {
        if (!term || !term.trim()) continue;
        const q = term.toLowerCase().trim();
        if (col === "firNumber") {
          const match =
            fir.firNumber.toLowerCase().includes(q) ||
            (fir.cctnsFirNumber?.toLowerCase().includes(q) ?? false) ||
            (fir.sourceComplaintNumber?.toLowerCase().includes(q) ?? false);
          if (!match) return false;
        } else if (col === "firDate") {
          const formatted = formatDate(fir.firDate);
          const match =
            fir.firDate.includes(q) ||
            formatted.includes(q) ||
            (fir.firTime?.includes(q) ?? false);
          if (!match) return false;
        } else if (col === "complainantName") {
          const match =
            fir.complainantName.toLowerCase().includes(q) ||
            (fir.complainantMobile?.includes(q) ?? false);
          if (!match) return false;
        } else if (col === "actsAndSections") {
          const match =
            fir.actsAndSections.toLowerCase().includes(q) ||
            (fir.incidentPlace?.toLowerCase().includes(q) ?? false);
          if (!match) return false;
        } else if (col === "status") {
          const match =
            fir.status.toLowerCase().includes(q) ||
            (fir.mainStatus?.toLowerCase().includes(q) ?? false);
          if (!match) return false;
        } else if (col === "assignedIoName") {
          const match = fir.assignedIoName?.toLowerCase().includes(q) ?? false;
          if (!match) return false;
        } else if (col === "daysPending") {
          const match = String(fir.daysPending || 0).includes(q);
          if (!match) return false;
        }
      }

      return true;
    });
  }, [firs, selectedStatuses, searchQuery, columnSearch, isIo, isSho, isSuperior, isMhc, currentUser]);

  // Sorted FIRs
  const sortedFirs = useMemo(() => {
    return [...filteredFirs].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "daysPending") {
        aVal = a.daysPending || 0;
        bVal = b.daysPending || 0;
      }

      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";

      if (typeof aVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredFirs, sortField, sortDirection]);

  const handleSort = (field: FIRSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderColumnHeader = (colKey: FIRColKey) => {
    const field = (FIR_COL_TO_SORT_FIELD[colKey] || colKey) as any;
    const label = getColLabel(colKey);
    const isSearching = activeSearchCol === field;
    const filterValue = columnSearch[field] || "";
    const isSorted = sortField === field;

    return (
      <div className="space-y-1 relative" data-column-search-box="true">
        <div className="flex items-center justify-between gap-1">
          {/* Grab Handle + Column Name */}
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-0.5 rounded shrink-0 transition-colors"
              title="कॉलम पकड़कर इधर-उधर खींचें (Grab & drag to reorder position)"
            >
              <GripVertical className="w-3 h-3" />
            </span>

            {/* Column Name Click -> Toggles Search */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSearchCol(isSearching ? null : field);
              }}
              title="कॉलम में खोजने हेतु क्लिक करें (Click to Search Column)"
              className="flex items-center gap-1 font-bold text-slate-700 hover:text-blue-700 transition-colors text-left uppercase text-[11px] tracking-wider group cursor-pointer truncate"
            >
              <span className="truncate">{label}</span>
              {filterValue ? (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
              ) : (
                <Search className="w-3 h-3 text-slate-400 opacity-30 group-hover:opacity-100 group-hover:text-blue-600 transition-opacity shrink-0" />
              )}
            </button>
          </div>

          {/* Arrow Click -> Sorts */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSort(field);
            }}
            title={`सॉर्ट करें (Sort by ${label})`}
            className={`p-1 rounded hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0 ${
              isSorted ? "text-blue-700 bg-blue-50" : "text-slate-400 hover:text-slate-700"
            }`}
          >
            {isSorted ? (
              sortDirection === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 font-bold text-blue-700" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 font-bold text-blue-700" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Inline Search Input or Active Filter Badge */}
        {isSearching ? (
          <div
            onClick={(e) => e.stopPropagation()}
            className="pt-1 animate-in fade-in-50"
          >
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={filterValue}
                onChange={(e) =>
                  setColumnSearch((prev) => ({ ...prev, [field]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Escape" || e.key === "Enter") {
                    setActiveSearchCol(null);
                  }
                }}
                placeholder={`${label} खोजें...`}
                className="w-full text-[11px] px-2 py-1 bg-white border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-600 font-normal pr-5 text-slate-800 shadow-2xs normal-case"
              />
              {filterValue && (
                <button
                  type="button"
                  onClick={() =>
                    setColumnSearch((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    })
                  }
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        ) : filterValue ? (
          <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-mono border border-blue-200">
            <span className="truncate max-w-[90px] normal-case">&ldquo;{filterValue}&rdquo;</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setColumnSearch((prev) => {
                  const next = { ...prev };
                  delete next[field];
                  return next;
                });
              }}
              className="text-slate-400 hover:text-red-600 ml-auto"
            >
              &times;
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  const renderFirCell = (colKey: FIRColKey, fir: FIRItem) => {
    switch (colKey) {
      case "firNumber":
        return (
          <td key="firNumber" className="py-3 px-3.5 align-top">
            <div className="space-y-1">
              <Link
                href={`/fir/${fir.id}`}
                className="font-mono font-bold text-red-700 hover:text-red-900 hover:underline flex items-center gap-1 text-xs"
              >
                <span>{fir.firNumber}</span>
              </Link>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded">
                  {fir.cctnsFirNumber || "LOCAL"}
                </span>
                {fir.cctnsSyncStatus === "SYNCED" && (
                  <span className="text-emerald-600 font-bold" title="CCTNS Synced">
                    ✓
                  </span>
                )}
              </div>

              {fir.sourceComplaintNumber && (
                <div className="pt-0.5">
                  <Link
                    href={`/complaints/${fir.sourceComplaintId || ""}`}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 hover:bg-blue-100"
                    title="View Linked Complaint"
                  >
                    <span>Comp: {fir.sourceComplaintNumber}</span>
                  </Link>
                </div>
              )}
            </div>
          </td>
        );

      case "dateTime":
        return (
          <td key="dateTime" className="py-3 px-3 align-top whitespace-nowrap">
            <div className="text-slate-800 font-semibold">{formatDate(fir.firDate)}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{fir.firTime || "10:00"} hrs</span>
            </div>
          </td>
        );

      case "complainant":
        return (
          <td key="complainant" className="py-3 px-3 align-top">
            <div className="font-bold text-slate-900">{fir.complainantName}</div>
            {fir.complainantFatherSpouse && (
              <div className="text-[10px] text-slate-500">
                S/o {fir.complainantFatherSpouse}
              </div>
            )}
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{fir.complainantMobile || "—"}</span>
            </div>
          </td>
        );

      case "actsPlace":
        return (
          <td key="actsPlace" className="py-3 px-3 align-top max-w-xs">
            <div className="font-bold text-slate-800 text-xs">
              {fir.actsAndSections}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{fir.incidentPlace}</span>
            </div>
          </td>
        );

      case "status":
        return (
          <td key="status" className="py-3 px-3 align-top whitespace-nowrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                fir.status === "UNDER_INVESTIGATION"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : fir.status === "CHARGESHEET_FILED"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : fir.status === "CLOSURE_REPORT_FILED"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-slate-100 text-slate-800 border-slate-200"
              }`}
            >
              {fir.mainStatus || fir.status.replace(/_/g, " ")}
            </span>
          </td>
        );

      case "assignedIo":
        return (
          <td key="assignedIo" className="py-3 px-3 align-top">
            {fir.assignedIoName ? (
              <div>
                <div className="font-bold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>{fir.assignedIoName}</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {fir.assignedIoRank || "IO"} {fir.assignedIoBeltNumber ? `(${fir.assignedIoBeltNumber})` : ""}
                </div>
              </div>
            ) : (
              <span className="inline-block text-[11px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Not Assigned
              </span>
            )}
          </td>
        );

      case "daysPending":
        return (
          <td key="daysPending" className="py-3 px-2 align-top text-center">
            <span className="font-mono font-bold text-slate-700">
              {fir.daysPending || 0}d
            </span>
          </td>
        );

      default: {
        const customDef = customCols.find((c) => c.key === colKey);
        return (
          <td key={colKey} className="py-3 px-3.5 align-top text-xs text-slate-700">
            <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              {customDef?.defaultValue || "—"}
            </span>
          </td>
        );
      }
    }
  };

  const handleOpenAssign = (fir: FIRItem) => {
    setSelectedFirForAssign(fir);
    setSelectedIoId(fir.assignedIoId || "");
    setAssignmentDirections(fir.assignedDirections || "");
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssign = () => {
    if (!selectedFirForAssign || !selectedIoId) return;
    const selectedOfficer = MOCK_ENQUIRY_OFFICERS.find((eo) => eo.id === selectedIoId);
    if (!selectedOfficer) return;

    setAssignmentSubmitting(true);
    try {
      firService.assignIo(
        selectedFirForAssign.id,
        selectedOfficer.id,
        selectedOfficer.name,
        selectedOfficer.rank,
        assignmentDirections,
        currentUser.name
      );
      setIsAssignModalOpen(false);
      setSelectedFirForAssign(null);
    } catch (err) {
      console.error("Failed to assign IO:", err);
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
                FIR Register (First Information Report)
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Statutory First Information Register under Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/fir-workspace">
            <Button variant="outline" className="border-slate-300 text-slate-700 font-bold text-xs gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Investigation Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* Master Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => handleMasterTabChange("ALL")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
            masterFilterTab === "ALL"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All FIRs ({statusCounts.all})
        </button>
        <button
          onClick={() => handleMasterTabChange("UNDER_INVESTIGATION")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
            masterFilterTab === "UNDER_INVESTIGATION"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Under Investigation ({statusCounts.underInvestigation})
        </button>
        <button
          onClick={() => handleMasterTabChange("CHARGESHEET")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
            masterFilterTab === "CHARGESHEET"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Chargesheet Filed ({statusCounts.chargesheetFiled})
        </button>
        <button
          onClick={() => handleMasterTabChange("CLOSURE")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
            masterFilterTab === "CLOSURE"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Closure Filed ({statusCounts.closureFiled})
        </button>
        <button
          onClick={() => handleMasterTabChange("UNTRACED_CANCELLED")}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
            masterFilterTab === "UNTRACED_CANCELLED"
              ? "bg-slate-700 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Untraced / Cancelled ({statusCounts.untracedCancelled})
        </button>
      </div>

      {/* Search & Table Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search FIR No., Complainant, Accused, Section, Place, IO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Tools: Status Dropdown, Columns Dropdown, Refresh */}
        <div className="flex items-center gap-2">
          {/* Status Multi-select */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Status Filter</span>
              <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold">
                {selectedStatuses.length}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {statusDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs animate-in fade-in-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                  <span className="font-bold text-slate-800">Filter by Status</span>
                  <button
                    onClick={() =>
                      setSelectedStatuses(
                        isAllSelected ? [] : ALL_FIR_STATUS_KEYS
                      )
                    }
                    className="text-[11px] text-red-600 hover:underline font-medium"
                  >
                    {isAllSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="space-y-1 py-1 max-h-56 overflow-y-auto">
                  {FIR_STATUS_OPTIONS.map((opt) => {
                    const isChecked = selectedStatuses.includes(opt.key);
                    return (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedStatuses(selectedStatuses.filter((k) => k !== opt.key));
                            } else {
                              setSelectedStatuses([...selectedStatuses, opt.key]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Columns Selector */}
          <div className="relative" ref={columnDropdownRef}>
            <button
              onClick={() => setColumnDropdownOpen(!columnDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Configure Table Columns"
            >
              <Columns3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {columnDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs animate-in fade-in-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                  <span className="font-bold text-slate-800">Toggle Columns</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={resetColumnOrder}
                      className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline font-medium cursor-pointer"
                      title="कॉलम क्रम रीसेट करें"
                    >
                      Reset Order
                    </button>
                    <button
                      onClick={resetColumns}
                      className="text-[11px] text-red-600 hover:underline font-medium cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
                <div className="space-y-1 py-1">
                  {Object.entries({
                    firNumber: "FIR Number",
                    dateTime: "Date & Time",
                    complainant: "Complainant",
                    actsPlace: "Acts & Occurrence",
                    status: "Status",
                    assignedIo: "Investigating Officer",
                    daysPending: "Days in Progress",
                    action: "Actions",
                  }).map(([key, label]) => {
                    const isChecked = visibleColumns[key as keyof typeof visibleColumns];
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                          className="w-3.5 h-3.5 rounded text-red-600 focus:ring-red-500 border-slate-300"
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}

                  {customCols.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase px-1">
                        Custom Columns (Table Manager)
                      </span>
                      <div className="space-y-1 mt-1">
                        {customCols.map((c) => {
                          const isChecked = visibleColumns[c.key] ?? c.isActive;
                          return (
                            <label
                              key={c.key}
                              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-indigo-50/50 cursor-pointer text-slate-700 select-none text-[11px]"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleColumn(c.key)}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="truncate">{c.label}</span>
                              <span className="text-[9px] font-semibold bg-indigo-100 text-indigo-700 px-1 rounded ml-auto">
                                Custom
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-1 px-1">
                  <div className="text-[10px] text-slate-500">
                    💡 <em>कॉलम हेडर को पकड़कर (Grab) आगे-पीछे सेट कर सकते हैं।</em>
                  </div>
                  <Link
                    href="/settings?tab=table-manager"
                    className="flex items-center justify-between text-[11px] font-bold text-indigo-600 hover:text-indigo-800 pt-1"
                  >
                    <span>+ Add/Manage Columns</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFirs}
            className="border-slate-200 text-slate-700 shadow-2xs"
            title="Refresh FIR Register"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Main FIR Table */}
      <Card className="border-slate-200 shadow-xs overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                {columnOrder.map((col) => {
                  if (!visibleColumns[col]) return null;
                  const isDragging = draggedCol === col;
                  const isOver = dragOverCol === col;

                  return (
                    <th
                      key={col}
                      draggable={!activeSearchCol}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", col);
                        setDraggedCol(col);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDragEnter={() => {
                        if (draggedCol && draggedCol !== col) {
                          setDragOverCol(col);
                        }
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget === e.target) {
                          setDragOverCol(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleColumnDrop(col);
                      }}
                      onDragEnd={() => {
                        setDraggedCol(null);
                        setDragOverCol(null);
                      }}
                      className={`py-2.5 px-3 transition-all select-none cursor-grab active:cursor-grabbing ${
                        col === "daysPending" ? "text-center" : ""
                      } ${
                        isDragging ? "opacity-30 bg-slate-200" : ""
                      } ${
                        isOver ? "border-l-4 border-l-blue-600 bg-blue-50/80 shadow-inner" : ""
                      }`}
                    >
                      {renderColumnHeader(col)}
                    </th>
                  );
                })}

                {visibleColumns.action && (
                  <th className="py-2.5 px-3 text-right align-top pt-3">Actions</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <LoadingSkeleton count={3} />
                  </td>
                </tr>
              ) : sortedFirs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      title="No FIRs Found"
                      description={
                        searchQuery
                          ? "No FIR records matched your search terms."
                          : "No First Information Reports in the selected category."
                      }
                    />
                  </td>
                </tr>
              ) : (
                sortedFirs.map((fir) => {
                  return (
                    <tr
                      key={fir.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {columnOrder.map((col) => {
                        if (!visibleColumns[col]) return null;
                        return renderFirCell(col, fir);
                      })}

                      {/* Actions */}
                      {visibleColumns.action && (
                        <td className="py-3 px-3 align-top text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Profile */}
                            <Link href={`/fir/${fir.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[11px] border-slate-200 text-slate-700 hover:text-red-700"
                                title="Open Complete FIR Dossier"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                View
                              </Button>
                            </Link>

                            {/* Print / Statutory Copy */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReceiptFir(fir);
                                setIsReceiptOpen(true);
                              }}
                              className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:text-blue-600"
                              title="Print Statutory FIR Copy"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>

                            {/* Assign / Reassign IO (SHO / Superior only) */}
                            {canRegisterFir && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAssign(fir)}
                                className="h-7 w-7 p-0 border-slate-200 text-slate-600 hover:text-amber-700"
                                title="Assign or Re-assign IO"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Statutory Receipt Print Modal */}
      {isReceiptOpen && receiptFir && (
        <FIRReceiptModal
          fir={receiptFir}
          isOpen={isReceiptOpen}
          onClose={() => {
            setIsReceiptOpen(false);
            setReceiptFir(null);
          }}
        />
      )}

      {/* Assign IO Modal */}
      {isAssignModalOpen && selectedFirForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Assign Investigating Officer (IO)</h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500">
                  FIR Number
                </label>
                <p className="font-mono font-bold text-red-900 text-sm">
                  {selectedFirForAssign.firNumber}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {selectedFirForAssign.actsAndSections}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Select Investigating Officer (IO) *
                </label>
                <select
                  value={selectedIoId}
                  onChange={(e) => setSelectedIoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="">-- Choose Officer --</option>
                  {MOCK_ENQUIRY_OFFICERS.map((officer) => (
                    <option key={officer.id} value={officer.id}>
                      {officer.name} ({officer.rank} • PNO: {officer.pno})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-slate-600 block mb-1">
                  Supervisory Directions (SHO Order)
                </label>
                <textarea
                  rows={3}
                  value={assignmentDirections}
                  onChange={(e) => setAssignmentDirections(e.target.value)}
                  placeholder="E.g. Visit spot immediately, examine CCTV footage, record statements under BNSS 180, and file Zimni within 24 hours."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAssign}
                  disabled={!selectedIoId || assignmentSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {assignmentSubmitting ? "Assigning..." : "Confirm IO Assignment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
