"use client";

import { useLanguage } from "@/context/LanguageContext";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  ShieldAlert,
  Info,
  Type,
  Hash,
  Calendar,
  BadgeAlert,
  ListFilter,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import {useAuth} from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TableManagerService,
  ManagedTableConfig,
  ManagedColumn,
  TableIdentifier,
  ColumnDataType,
} from "@/services/tableManagerService";

const DATA_TYPE_BADGES: Record<
  ColumnDataType,
  { label: string; labelHi: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  text: { label: "Text", labelHi: "टेक्स्ट", icon: Type, color: "bg-slate-100 text-slate-800 border-slate-200" },
  number: { label: "Number", labelHi: "संख्या", icon: Hash, color: "bg-blue-100 text-blue-800 border-blue-200" },
  date: { label: "Date / Time", labelHi: "दिनांक और समय", icon: Calendar, color: "bg-amber-100 text-amber-800 border-amber-200" },
  badge: { label: "Status Badge", labelHi: "स्थिति बैज", icon: BadgeAlert, color: "bg-purple-100 text-purple-800 border-purple-200" },
  select: { label: "Dropdown Select", labelHi: "विकल्प सूची", icon: ListFilter, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  boolean: { label: "Yes / No (Boolean)", labelHi: "हाँ या नहीं", icon: ToggleRight, color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
};

export default function TableManagerTab() {
  const { t, isHindi } = useLanguage();
  const {currentUser}=useAuth();
  const tableConfigs = useMemo(() => TableManagerService.getTableConfigs(), []);
  const [selectedTableId, setSelectedTableId] = useState<TableIdentifier>("fir");
  const [columns, setColumns] = useState<ManagedColumn[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<ManagedColumn | null>(null);

  // Form states
  const [formLabel, setFormLabel] = useState("");
  const [formLabelHi, setFormLabelHi] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formDataType, setFormDataType] = useState<ColumnDataType>("text");
  const [formDescription, setFormDescription] = useState("");
  const [formDefaultValue, setFormDefaultValue] = useState("");
  const [formWidth, setFormWidth] = useState("min-w-[150px]");
  const [formOptions, setFormOptions] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const currentTable = useMemo(
    () => tableConfigs.find((t) => t.id === selectedTableId) || tableConfigs[0],
    [tableConfigs, selectedTableId]
  );

  const tableName = t(currentTable.nameHi, currentTable.name);
  const columnName = (column: ManagedColumn) => {
    if (!isHindi) return column.label;
    if (column.labelHi && (!column.isDefault || /[\u0900-\u097F]/.test(column.labelHi))) {
      return column.isDefault ? t(column.labelHi, column.label) : column.labelHi;
    }
    return column.isDefault ? t(column.label) : column.label;
  };

  const loadColumns = () => {
    const list = TableManagerService.getAllColumns(selectedTableId);
    setColumns(list);
  };

  useEffect(() => {
    loadColumns();
  }, [selectedTableId]);

  // Listen for changes
  useEffect(() => {
    const handleUpdate = () => {
      loadColumns();
    };
    window.addEventListener("cms_table_columns_changed", handleUpdate);
    return () => {
      window.removeEventListener("cms_table_columns_changed", handleUpdate);
    };
  }, [selectedTableId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered columns
  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const q = searchQuery.toLowerCase().trim();
    return columns.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.labelHi && c.labelHi.toLowerCase().includes(q)) ||
        c.key.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [columns, searchQuery]);

  const stats = useMemo(() => {
    const total = columns.length;
    const system = columns.filter((c) => c.isDefault).length;
    const custom = columns.filter((c) => !c.isDefault).length;
    return { total, system, custom };
  }, [columns]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormLabel("");
    setFormLabelHi("");
    setFormKey("");
    setFormDataType("text");
    setFormDescription("");
    setFormDefaultValue("");
    setFormWidth("min-w-[150px]");
    setFormOptions("");
    setFormError(null);
    setAddModalOpen(true);
  };

  // Submit Add
  const handleSaveAdd = (e: React.FormEvent) => {
    if(currentUser.role !== "SUPER_ADMIN"){alert("Only Super Admin may change table settings.");return;}
    e.preventDefault();
    setFormError(null);

    if (!formLabel.trim()) {
      setFormError(t("कृपया कॉलम का नाम (Label) भरें।", "Enter a column label."));
      return;
    }

    const optionsList =
      formDataType === "select"
        ? formOptions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const res = TableManagerService.addCustomColumn(selectedTableId, {
      label: formLabel.trim(),
      labelHi: formLabelHi.trim() || undefined,
      key: formKey.trim() || undefined,
      dataType: formDataType,
      description: formDescription.trim() || undefined,
      defaultValue: formDefaultValue.trim() || undefined,
      width: formWidth,
      options: optionsList,
    });

    if (!res.success) {
      setFormError(res.error || t("कॉलम जोड़ने में विफल।", "Could not add the column."));
      return;
    }

    setAddModalOpen(false);
    loadColumns();
    showToast(t(`नया कॉलम "${formLabel}" सफलतापूर्वक जोड़ा गया!`, `Column "${formLabel}" added.`));
  };

  // Open Edit Modal (Custom columns ONLY)
  const handleOpenEdit = (col: ManagedColumn) => {
    if (col.isDefault) {
      alert(t("डिफ़ॉल्ट सिस्टम कॉलम को एडिट नहीं किया जा सकता।", "Default columns cannot be edited."));
      return;
    }
    setActiveColumn(col);
    setFormLabel(col.label);
    setFormLabelHi(col.labelHi || "");
    setFormKey(col.key);
    setFormDataType(col.dataType);
    setFormDescription(col.description || "");
    setFormDefaultValue(col.defaultValue || "");
    setFormWidth(col.width || "min-w-[150px]");
    setFormOptions(col.options ? col.options.join(", ") : "");
    setFormError(null);
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    if(currentUser.role !== "SUPER_ADMIN"){alert("Only Super Admin may change table settings.");return;}
    e.preventDefault();
    if (!activeColumn) return;
    setFormError(null);

    if (!formLabel.trim()) {
      setFormError(t("कृपया कॉलम का नाम (Label) भरें।", "Enter a column label."));
      return;
    }

    const optionsList =
      formDataType === "select"
        ? formOptions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    const res = TableManagerService.updateCustomColumn(selectedTableId, activeColumn.id, {
      label: formLabel.trim(),
      labelHi: formLabelHi.trim() || undefined,
      dataType: formDataType,
      description: formDescription.trim() || undefined,
      defaultValue: formDefaultValue.trim() || undefined,
      width: formWidth,
      options: optionsList,
    });

    if (!res.success) {
      setFormError(res.error || t("कॉलम अपडेट करने में विफल।", "Could not update the column."));
      return;
    }

    setEditModalOpen(false);
    setActiveColumn(null);
    loadColumns();
    showToast(t(`कॉलम "${formLabel}" सफलतापूर्वक अपडेट हो गया!`, `Column "${formLabel}" updated.`));
  };

  // Open Delete Modal (Custom columns ONLY)
  const handleOpenDelete = (col: ManagedColumn) => {
    if (col.isDefault) {
      alert(t("डिफ़ॉल्ट सिस्टम कॉलम को डिलीट नहीं किया जा सकता।", "Default columns cannot be deleted."));
      return;
    }
    setActiveColumn(col);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if(currentUser.role !== "SUPER_ADMIN"){alert("Only Super Admin may change table settings.");return;}
    if (!activeColumn) return;
    const res = TableManagerService.deleteCustomColumn(selectedTableId, activeColumn.id);
    if (!res.success) {
      alert(res.error || t("कॉलम हटाने में विफल।", "Could not remove the column."));
      return;
    }
    setDeleteModalOpen(false);
    setActiveColumn(null);
    loadColumns();
    showToast(t(`कॉलम "${columnName(activeColumn)}" हटा दिया गया!`, `Column "${columnName(activeColumn)}" removed.`));
  };

  // Toggle Active State
  const handleToggleActive = (col: ManagedColumn) => {
    if(currentUser.role !== "SUPER_ADMIN"){alert("Only Super Admin may change table settings.");return;}
    if (col.isDefault) return;
    TableManagerService.toggleCustomColumnActive(selectedTableId, col.id);
    loadColumns();
    showToast(t(`कॉलम "${columnName(col)}" स्थिति बदल दी गई!`, `Status updated for "${columnName(col)}".`));
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b192c] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                {t("डेटाबेस और कॉलम विन्यास", "Database Schema & Column Customizer")}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Table className="w-5 h-5 text-indigo-400" />
              <span>{t("टेबल कॉलम प्रबंधक", "Table Column Manager")}</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {t("एफआईआर, शिकायत और रोजनामचा रजिस्टर में अपनी जरूरत के अनुसार कॉलम जोड़ें।", "Add custom columns to the FIR, Complaints, and General Diary registers.")}{" "}
              {t("मूल कॉलम केवल पढ़ने के लिए हैं। अपने जोड़े गए कॉलम बदल या हटा सकते हैं।", "Default columns are read-only. You can edit or delete custom columns.")}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>{t("+ नया कॉलम जोड़ें", "+ Add Column")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Table Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tableConfigs.map((tbl) => {
          const isSelected = tbl.id === selectedTableId;
          const allCols = TableManagerService.getAllColumns(tbl.id);
          const customCount = allCols.filter((c) => !c.isDefault).length;

          return (
            <button
              key={tbl.id}
              type="button"
              onClick={() => setSelectedTableId(tbl.id)}
              className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                  : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet
                      className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-400"}`}
                    />
                    <h3 className="text-sm font-bold text-slate-900">{t(tbl.nameHi, tbl.name)}</h3>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                  {t(`${allCols.length} कॉलम`, `${allCols.length} columns`)}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {t(`${tbl.defaultColumns.length} मूल`, `${tbl.defaultColumns.length} default`)}
                  {customCount > 0 && (
                    <span className="text-indigo-600 font-bold ml-1">
                      {t(`+ ${customCount} कस्टम`, `+ ${customCount} custom`)}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-semibold flex items-center gap-1 ${
                    isSelected ? "text-indigo-600 font-bold" : "text-slate-400"
                  }`}
                >
                  <span>Select Table</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Table Content Card */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* Card Header & Search */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {t(`${tableName} के कॉलम`, `${tableName} — Columns`)}
              </h3>
              <Link
                href={currentTable.routePath}
                target="_blank"
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold ml-1"
                title={t("टेबल को नए टैब में खोलें", "Open table in a new tab")}
              >
                <span>Live View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500">{t(currentTable.description)}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("कॉलम नाम या कोड खोजें...", "Search by column name or key…")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            <Button
              type="button"
              onClick={handleOpenAdd}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Add Column</span>
            </Button>
          </div>
        </div>

        {/* Stats Pill Bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          <span className="text-slate-600 font-medium">
            {t("कुल कॉलम:", "Total Columns:")} <strong className="text-slate-900">{stats.total}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
            <Lock className="w-3 h-3 text-slate-500" />
            {t("मूल कॉलम (सुरक्षित):", "System Default (Protected):")} <strong className="text-slate-900">{stats.system}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            {t("कस्टम कॉलम (संपादन योग्य):", "User Custom (Editable):")} <strong className="text-indigo-900">{stats.custom}</strong>
          </span>
        </div>

        {/* Table Rows */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Column Name & Identifier</th>
                <th className="py-3 px-4 min-w-[140px]">Data Type</th>
                <th className="py-3 px-4 min-w-[140px]">Classification</th>
                <th className="py-3 px-4 min-w-[200px]">Description & Usage</th>
                <th className="py-3 px-4 text-right min-w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredColumns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Table className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">{t("कोई कॉलम नहीं मिला", "No columns found")}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {t("खोज बदलें या नया कॉलम जोड़ें।", "Try another search or add a column.")}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredColumns.map((col, idx) => {
                  const typeMeta = DATA_TYPE_BADGES[col.dataType] || DATA_TYPE_BADGES.text;
                  const TypeIcon = typeMeta.icon;

                  return (
                    <tr
                      key={col.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !col.isDefault ? "bg-indigo-50/20" : ""
                      }`}
                    >
                      {/* # Number */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Label & Key */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span data-no-translate="true" className="font-bold text-slate-900 text-xs">
                            {columnName(col)}
                          </span>
                          <p className="font-mono text-[10px] text-slate-400">
                            {t("कुंजी:", "Key:")} <code>{col.key}</code>
                          </p>
                        </div>
                      </td>

                      {/* Data Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeMeta.color}`}
                        >
                          <TypeIcon className="w-3 h-3 shrink-0" />
                          <span>{t(typeMeta.labelHi, typeMeta.label)}</span>
                        </span>
                        {col.dataType === "select" && col.options && col.options.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={col.options.join(", ")}>
                            {t("विकल्प:", "Options:")} <span data-no-translate="true">{col.options.join(", ")}</span>
                          </p>
                        )}
                      </td>

                      {/* Classification Badge (Default vs Custom) */}
                      <td className="py-3.5 px-4">
                        {col.isDefault ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>System Default</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>User Custom</span>
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <p className="line-clamp-2 leading-relaxed">
                          {(col.isDefault && col.description ? t(col.description) : col.description) || (
                            <span className="text-slate-400 italic">{t("कोई विवरण नहीं", "No description")}</span>
                          )}
                        </p>
                        {col.defaultValue && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            {t("मूल मान:", "Default:")} <span data-no-translate="true">&quot;{col.defaultValue}&quot;</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {col.isDefault ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200 cursor-not-allowed" title={t("डिफ़ॉल्ट सिस्टम कॉलम को सुरक्षित रखा गया है — इसे एडिट या डिलीट नहीं किया जा सकता", "Default columns are protected from edits and deletion")}>
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>{t("सुरक्षित", "Protected")}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(col)}
                              title={col.isActive ? t("कॉलम निष्क्रिय करें", "Disable column") : t("कॉलम सक्रिय करें", "Enable column")}
                              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                col.isActive
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                  : "text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {col.isActive ? (
                                <ToggleRight className="w-4 h-4" />
                              ) : (
                                <ToggleLeft className="w-4 h-4" />
                              )}
                            </button>

                            {/* Edit Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(col)}
                              title={t("कॉलम एडिट करें", "Edit column")}
                              className="h-7 px-2 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900 font-semibold gap-1 cursor-pointer"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </Button>

                            {/* Delete Button */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDelete(col)}
                              title={t("कॉलम डिलीट करें", "Delete column")}
                              className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info note */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>
              {t(`नए कॉलम ${tableName} में दिखेंगे। क्रम बदलने के लिए उन्हें खींचें।`, `Custom columns appear in ${tableName}. Drag them to change their order.`)}
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Haryana Police CMS Table Engine v2.4
          </span>
        </div>
      </Card>

      {/* ======================================================== */}
      {/* MODAL: ADD CUSTOM COLUMN */}
      {/* ======================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold">
                  {t(`${tableName} में नया कॉलम जोड़ें`, `Add column to ${tableName}`)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-white hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Column Label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("कॉलम का नाम", "Column label")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("उदा. Court Hearing Date, Case Diary Priority", "e.g. Court Hearing Date, Case Diary Priority")}
                  value={formLabel}
                  onChange={(e) => {
                    setFormLabel(e.target.value);
                    if (!formKey) {
                      setFormKey(
                        `col_${e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, "_")
                          .replace(/_+/g, "_")
                          .slice(0, 20)}`
                      );
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  autoFocus
                  required
                />
              </div>

              {/* Hindi Label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("हिंदी शीर्षक (वैकल्पिक)", "Hindi label (optional)")}
                </label>
                <input
                  type="text"
                  placeholder={t("उदा. पेशी तारीख, केस डायरी स्थिति", "e.g. Hearing Date, Case Diary Status")}
                  value={formLabelHi}
                  onChange={(e) => setFormLabelHi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* System Key */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("कॉलम पहचान कोड", "Field key")}
                </label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) =>
                    setFormKey(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                    )
                  }
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50"
                  placeholder={t("उदा. col_court_hearing_date", "e.g. col_court_hearing_date")}
                />
                <span className="text-[10px] text-slate-400">
                  {t("डेटाबेस और निर्यात के लिए अपने आप बनी कुंजी", "Automatically generated key for database and exports")}
                </span>
              </div>

              {/* Data Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("डेटा का प्रकार", "Data type")} <span className="text-red-500">*</span>
                </label>
                <select
                  value={formDataType}
                  onChange={(e) => setFormDataType(e.target.value as ColumnDataType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="text">{t("टेक्स्ट", "Text")}</option>
                  <option value="number">{t("संख्या", "Number")}</option>
                  <option value="date">{t("दिनांक और समय", "Date / Time")}</option>
                  <option value="badge">{t("स्थिति बैज", "Status badge")}</option>
                  <option value="select">{t("विकल्प सूची", "Dropdown")}</option>
                  <option value="boolean">{t("हाँ / नहीं", "Yes / No")}</option>
                </select>
              </div>

              {/* If select: Options */}
              {formDataType === "select" && (
                <div className="space-y-1 animate-in fade-in-50">
                  <label className="text-xs font-bold text-slate-700">
                    {t("विकल्प सूची", "Dropdown options")}
                  </label>
                  <input
                    type="text"
                    placeholder="Pending, Approved, In Progress, Closed"
                    value={formOptions}
                    onChange={(e) => setFormOptions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">
                    {t("विकल्पों को अल्पविराम से अलग करें।", "Separate options with commas.")}
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("कॉलम का विवरण और उपयोग", "Description / Notes")}
                </label>
                <textarea
                  rows={2}
                  placeholder={t("इस कॉलम के उद्देश्य का संक्षिप्त विवरण लिखें...", "Describe the purpose of this column…")}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Default Value */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("मूल मान (वैकल्पिक)", "Default value (optional)")}
                </label>
                <input
                  type="text"
                  placeholder={t("उदा. N/A या None", "e.g. N/A or None")}
                  value={formDefaultValue}
                  onChange={(e) => setFormDefaultValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-2 text-[11px] text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  {t(`कॉलम तुरंत ${tableName} में जुड़ जाएगा। इसे यहाँ से बदल या हटा सकते हैं।`, `The column is added to ${tableName} immediately. You can edit or delete it here.`)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                >
                  {t("रद्द करें", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {t("कॉलम सहेजें", "Save column")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT CUSTOM COLUMN */}
      {/* ======================================================== */}
      {editModalOpen && activeColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in-50">
            <div className="p-4 bg-[#0b192c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  {t(`कॉलम बदलें: ${columnName(activeColumn)}`, `Edit column: ${columnName(activeColumn)}`)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-white hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Column Label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("कॉलम का नाम", "Column label")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Hindi Label */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("हिंदी शीर्षक", "Hindi label")}
                </label>
                <input
                  type="text"
                  value={formLabelHi}
                  onChange={(e) => setFormLabelHi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Key (Read only in edit) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Field Key (Fixed)
                </label>
                <input
                  type="text"
                  value={formKey}
                  readOnly
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Data Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {t("डेटा का प्रकार", "Data type")}
                </label>
                <select
                  value={formDataType}
                  onChange={(e) => setFormDataType(e.target.value as ColumnDataType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="text">{t("टेक्स्ट", "Text")}</option>
                  <option value="number">{t("संख्या", "Number")}</option>
                  <option value="date">{t("दिनांक और समय", "Date / Time")}</option>
                  <option value="badge">{t("स्थिति बैज", "Status badge")}</option>
                  <option value="select">{t("विकल्प सूची", "Dropdown")}</option>
                  <option value="boolean">{t("हाँ / नहीं", "Yes / No")}</option>
                </select>
              </div>

              {formDataType === "select" && (
                <div className="space-y-1 animate-in fade-in-50">
                  <label className="text-xs font-bold text-slate-700">
                    {t("विकल्प सूची", "Dropdown options")}
                  </label>
                  <input
                    type="text"
                    value={formOptions}
                    onChange={(e) => setFormOptions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">{t("विवरण", "Description")}</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Default Value */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">{t("मूल मान", "Default value")}</label>
                <input
                  type="text"
                  value={formDefaultValue}
                  onChange={(e) => setFormDefaultValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  {t("रद्द करें", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {t("बदलाव सहेजें", "Update column")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ======================================================== */}
      {deleteModalOpen && activeColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t("कॉलम हटाएँ?", "Delete column?")}</h3>
                <p className="text-xs text-slate-500">{t(`${tableName} से कॉलम हटाया जाएगा`, `This removes the column from ${tableName}.`)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {t(`क्या आप “${columnName(activeColumn)}” (${activeColumn.key}) कॉलम हटाना चाहते हैं?`, `Delete the custom column “${columnName(activeColumn)}” (${activeColumn.key})?`)}
            </p>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
              >
                {t("रद्द करें", "Cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {t("हाँ, हटाएँ", "Yes, delete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
