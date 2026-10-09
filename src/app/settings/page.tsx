"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  ListFilter,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
  Layers,
  Sparkles,
  Info,
  Check,
  X,
  FileText,
  BookOpen,
  UserCheck,
  Tag,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownManagerService,
  DropdownCategory,
  DropdownItem,
  DROPDOWN_CATEGORIES,
} from "@/services/dropdownManagerService";

type SettingsTab = "dropdowns" | "station" | "system";

const COLOR_OPTIONS = [
  { label: "Blue", value: "bg-blue-100 text-blue-800 border-blue-200" },
  { label: "Emerald", value: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { label: "Amber", value: "bg-amber-100 text-amber-800 border-amber-200" },
  { label: "Red", value: "bg-red-100 text-red-800 border-red-200" },
  { label: "Purple", value: "bg-purple-100 text-purple-800 border-purple-200" },
  { label: "Pink", value: "bg-pink-100 text-pink-800 border-pink-200" },
  { label: "Indigo", value: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { label: "Slate", value: "bg-slate-100 text-slate-800 border-slate-200" },
  { label: "Cyan", value: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  { label: "Orange", value: "bg-orange-100 text-orange-800 border-orange-200" },
];

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as SettingsTab) || "station";
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("complaint_categories");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("All");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [items, setItems] = useState<DropdownItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Item being edited or deleted
  const [activeItem, setActiveItem] = useState<DropdownItem | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formBadgeColor, setFormBadgeColor] = useState(COLOR_OPTIONS[0].value);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Load items when category changes
  const loadCategoryItems = () => {
    const loaded = DropdownManagerService.getItems(selectedCategoryKey);
    setItems(loaded);
  };

  useEffect(() => {
    loadCategoryItems();
  }, [selectedCategoryKey]);

  // Listen to cross-component dropdown updates
  useEffect(() => {
    const handleUpdate = () => {
      loadCategoryItems();
    };
    window.addEventListener("cms-dropdowns-updated", handleUpdate);
    return () => {
      window.removeEventListener("cms-dropdowns-updated", handleUpdate);
    };
  }, [selectedCategoryKey]);

  // Selected Category Info
  const currentCategory = useMemo(() => {
    return DROPDOWN_CATEGORIES.find((c) => c.key === selectedCategoryKey) || DROPDOWN_CATEGORIES[0];
  }, [selectedCategoryKey]);

  // Filtered Categories based on module and category search
  const filteredCategories = useMemo(() => {
    return DROPDOWN_CATEGORIES.filter((cat) => {
      const matchesModule = selectedModuleFilter === "All" || cat.module === selectedModuleFilter;
      if (!matchesModule) return false;
      if (!categorySearchQuery.trim()) return true;
      const q = categorySearchQuery.toLowerCase().trim();
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.usageLocation.toLowerCase().includes(q)
      );
    });
  }, [selectedModuleFilter, categorySearchQuery]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormCode("");
    setFormLabel("");
    setFormDescription("");
    setFormBadgeColor(COLOR_OPTIONS[0].value);
    setFormIsActive(true);
    setFormError(null);
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: DropdownItem) => {
    setActiveItem(item);
    setFormCode(item.code);
    setFormLabel(item.label);
    setFormDescription(item.description || "");
    setFormBadgeColor(item.badgeColor || COLOR_OPTIONS[0].value);
    setFormIsActive(item.isActive);
    setFormError(null);
    setEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (item: DropdownItem) => {
    setActiveItem(item);
    setDeleteConfirmOpen(true);
  };

  // Save New Item
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formLabel.trim()) {
      setFormError("Option Label is required.");
      return;
    }

    const codeToUse = formCode.trim()
      ? formCode.trim().toUpperCase().replace(/\s+/g, "_")
      : formLabel.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");

    try {
      DropdownManagerService.addItem(selectedCategoryKey, {
        code: codeToUse,
        label: formLabel.trim(),
        description: formDescription.trim() || undefined,
        badgeColor: currentCategory.supportsColors ? formBadgeColor : undefined,
        isActive: formIsActive,
      });

      setAddModalOpen(false);
      loadCategoryItems();
      showToast(`Added option "${formLabel.trim()}" successfully!`);
    } catch (err: any) {
      setFormError(err.message || "Failed to add dropdown option.");
    }
  };

  // Save Edit Item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setFormError(null);

    if (!formLabel.trim()) {
      setFormError("Option Label is required.");
      return;
    }

    try {
      DropdownManagerService.updateItem(selectedCategoryKey, activeItem.id, {
        code: formCode.trim().toUpperCase(),
        label: formLabel.trim(),
        description: formDescription.trim() || undefined,
        badgeColor: currentCategory.supportsColors ? formBadgeColor : undefined,
        isActive: formIsActive,
      });

      setEditModalOpen(false);
      setActiveItem(null);
      loadCategoryItems();
      showToast(`Updated option "${formLabel.trim()}" successfully!`);
    } catch (err: any) {
      setFormError(err.message || "Failed to update dropdown option.");
    }
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!activeItem) return;
    try {
      DropdownManagerService.deleteItem(selectedCategoryKey, activeItem.id);
      setDeleteConfirmOpen(false);
      const deletedName = activeItem.label;
      setActiveItem(null);
      loadCategoryItems();
      showToast(`Deleted option "${deletedName}".`);
    } catch (err: any) {
      alert("Failed to delete option: " + err.message);
    }
  };

  // Toggle Active/Inactive
  const handleToggleStatus = (item: DropdownItem) => {
    DropdownManagerService.toggleItemStatus(selectedCategoryKey, item.id);
    loadCategoryItems();
    showToast(`Option "${item.label}" is now ${!item.isActive ? "Active" : "Inactive"}.`);
  };

  // Reset Category
  const handleConfirmReset = () => {
    DropdownManagerService.resetCategoryToDefault(selectedCategoryKey);
    setResetConfirmOpen(false);
    loadCategoryItems();
    showToast(`Category "${currentCategory.name}" restored to system defaults.`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0b192c] text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Management &amp; System Settings
              </h1>
              <p className="text-xs text-slate-500">
                Configure dropdowns, station preferences, and organization masters for Haryana Police CMS
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Station: <strong>{currentUser.stationName}</strong>
          </span>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("station")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "station"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Station &amp; Organization</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dropdowns")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "dropdowns"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-700 bg-blue-50/70 border border-blue-200 hover:bg-blue-100"
          }`}
        >
          <ListFilter className="w-4 h-4 text-blue-500 group-hover:text-blue-600" />
          <span className="font-extrabold">Dropdown Manager</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "dropdowns" ? "bg-white/20 text-white" : "bg-blue-200 text-blue-900 font-bold"
            }`}
          >
            {DROPDOWN_CATEGORIES.length} Categories
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "system"
              ? "bg-[#0b192c] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>System &amp; Backup</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DROPDOWN MANAGER (Central Feature) */}
      {/* ======================================================== */}
      {activeTab === "dropdowns" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Dropdown Categories Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Dropdown
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {filteredCategories.length} / {DROPDOWN_CATEGORIES.length} Dropdowns
                </span>
              </div>

              {/* Module Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {(["All", "Complaints", "FIR", "Roznamcha (GD)", "Common"] as const).map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModuleFilter(mod)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${
                      selectedModuleFilter === mod
                        ? "bg-[#0b192c] text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>

              {/* Category Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter dropdown category..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-slate-50/60"
                />
                {categorySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCategorySearchQuery("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => {
                    const isSelected = cat.key === selectedCategoryKey;
                    const catCount = DropdownManagerService.getItems(cat.key).length;
                    const moduleColor =
                      cat.module === "Complaints"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : cat.module === "FIR"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : cat.module === "Roznamcha (GD)"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryKey(cat.key);
                          setSearchQuery("");
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                          isSelected
                            ? "bg-blue-50 border-blue-300 text-blue-900 shadow-2xs"
                            : "bg-white hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{cat.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${moduleColor}`}>
                              {cat.module}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                isSelected ? "bg-blue-200 text-blue-900" : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {catCount}
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{cat.description}</p>
                        <span className="text-[10px] text-blue-600/80 font-medium block mt-1">
                          Used in: {cat.usageLocation}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No dropdowns match &quot;{categorySearchQuery}&quot;.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Active Category Items List & CRUD */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="border-slate-200 shadow-xs bg-white">
              <CardContent className="p-5 space-y-5">
                {/* Category Header & Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        {currentCategory.name}
                      </h2>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                          currentCategory.module === "Complaints"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : currentCategory.module === "FIR"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : currentCategory.module === "Roznamcha (GD)"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {currentCategory.module}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-blue-100 text-blue-800 font-semibold">
                        {items.length} Options
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {currentCategory.description}
                    </p>
                    <p className="text-[10px] text-blue-600/80 font-medium mt-0.5">
                      Used in: {currentCategory.usageLocation}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setResetConfirmOpen(true)}
                      className="gap-1.5 text-xs text-slate-600 hover:text-red-700 hover:bg-red-50"
                      title="Reset this category to built-in system defaults"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleOpenAdd}
                      className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Option</span>
                    </Button>
                  </div>
                </div>

                {/* Search Bar & Quick Stats */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search in ${currentCategory.name}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-auto font-medium">
                    <span>
                      Active:{" "}
                      <strong className="text-emerald-700 font-bold">
                        {items.filter((i) => i.isActive).length}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Disabled:{" "}
                      <strong className="text-slate-400 font-bold">
                        {items.filter((i) => !i.isActive).length}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Table of Dropdown Items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Option Label</th>
                          <th className="py-2.5 px-3">System Code</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                              {searchQuery ? "No matching dropdown options found." : "No options defined yet."}
                            </td>
                          </tr>
                        ) : (
                          filteredItems.map((item) => (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-50/70 transition-colors ${
                                !item.isActive ? "opacity-60 bg-slate-50/40" : ""
                              }`}
                            >
                              {/* Label */}
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                <div className="flex items-center gap-2">
                                  <span>{item.label}</span>
                                  {item.badgeColor && (
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${item.badgeColor}`}
                                    >
                                      Tag
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Code */}
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                                <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {item.code}
                                </code>
                              </td>

                              {/* Description */}
                              <td className="py-2.5 px-3 text-slate-500 max-w-[220px] truncate">
                                {item.description || "—"}
                              </td>

                              {/* Status Switch */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(item)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                                    item.isActive
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                      : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                                  }`}
                                  title="Click to toggle Active/Inactive"
                                >
                                  {item.isActive ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>Active</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3 h-3 text-slate-400" />
                                      <span>Disabled</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(item)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                    title="Edit Option"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDelete(item)}
                                    className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title="Delete Option"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-start gap-2 text-xs text-blue-900">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Live Sync:</strong> Any option added, edited, or disabled here immediately reflects inside the <strong>Complaint Registration</strong> form, <strong>Smart General Diary</strong>, and <strong>Enquiry Assignment</strong> dropdowns across the application.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: STATION & ORGANIZATION */}
      {/* ======================================================== */}
      {activeTab === "station" && (
        <div className="space-y-6">
          {/* Quick Access Card to Dropdown Manager */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <ListFilter className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Website Dropdown Manager</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    10 Modules Configurable
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  Manage all dropdown options across the portal (Complaint Categories, GD Types, Enquiry Officers, Ranks, Relation Types, Source Channels). Add new options, edit labels, or delete options with instant live synchronization.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setActiveTab("dropdowns")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs shrink-0 gap-2 self-start md:self-auto cursor-pointer"
            >
              <ListFilter className="w-4 h-4" />
              <span>Open Dropdown Manager Tab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Police Station Profile &amp; Jurisdiction</h2>
                <p className="text-xs text-slate-500">Official jurisdictional configuration for Thanesar City</p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Station Name</span>
                <p className="text-sm font-bold text-slate-900">{currentUser.stationName}</p>
                <span className="text-xs text-slate-500 font-mono">Code: HAR-KKR-PS-01</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">District &amp; Range</span>
                <p className="text-sm font-bold text-slate-900">Kurukshetra · Ambala Police Range</p>
                <span className="text-xs text-slate-500 font-mono">State: Haryana Police</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Supervisory Sub-Division</span>
                <p className="text-sm font-bold text-slate-900">SDPO Thanesar (Amit Dahiya, HPS)</p>
                <span className="text-xs text-slate-500">Supervisory Jurisdiction: DSP Sub-Division</span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Station In-Charge (SHO)</span>
                <p className="text-sm font-bold text-slate-900">Inspector Rajesh Kumar</p>
                <span className="text-xs text-slate-500 font-mono">PNO: 04291882 · Belt: 04291882</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Link href="/station-profile">
                <Button variant="primary" size="sm" className="gap-1.5 text-xs bg-blue-600 font-bold">
                  <span>Open Full Station Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SYSTEM & BACKUP */}
      {/* ======================================================== */}
      {activeTab === "system" && (
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Storage &amp; Backup Maintenance</h2>
              <p className="text-xs text-slate-500">Local master data controls and factory reset utilities</p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <h3 className="text-xs font-bold text-amber-900">Reset All Dropdowns to Factory Defaults</h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                If custom options get distorted or misconfigured, this will reset all 10 dropdown categories back to official Haryana Police standard configurations.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to restore ALL dropdown categories to factory system defaults?")) {
                    DropdownManagerService.resetAllToDefault();
                    loadCategoryItems();
                    showToast("All dropdown masters restored to default.");
                  }
                }}
                className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-bold mt-2"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Restore All Dropdown Masters</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NEW DROPDOWN OPTION */}
      {/* ======================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold">Add Option to {currentCategory.name}</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Option Display Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Stalking & Blackmail"
                  value={formLabel}
                  onChange={(e) => {
                    setFormLabel(e.target.value);
                    if (!formCode) {
                      setFormCode(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "_")
                      );
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  System Code / Identifier <span className="text-slate-400">(Unique key)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CYBER_STALKING"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Brief Description <span className="text-slate-400">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed context of when this option applies..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {currentCategory.supportsColors && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Badge Color</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOR_OPTIONS.map((col) => (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() => setFormBadgeColor(col.value)}
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold cursor-pointer transition-all ${col.value} ${
                          formBadgeColor === col.value ? "ring-2 ring-blue-600 scale-105" : "opacity-80"
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="formIsActive" className="text-xs font-medium text-slate-700">
                  Make option active immediately in dropdowns
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-blue-600 text-white font-bold"
                >
                  Save Option
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT DROPDOWN OPTION */}
      {/* ======================================================== */}
      {editModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in-50">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Edit Option: {activeItem.label}</h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Option Display Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">System Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {currentCategory.supportsColors && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Badge Color</label>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COLOR_OPTIONS.map((col) => (
                      <button
                        key={col.label}
                        type="button"
                        onClick={() => setFormBadgeColor(col.value)}
                        className={`text-[10px] px-2 py-0.5 rounded border font-semibold cursor-pointer transition-all ${col.value} ${
                          formBadgeColor === col.value ? "ring-2 ring-blue-600 scale-105" : "opacity-80"
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-slate-700">
                  Option is Active in website dropdowns
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="bg-blue-600 text-white font-bold"
                >
                  Update Option
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteConfirmOpen && activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Dropdown Option?</h3>
                <p className="text-xs text-slate-500">This action will remove it from dropdown lists.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              Are you sure you want to permanently delete <strong>&ldquo;{activeItem.label}&rdquo;</strong> (<code>{activeItem.code}</code>)?
            </p>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESET CATEGORY TO DEFAULTS */}
      {/* ======================================================== */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reset &ldquo;{currentCategory.name}&rdquo;?</h3>
                <p className="text-xs text-slate-500">Restore factory Haryana Police defaults</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              This will restore all default system options for <strong>{currentCategory.name}</strong> and remove newly added custom items in this category.
            </p>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmReset}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading Settings &amp; Dropdown Manager...
        </div>
      }
    >
      <SettingsPageContent />
    </Suspense>
  );
}
