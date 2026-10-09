"use client";

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
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  text: { label: "Text", icon: Type, color: "bg-slate-100 text-slate-800 border-slate-200" },
  number: { label: "Number", icon: Hash, color: "bg-blue-100 text-blue-800 border-blue-200" },
  date: { label: "Date / Time", icon: Calendar, color: "bg-amber-100 text-amber-800 border-amber-200" },
  badge: { label: "Status Badge", icon: BadgeAlert, color: "bg-purple-100 text-purple-800 border-purple-200" },
  select: { label: "Dropdown Select", icon: ListFilter, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  boolean: { label: "Yes / No (Boolean)", icon: ToggleRight, color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
};

export default function TableManagerTab() {
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
    e.preventDefault();
    setFormError(null);

    if (!formLabel.trim()) {
      setFormError("कृपया कॉलम का नाम (Label) भरें।");
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
      setFormError(res.error || "कॉलम जोड़ने में विफल।");
      return;
    }

    setAddModalOpen(false);
    loadColumns();
    showToast(`नया कॉलम "${formLabel}" सफलतापूर्वक जोड़ा गया!`);
  };

  // Open Edit Modal (Custom columns ONLY)
  const handleOpenEdit = (col: ManagedColumn) => {
    if (col.isDefault) {
      alert("डिफ़ॉल्ट सिस्टम कॉलम को एडिट नहीं किया जा सकता।");
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
    e.preventDefault();
    if (!activeColumn) return;
    setFormError(null);

    if (!formLabel.trim()) {
      setFormError("कृपया कॉलम का नाम (Label) भरें।");
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
      setFormError(res.error || "कॉलम अपडेट करने में विफल।");
      return;
    }

    setEditModalOpen(false);
    setActiveColumn(null);
    loadColumns();
    showToast(`कॉलम "${formLabel}" सफलतापूर्वक अपडेट हो गया!`);
  };

  // Open Delete Modal (Custom columns ONLY)
  const handleOpenDelete = (col: ManagedColumn) => {
    if (col.isDefault) {
      alert("डिफ़ॉल्ट सिस्टम कॉलम को डिलीट नहीं किया जा सकता।");
      return;
    }
    setActiveColumn(col);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!activeColumn) return;
    const res = TableManagerService.deleteCustomColumn(selectedTableId, activeColumn.id);
    if (!res.success) {
      alert(res.error || "कॉलम हटाने में विफल।");
      return;
    }
    setDeleteModalOpen(false);
    setActiveColumn(null);
    loadColumns();
    showToast(`कॉलम "${activeColumn.label}" हटा दिया गया!`);
  };

  // Toggle Active State
  const handleToggleActive = (col: ManagedColumn) => {
    if (col.isDefault) return;
    TableManagerService.toggleCustomColumnActive(selectedTableId, col.id);
    loadColumns();
    showToast(`कॉलम "${col.label}" स्थिति बदल दी गई!`);
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
                Database Schema & Column Customizer
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Table className="w-5 h-5 text-indigo-400" />
              <span>Table Manager (टेबल कॉलम व्यवस्थापक)</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              CMS के रजिस्टर्स (FIR, Complaints, General Diary) में आवश्यकतानुसार नए कॉलम्स जोड़ें।
              सिस्टम के <strong>डिफ़ॉल्ट कॉलम्स सुरक्षित (Read-only)</strong> हैं, जबकि जोड़े गए <strong>कस्टम कॉलम्स को कभी भी एडिट या डिलीट</strong> किया जा सकता है।
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>+ नया कॉलम जोड़ें (Add Column)</span>
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
                    <h3 className="text-sm font-bold text-slate-900">{tbl.name}</h3>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{tbl.nameHi}</p>
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                  {allCols.length} Cols
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  {tbl.defaultColumns.length} Default
                  {customCount > 0 && (
                    <span className="text-indigo-600 font-bold ml-1">
                      + {customCount} Custom
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
                {currentTable.name} — Columns Roster
              </h3>
              <Link
                href={currentTable.routePath}
                target="_blank"
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold ml-1"
                title="टेबल को नए टैब में खोलें"
              >
                <span>Live View</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500">{currentTable.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="कॉलम नाम या कोड खोजें..."
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
            Total Columns: <strong className="text-slate-900">{stats.total}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
            <Lock className="w-3 h-3 text-slate-500" />
            System Default (Protected): <strong className="text-slate-900">{stats.system}</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            User Custom (Editable): <strong className="text-indigo-900">{stats.custom}</strong>
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
                    <p className="font-semibold text-slate-600">कोई कॉलम नहीं मिला</p>
                    <p className="text-xs text-slate-400 mt-1">
                      खोज का शब्द बदलें या "+ नया कॉलम जोड़ें" पर क्लिक करें।
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">{col.label}</span>
                            {col.labelHi && (
                              <span className="text-[11px] text-slate-500 font-normal">
                                ({col.labelHi})
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-[10px] text-slate-400">
                            Key: <code>{col.key}</code>
                          </p>
                        </div>
                      </td>

                      {/* Data Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${typeMeta.color}`}
                        >
                          <TypeIcon className="w-3 h-3 shrink-0" />
                          <span>{typeMeta.label}</span>
                        </span>
                        {col.dataType === "select" && col.options && col.options.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={col.options.join(", ")}>
                            Options: {col.options.join(", ")}
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
                          {col.description || (
                            <span className="text-slate-400 italic">कोई विवरण नहीं</span>
                          )}
                        </p>
                        {col.defaultValue && (
                          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                            Default: &quot;{col.defaultValue}&quot;
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {col.isDefault ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200 cursor-not-allowed" title="डिफ़ॉल्ट सिस्टम कॉलम को सुरक्षित रखा गया है — इसे एडिट या डिलीट नहीं किया जा सकता">
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Protected (सुरक्षित)</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(col)}
                              title={col.isActive ? "कॉलम निष्क्रिय करें" : "कॉलम सक्रिय करें"}
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
                              title="कॉलम एडिट करें"
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
                              title="कॉलम डिलीट करें"
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
              जोड़े गए कस्टम कॉलम्स सीधे <strong>{currentTable.name}</strong> में विजिबल होते हैं और ड्रैग-एंड-ड्रॉप के साथ आसानी से रीऑर्डर किए जा सकते हैं।
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
                  {currentTable.name} में नया कॉलम जोड़ें
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
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
                  कॉलम का नाम (Column Label) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="उदा. Court Hearing Date, Case Diary Priority"
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
                  हिंदी शीर्षक (Hindi Label - Optional)
                </label>
                <input
                  type="text"
                  placeholder="उदा. पेशी तारीख, केस डायरी स्थिति"
                  value={formLabelHi}
                  onChange={(e) => setFormLabelHi(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* System Key */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  कॉलम पहचान कोड (Field Key)
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
                  placeholder="उदा. col_court_hearing_date"
                />
                <span className="text-[10px] text-slate-400">
                  डेटाबेस और एक्सपोर्ट हेतु मशीन कुंजी (Auto-generated)
                </span>
              </div>

              {/* Data Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  डेटा का प्रकार (Data Type) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formDataType}
                  onChange={(e) => setFormDataType(e.target.value as ColumnDataType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="text">Text (साधारण टेक्स्ट / टिप्पणी)</option>
                  <option value="number">Number (संख्या / अंक)</option>
                  <option value="date">Date / Time (दिनांक एवं समय)</option>
                  <option value="badge">Status Badge (रंगीन स्थिति बैज)</option>
                  <option value="select">Dropdown Select (विकल्प सूची)</option>
                  <option value="boolean">Yes / No Boolean (हाँ / नहीं)</option>
                </select>
              </div>

              {/* If select: Options */}
              {formDataType === "select" && (
                <div className="space-y-1 animate-in fade-in-50">
                  <label className="text-xs font-bold text-slate-700">
                    ड्रॉपडाउन विकल्प (Comma separated options)
                  </label>
                  <input
                    type="text"
                    placeholder="Pending, Approved, In Progress, Closed"
                    value={formOptions}
                    onChange={(e) => setFormOptions(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">
                    विकल्पों को कॉमा (,) से अलग करके लिखें।
                  </span>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  कॉलम का विवरण एवं उपयोग (Description / Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="इस कॉलम के उद्देश्य का संक्षिप्त विवरण लिखें..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Default Value */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  डिफ़ॉल्ट मान (Default Value - Optional)
                </label>
                <input
                  type="text"
                  placeholder="उदा. N/A या None"
                  value={formDefaultValue}
                  onChange={(e) => setFormDefaultValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Notice */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-2 text-[11px] text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  यह कॉलम तुरंत <strong>{currentTable.name}</strong> में जुड़ जाएगा। आप इसे कभी भी इसी टेबल मैनेजर से एडिट या डिलीट कर सकते हैं।
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddModalOpen(false)}
                >
                  रद्द करें (Cancel)
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  कॉलम सेव करें (Save Column)
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
                  कॉलम एडिट करें: {activeColumn.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
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
                  कॉलम का नाम (Column Label) <span className="text-red-500">*</span>
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
                  हिंदी शीर्षक (Hindi Label)
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
                  डेटा प्रकार (Data Type)
                </label>
                <select
                  value={formDataType}
                  onChange={(e) => setFormDataType(e.target.value as ColumnDataType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="text">Text (साधारण टेक्स्ट)</option>
                  <option value="number">Number (संख्या)</option>
                  <option value="date">Date / Time (दिनांक एवं समय)</option>
                  <option value="badge">Status Badge (स्थिति बैज)</option>
                  <option value="select">Dropdown Select (विकल्प सूची)</option>
                  <option value="boolean">Yes / No Boolean (हाँ / नहीं)</option>
                </select>
              </div>

              {formDataType === "select" && (
                <div className="space-y-1 animate-in fade-in-50">
                  <label className="text-xs font-bold text-slate-700">
                    ड्रॉपडाउन विकल्प (Comma separated options)
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
                <label className="text-xs font-bold text-slate-700">विवरण (Description)</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Default Value */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">डिफ़ॉल्ट मान (Default Value)</label>
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
                  रद्द करें
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  अपडेट सहेजें (Update Column)
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
                <h3 className="font-bold text-slate-900 text-sm">कॉलम हटाएं? (Delete Column)</h3>
                <p className="text-xs text-slate-500">{currentTable.name} से कॉलम हटाया जाएगा</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              क्या आप वाकई कस्टम कॉलम <strong>&ldquo;{activeColumn.label}&rdquo;</strong> (
              <code>{activeColumn.key}</code>) को हटाना चाहते हैं?
            </p>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
              >
                रद्द करें
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                हाँ, हटाएं (Yes, Delete)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
