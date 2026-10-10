"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Users,
  Shield,
  Phone,
  Mail,
  Calendar,
  Search,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Car,
  Bike,
  FileText,
  BadgeAlert,
  Clock,
  Radio,
  X,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  StationStaffMember,
  StaffRoleCategory,
  STAFF_CATEGORY_CONFIG,
} from "@/types/stationStaff";
import { stationStaffService } from "@/services/stationStaffService";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";
import { toDDMMYYYY } from "@/lib/gdDateTime";

const CATEGORY_TABS: { code: StaffRoleCategory | "ALL"; label: string; labelHi: string }[] = [
  { code: "ALL", label: "All Staff", labelHi: "समस्त स्टाफ" },
  { code: "SHO", label: "SHO", labelHi: "थाना प्रभारी" },
  { code: "EO_IO", label: "EO / IO Staff", labelHi: "जांच / अनुसंधान" },
  { code: "GENERAL", label: "General Staff", labelHi: "सामान्य स्टाफ" },
  { code: "ERV", label: "ERV Staff (Dial 112)", labelHi: "ई.आर.वी. (डायल 112)" },
  { code: "RIDER", label: "Rider Staff", labelHi: "राइडर पेट्रोलिंग" },
  { code: "MHC", label: "MHC Staff", labelHi: "मुहर्रिर / मालखाना" },
];

const RANK_OPTIONS = [
  "Inspector",
  "Sub-Inspector",
  "Assistant Sub-Inspector",
  "Head Constable",
  "Constable",
  "Lady Constable",
  "Constable (Pilot)",
  "Home Guard",
];

const SHIFT_OPTIONS = [
  "Round the Clock (24x7)",
  "Day Shift (08:00 - 20:00)",
  "Night Shift (20:00 - 08:00)",
  "Shift-A (08:00 - 16:00)",
  "Shift-B (16:00 - 00:00)",
  "Shift-C (00:00 - 08:00)",
  "Morning Beat (06:00 - 14:00)",
  "Evening Beat (14:00 - 22:00)",
  "General Duty (09:00 - 18:00)",
];

const STATUS_OPTIONS: { value: StationStaffMember["status"]; label: string; color: string }[] = [
  { value: "ON_DUTY", label: "On Duty (हाजिर ड्यूटी)", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: "ACTIVE", label: "Active (तैनात)", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "ON_LEAVE", label: "On Leave (अवकाश पर)", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "TRAINING", label: "Training (प्रशिक्षण)", color: "bg-purple-100 text-purple-800 border-purple-300" },
];

