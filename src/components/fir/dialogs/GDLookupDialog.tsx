"use client";

import React, { useState } from "react";
import { X, Search, Check, Calendar, FileText, User, Filter, RotateCcw } from "lucide-react";
import { GeneralDiaryItem } from "@/types";
import { MOCK_GD_ENTRIES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { DatePickerDDMMYYYY } from "@/components/ui/date-picker-ddmmyyyy";

export interface GDLookupResult {
  diaryNumber: string;
  gdNumber: string;
  entryDate: string;
  gdDate: string;
  entryTime: string;
  gdTime: string;
  subject?: string;
  brief?: string;
  entryType?: string;
  officer?: string;
}

export interface GDLookupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecord?: (record: GDLookupResult) => void;
  onSelectEntry?: (entry: GDLookupResult) => void;
}

export const GDLookupDialog: React.FC<GDLookupDialogProps> = ({
  isOpen,
  onClose,
  onSelectRecord,
  onSelectEntry,
}) => {
  const [diaryNumberQuery, setDiaryNumberQuery] = useState("");
  const [diaryType, setDiaryType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [officerQuery, setOfficerQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");

  const [selectedGdId, setSelectedGdId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter records based on search criteria
  const filteredRecords = MOCK_GD_ENTRIES.filter((gd) => {
    if (diaryNumberQuery.trim()) {
      if (!gd.gdNumber.toLowerCase().includes(diaryNumberQuery.toLowerCase().trim())) {
        return false;
      }
    }
    if (diaryType !== "ALL") {
      if (gd.entryType !== diaryType) return false;
    }
    if (dateFrom && gd.entryDate) {
      if (gd.entryDate < dateFrom) return false;
    }
    if (dateTo && gd.entryDate) {
      if (gd.entryDate > dateTo) return false;
    }
    if (officerQuery.trim() && gd.loggedByOfficer) {
      if (!gd.loggedByOfficer.toLowerCase().includes(officerQuery.toLowerCase().trim())) {
        return false;
      }
    }
    if (subjectQuery.trim()) {
      const subMatch = gd.subject.toLowerCase().includes(subjectQuery.toLowerCase().trim());
      const narMatch = gd.narrative?.toLowerCase().includes(subjectQuery.toLowerCase().trim());
      if (!subMatch && !narMatch) return false;
    }
    return true;
  });

  const handleResetFilters = () => {
    setDiaryNumberQuery("");
    setDiaryType("ALL");
    setDateFrom("");
    setDateTo("");
    setOfficerQuery("");
    setSubjectQuery("");
    setSelectedGdId(null);
  };

  const handleApplySelection = () => {
    if (!selectedGdId) {
      alert("Please select a General Diary record from the table.");
      return;
    }
    const found = MOCK_GD_ENTRIES.find((g) => g.id === selectedGdId);
    if (found) {
      const result: GDLookupResult = {
        diaryNumber: found.gdNumber,
        gdNumber: found.gdNumber,
        entryDate: found.entryDate || "",
        gdDate: found.entryDate || "",
        entryTime: found.entryTime || "",
        gdTime: found.entryTime || "",
        subject: found.subject,
        brief: found.narrative,
        entryType: found.entryTypeDisplay || found.entryType,
        officer: found.loggedByOfficer,
      };
      if (onSelectRecord) onSelectRecord(result);
      if (onSelectEntry) onSelectEntry(result);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#0b192c] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-200">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">General Diary (GD / SD / DD) Lookup</h2>
              <p className="text-[11px] text-slate-300">
                Search Roznamcha Daily Diary records to link reference details to this FIR
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Form */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">GD / SD / DD Number</label>
              <input
                type="text"
                placeholder="e.g. GD-2026-10-03..."
                value={diaryNumberQuery}
                onChange={(e) => setDiaryNumberQuery(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">General Diary Type</label>
              <select
                value={diaryType}
                onChange={(e) => setDiaryType(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-[#0b192c]"
              >
                <option value="ALL">All Diary Types</option>
                <option value="COMPLAINT_RECEIPT">Complaint Receipt</option>
                <option value="PATROL_DEPARTURE_RETURN">Patrol Departure / Return</option>
                <option value="OPENING_OF_DIARY">Opening of Roznamcha</option>
                <option value="CRIME_INCIDENT">Crime / Incident Report</option>
                <option value="LAW_AND_ORDER">Law &amp; Order Bandobast</option>
                <option value="CASE_PROPERTY_MOVEMENT">Case Property Movement</option>
                <option value="MISCELLANEOUS">Miscellaneous General Entry</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Entry For / Officer</label>
              <input
                type="text"
                placeholder="e.g. HC Devinder, ASI Surender..."
                value={officerQuery}
                onChange={(e) => setOfficerQuery(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <label className="font-bold text-slate-700 block mb-1">Date Range (From - To)</label>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <DatePickerDDMMYYYY
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    size="sm"
                    title="From date (DD/MM/YYYY)"
                  />
                </div>
                <div className="w-1/2">
                  <DatePickerDDMMYYYY
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    size="sm"
                    title="To date (DD/MM/YYYY)"
                  />
                </div>
              </div>
            </div>
            <div className="sm:col-span-5">
              <label className="font-bold text-slate-700 block mb-1">Subject / Keyword</label>
              <input
                type="text"
                placeholder="Search subject or narrative keywords..."
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-[#0b192c]"
              />
            </div>
            <div className="sm:col-span-2 flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full text-xs text-slate-600 flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              Found {filteredRecords.length} Record(s) in Roznamcha Diary
            </span>
            <span className="text-[11px] text-slate-500">
              Select one record to auto-populate GD details
            </span>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-12 text-center">Select</th>
                    <th className="p-2.5 w-32">Diary Number</th>
                    <th className="p-2.5 w-28">Type</th>
                    <th className="p-2.5 w-32">Date &amp; Time</th>
                    <th className="p-2.5 w-32">Officer</th>
                    <th className="p-2.5 w-44">Subject</th>
                    <th className="p-2.5">Diary Brief</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => {
                    const isSelected = selectedGdId === rec.id;
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => setSelectedGdId(rec.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-50/80 font-medium" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="radio"
                            name="selectedGdRecord"
                            checked={isSelected}
                            onChange={() => setSelectedGdId(rec.id)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="p-2.5 font-mono font-bold text-blue-900">{rec.gdNumber}</td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold text-slate-700">
                            {rec.entryTypeDisplay || rec.entryType}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {rec.entryDate} {rec.entryTime}
                        </td>
                        <td className="p-2.5 text-slate-800">{rec.loggedByOfficer}</td>
                        <td className="p-2.5 font-semibold text-slate-900 max-w-[180px] truncate">
                          {rec.subject}
                        </td>
                        <td className="p-2.5 text-slate-500 max-w-[240px] truncate text-[11px]">
                          {rec.narrative}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-slate-300 rounded-lg text-slate-500">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-xs">No General Diary records match your search criteria.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try clearing filters or searching another date range.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              disabled={!selectedGdId}
              onClick={handleApplySelection}
              className="bg-[#0b192c] hover:bg-slate-800 text-white text-xs flex items-center gap-1.5 px-4"
            >
              <Check className="w-3.5 h-3.5" />
              Select Record &amp; Fill GD Fields
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
