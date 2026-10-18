"use client";

import React, { useState, useEffect } from "react";
import { MalpracticeDeficiency } from "@/types/prosecution";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  RotateCcw,
  ShieldAlert,
  Search,
  BookOpen,
  Scale,
} from "lucide-react";

export function CommonMalpracticesView() {
  const [items, setItems] = useState<MalpracticeDeficiency[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    const list = await ProsecutionService.getMalpractices();
    setItems(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (id: string) => {
    const updated = await ProsecutionService.toggleMalpracticeCheck(id);
    setItems(updated);
  };

  const handleReset = async () => {
    if (confirm("Reset all verification marks to default?")) {
      const reset = await ProsecutionService.resetMalpractices();
      setItems(reset);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchSev = selectedSeverity === "ALL" || item.severity === selectedSeverity;
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.statutoryRule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSev && matchSearch;
  });

  const verifiedCount = items.filter((i) => i.isChecked).length;
  const criticalCount = items.filter((i) => i.severity === "CRITICAL").length;

  return (
    <div className="space-y-4">
      {/* Top Banner / Summary */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Investigation Flaws & Scrutiny Malpractices Audit
            </h3>
            <p className="text-xs text-slate-500">
              Standard statutory checks required to prevent acquittal on procedural defects
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            {verifiedCount} of {items.length} Points Verified Clean
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
            title="Reset checkmarks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search malpractice, statute, or remedy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
            {["ALL", "EVIDENCE", "REGISTRATION", "ARREST", "PROCEDURE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  selectedCategory === cat ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
                }`}
              >
                {cat === "ALL" ? "All Categories" : cat}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="MAJOR">Major</option>
            <option value="PROCEDURAL">Procedural</option>
          </select>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const isCrit = item.severity === "CRITICAL";
          const isMaj = item.severity === "MAJOR";

          return (
            <div
              key={item.id}
              className={`bg-white p-4 rounded-xl border transition-all space-y-2.5 ${
                item.isChecked
                  ? "border-emerald-300 bg-emerald-50/10 shadow-2xs"
                  : "border-slate-200 hover:border-slate-300 shadow-2xs"
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isCrit
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : isMaj
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">{item.category}</span>
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!item.isChecked}
                    onChange={() => handleToggle(item.id)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className={item.isChecked ? "text-emerald-700" : "text-slate-500"}>
                    {item.isChecked ? "Complied" : "Pending Check"}
                  </span>
                </label>
              </div>

              {/* Title & Statute */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                <p className="text-[11px] font-mono font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                  <Scale className="w-3 h-3 text-slate-400" />
                  {item.statutoryRule}
                </p>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                {item.description}
              </p>

              {/* Risk & Remedy */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-start gap-1.5 text-rose-800 bg-rose-50/50 p-2 rounded border border-rose-100">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <strong className="font-semibold block">Court Risk:</strong>
                    <span>{item.courtPrecedentOrRisk}</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-emerald-900 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <strong className="font-semibold block">Standard Remedy:</strong>
                    <span>{item.rectificationMeasure}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