export default function StationProfilePage() {
  const { currentUser } = useAuth();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<"overview" | "staff">("overview");

  // Staff Management state
  const [staffList, setStaffList] = useState<StationStaffMember[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StaffRoleCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StationStaffMember | null>(null);
  const [deleteConfirmStaff, setDeleteConfirmStaff] = useState<StationStaffMember | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<StationStaffMember, "id">>({
    name: "",
    rank: "Constable",
    category: "GENERAL",
    pno: "",
    beltNumber: "",
    mobile: "",
    email: "",
    assignedDuty: "",
    vehicleOrBeatNo: "",
    shift: "Day Shift (08:00 - 20:00)",
    postingDate: new Date().toISOString().slice(0, 10),
    status: "ON_DUTY",
    stationName: currentUser.stationName || "Police Station Thanesar City",
  });

  // Load staff on mount
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = () => {
    const list = stationStaffService.getStaffMembers();
    setStaffList(list);
  };

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Open Add modal
  const handleOpenAddModal = (defaultCategory?: StaffRoleCategory) => {
    setEditingStaff(null);
    setFormData({
      name: "",
      rank: defaultCategory === "SHO" ? "Inspector" : defaultCategory === "EO_IO" ? "Sub-Inspector" : "Constable",
      category: defaultCategory && defaultCategory !== ("ALL" as any) ? defaultCategory : "GENERAL",
      pno: "",
      beltNumber: "",
      mobile: "",
      email: "",
      assignedDuty: "",
      vehicleOrBeatNo: "",
      shift: "Day Shift (08:00 - 20:00)",
      postingDate: new Date().toISOString().slice(0, 10),
      status: "ON_DUTY",
      stationName: currentUser.stationName || "Police Station Thanesar City",
    });
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEditModal = (staff: StationStaffMember) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      rank: staff.rank,
      category: staff.category,
      pno: staff.pno,
      beltNumber: staff.beltNumber,
      mobile: staff.mobile,
      email: staff.email || "",
      assignedDuty: staff.assignedDuty,
      vehicleOrBeatNo: staff.vehicleOrBeatNo || "",
      shift: staff.shift,
      postingDate: staff.postingDate || new Date().toISOString().slice(0, 10),
      status: staff.status,
      stationName: staff.stationName,
    });
    setIsModalOpen(true);
  };

  // Save staff handler
  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter staff member name.");
      return;
    }
    if (!formData.pno.trim()) {
      alert("Please enter PNO number.");
      return;
    }

    if (editingStaff) {
      stationStaffService.saveStaffMember({
        ...formData,
        id: editingStaff.id,
      });
      showNotification(`Staff member "${formData.name}" updated successfully.`);
    } else {
      stationStaffService.saveStaffMember(formData);
      showNotification(`Staff member "${formData.name}" added successfully.`);
    }

    setIsModalOpen(false);
    setEditingStaff(null);
    loadStaff();
  };

  // Delete staff handler
  const handleDeleteStaff = () => {
    if (!deleteConfirmStaff) return;
    stationStaffService.deleteStaffMember(deleteConfirmStaff.id);
    showNotification(`Staff member "${deleteConfirmStaff.name}" has been removed.`);
    setDeleteConfirmStaff(null);
    loadStaff();
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset staff data to standard station roster?")) {
      stationStaffService.resetToDefault();
      loadStaff();
      showNotification("Staff roster restored to official default.");
    }
  };

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: staffList.length };
    for (const item of staffList) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [staffList]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      // Category filter
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchRank = item.rank.toLowerCase().includes(q);
        const matchPno = item.pno.toLowerCase().includes(q);
        const matchBelt = item.beltNumber.toLowerCase().includes(q);
        const matchDuty = item.assignedDuty.toLowerCase().includes(q);
        const matchVehicle = (item.vehicleOrBeatNo || "").toLowerCase().includes(q);
        const matchPhone = item.mobile.includes(q);
        return matchName || matchRank || matchPno || matchBelt || matchDuty || matchVehicle || matchPhone;
      }
      return true;
    });
  }, [staffList, selectedCategory, statusFilter, searchQuery]);

  // Overall Stats
  const stats = useMemo(() => {
    const onDuty = staffList.filter((s) => s.status === "ON_DUTY").length;
    const eoIoCount = staffList.filter((s) => s.category === "EO_IO").length;
    const ervRiderCount = staffList.filter((s) => s.category === "ERV" || s.category === "RIDER").length;
    const mhcCount = staffList.filter((s) => s.category === "MHC").length;
    return {
      total: staffList.length,
      onDuty,
      eoIoCount,
      ervRiderCount,
      mhcCount,
    };
  }, [staffList]);

  // Helper icon for category
  const getCategoryIcon = (category: StaffRoleCategory) => {
    switch (category) {
      case "SHO":
        return <Shield className="w-4 h-4 text-red-600" />;
      case "EO_IO":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "ERV":
        return <Car className="w-4 h-4 text-amber-600" />;
      case "RIDER":
        return <Bike className="w-4 h-4 text-emerald-600" />;
      case "MHC":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case "GENERAL":
      default:
        return <Users className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#0b192c] text-white px-4 py-3 rounded-lg shadow-xl text-xs sm:text-sm border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Administrative Unit & Police Force Roster
          </span>
          <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
            {currentUser.stationName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kurukshetra Police District • Ambala Range • Haryana Police
          </p>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1 shadow-inner self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${
              activeTab === "overview"
                ? "bg-white text-[#0b192c] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4 text-[#b8001f]" />
            Station Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("staff")}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${
              activeTab === "staff"
                ? "bg-[#0b192c] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            Staff Management
            <span
              className={`ml-1 text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === "staff" ? "bg-[#b8001f] text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {staffList.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: STATION OVERVIEW */}
      {/* ============================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-[#0b192c]">
                  <Building2 className="w-4 h-4 text-[#0b192c]" />
                  Police Station Particulars (थाना विवरण)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm pt-4">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Station Code:</span>
                  <span className="font-mono font-bold text-slate-800">{currentUser.stationCode}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Station House Officer (SHO):</span>
                  <span className="font-semibold text-slate-900">
                    {staffList.find((s) => s.category === "SHO")?.name || "Inspector Rajesh Kumar"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Supervisory Sub-Division:</span>
                  <span className="font-semibold text-slate-800">Thanesar Sub-Division (DSP)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Control Room Phone:</span>
                  <span className="font-mono font-bold text-slate-800">01744-220100</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Emergency Helpline:</span>
                  <span className="font-mono font-bold text-[#b8001f] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    Dial 112 (ERV Integrated)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-3">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-[#0b192c]">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  Operational Strength & Status (कार्यबल स्थिति)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs sm:text-sm pt-4">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Total Registered Staff:</span>
                  <span className="font-semibold text-slate-800">
                    {staffList.length} Officers & Personnel
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Investigating Officers (EO / IO):</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {stats.eoIoCount} Active IOs
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Dial 112 ERV & Patrolling Riders:</span>
                  <span className="font-semibold text-slate-800">
                    {staffList.filter((s) => s.category === "ERV").length} ERV Staff •{" "}
                    {staffList.filter((s) => s.category === "RIDER").length} Riders
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Roznamcha / MHC Desk:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Continuous 24-hr Active
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Banner to Staff Management */}
          <div className="bg-gradient-to-r from-[#0b192c] to-[#1e3e62] rounded-xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Users className="w-4 h-4" />
                <span>Station Duty & Personnel Directory</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Manage Station Personnel, Postings & Roster
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Maintain and update postings for Station House Officer (SHO), Enquiry/Investigating Officers (EO/IO), ERV Dial 112 pilots, Beat Riders, Moharrir Head Constable (MHC), and General Sentry staff.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className="px-4 py-2 bg-[#b8001f] hover:bg-[#d60024] text-white font-bold text-xs sm:text-sm rounded-lg shadow transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Users className="w-4 h-4" />
              Open Staff Management
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STAFF MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === "staff" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Staff</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-[#0b192c] mt-1">{stats.total}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                {stats.onDuty} Active On Duty
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">EO / IO Officers</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-700 mt-1">{stats.eoIoCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Investigating Wing</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">ERV & Riders</span>
                <Car className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700 mt-1">{stats.ervRiderCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Dial 112 & Beat Patrol</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">MHC & Records</span>
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-black text-purple-700 mt-1">{stats.mhcCount}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Malkhana & Roznamcha</div>
            </div>
          </div>

          {/* Sub-Tabs / Category Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2.5">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#b8001f]" />
                Staff Categories / वर्ग चयन
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  title="Reset to default demo roster"
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedCategory !== "ALL" ? selectedCategory : undefined)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b8001f] hover:bg-[#900018] text-white rounded-lg text-xs font-bold shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Staff Member
                </button>
              </div>
            </div>

            {/* Category Sub-Tabs Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = selectedCategory === tab.code;
                const count = categoryCounts[tab.code] || 0;
                return (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setSelectedCategory(tab.code)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-[#0b192c] text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-amber-400 text-slate-900" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Status Bar */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, PNO, Belt No, Duty, Vehicle or Mobile..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0b192c] bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0b192c]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ON_DUTY">On Duty (हाजिर)</option>
                  <option value="ACTIVE">Active (तैनात)</option>
                  <option value="ON_LEAVE">On Leave (अवकाश)</option>
                  <option value="TRAINING">Training (प्रशिक्षण)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Staff Members List */}
          {filteredStaff.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
              <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No staff members found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try modifying your search or category filter, or add a new staff member.
              </p>
              <button
                type="button"
                onClick={() => handleOpenAddModal(selectedCategory !== "ALL" ? selectedCategory : undefined)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b8001f] text-white rounded-lg text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Staff Member
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => {
                const catConfig = STAFF_CATEGORY_CONFIG[staff.category] || STAFF_CATEGORY_CONFIG.GENERAL;
                const statusObj = STATUS_OPTIONS.find((s) => s.value === staff.status) || STATUS_OPTIONS[0];

                return (
                  <div
                    key={staff.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${catConfig.borderColor}`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${catConfig.iconBg}`}>
                            {getCategoryIcon(staff.category)}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                              {staff.rank}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                              {staff.name}
                            </h3>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catConfig.badgeColor}`}
                        >
                          {catConfig.code}
                        </span>
                      </div>

                      {/* Identifiers (PNO & Belt) */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">PNO No:</span>
                          <span className="font-mono font-bold text-slate-800">{staff.pno}</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-medium">Belt No:</span>
                          <span className="font-mono font-bold text-slate-800">{staff.beltNumber}</span>
                        </div>
                      </div>

                      {/* Duty / Assignment */}
                      <div className="mt-2.5 text-xs">
                        <span className="text-[10px] text-slate-400 block font-medium">Assigned Duty:</span>
                        <p className="text-slate-800 font-semibold line-clamp-2">{staff.assignedDuty}</p>
                      </div>

                      {/* Vehicle / Beat No if present */}
                      {staff.vehicleOrBeatNo && (
                        <div className="mt-2 text-xs flex items-center gap-1.5 text-indigo-700 bg-indigo-50/70 p-1.5 rounded border border-indigo-100 font-medium">
                          {staff.category === "ERV" ? (
                            <Car className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Bike className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{staff.vehicleOrBeatNo}</span>
                        </div>
                      )}

                      {/* Shift & Contact Details */}
                      <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{staff.shift}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono font-medium">{staff.mobile}</span>
                        </div>
                        {staff.postingDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-slate-500">
                              Posting: <strong className="text-slate-700">{toDDMMYYYY(staff.postingDate)}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status & Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusObj.color}`}
                      >
                        {statusObj.label}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(staff)}
                          title="Edit staff details"
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmStaff(staff)}
                          title="Delete staff member"
                          className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT MODAL */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-[#0b192c] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base">
                  {editingStaff ? "Edit Staff Member / स्टाफ विवरण संपादित करें" : "Add New Staff Member / नया स्टाफ दर्ज करें"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStaff} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Member Name (नाम) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Inspector Rajesh Kumar / Const. Amit"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none"
                  />
                </div>

                {/* Rank */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rank / Designation (पद) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none bg-white"
                  >
                    {RANK_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category (The 6 required categories) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Staff Category (वर्ग) <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as StaffRoleCategory })
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none bg-white"
                  >
                    <option value="SHO">SHO (Station House Officer / थाना प्रभारी)</option>
                    <option value="EO_IO">EO / IO Staff (जांच व अनुसंधान अधिकारी)</option>
                    <option value="GENERAL">General Staff (सामान्य / संतरी / कोर्ट डाक)</option>
                    <option value="ERV">ERV Staff (डायल 112 / First Responder)</option>
                    <option value="RIDER">Rider Staff (मोटरसाइकिल बीट पेट्रोलिंग)</option>
                    <option value="MHC">MHC Staff (मुहर्रिर हेड कांस्टेबल / मालखाना)</option>
                  </select>
                </div>

                {/* PNO Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PNO Number (पी.एन.ओ. संख्या) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pno}
                    onChange={(e) => setFormData({ ...formData, pno: e.target.value })}
                    placeholder="e.g. 12040051"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none font-mono"
                  />
                </div>

                {/* Belt Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Belt Number (बेल्ट संख्या) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.beltNumber}
                    onChange={(e) => setFormData({ ...formData, beltNumber: e.target.value })}
                    placeholder="e.g. 101/KKR or 245/KKR"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none font-mono"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (मोबाइल नं.) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="e.g. 9812000001"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none font-mono"
                  />
                </div>

                {/* Duty Shift */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Shift (ड्यूटी शिफ्ट)
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none bg-white"
                  >
                    {SHIFT_OPTIONS.map((sh) => (
                      <option key={sh} value={sh}>
                        {sh}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vehicle or Beat No (optional, but essential for ERV / Rider) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Vehicle / Beat Details (वाहन नं. / बीट संख्या)
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleOrBeatNo || ""}
                    onChange={(e) => setFormData({ ...formData, vehicleOrBeatNo: e.target.value })}
                    placeholder="e.g. ERV-01 (HR-07-G-1121) or Rider Beat #1 (Main Market)"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none"
                  />
                </div>

                {/* Assigned Duty */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specific Duty / Responsibilities (विशिष्ट कार्य / जिम्मेदारी) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.assignedDuty}
                    onChange={(e) => setFormData({ ...formData, assignedDuty: e.target.value })}
                    placeholder="e.g. Senior IO - Special Investigation Cell / Malkhana In-charge"
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none"
                  />
                </div>

                {/* Posting Date using Universal DatePickerDDMMYYYY */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Station Posting Date (तैनाती तिथि) - DD/MM/YYYY
                  </label>
                  <DatePickerDDMMYYYY
                    value={formData.postingDate}
                    onValueChange={(val) => setFormData({ ...formData, postingDate: val })}
                    className="w-full text-xs sm:text-sm"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status (वर्तमान स्थिति)
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as StationStaffMember["status"],
                      })
                    }
                    className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0b192c] focus:outline-none bg-white"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b8001f] hover:bg-[#900018] text-white rounded-lg text-xs sm:text-sm font-bold shadow transition"
                >
                  {editingStaff ? "Save Changes" : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================== */}
      {deleteConfirmStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden">
            <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Delete Staff Member / स्टाफ हटाएं
                </h3>
                <p className="text-xs text-slate-500">
                  This action will remove the personnel record from the station roster.
                </p>
              </div>
            </div>

            <div className="p-4 space-y-2 text-xs text-slate-700">
              <p>Are you sure you want to remove this staff member?</p>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <strong>Name:</strong> {deleteConfirmStaff.name} ({deleteConfirmStaff.rank})
                </div>
                <div>
                  <strong>PNO:</strong> {deleteConfirmStaff.pno} • <strong>Belt:</strong> {deleteConfirmStaff.beltNumber}
                </div>
                <div>
                  <strong>Category:</strong> {deleteConfirmStaff.category}
                </div>
                <div>
                  <strong>Duty:</strong> {deleteConfirmStaff.assignedDuty}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-3.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setDeleteConfirmStaff(null)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStaff}
                className="px-3.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
