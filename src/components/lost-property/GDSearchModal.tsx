"use client";

import React, { useState } from "react";
import { X, Search, RotateCcw, Check, BookOpen, Calendar, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GDSearchResultItem, MOCK_ENQUIRY_OFFICERS_LIST } from "@/types/lostProperty";
import { lostPropertyService } from "@/services/lostPropertyService";

interface GDSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGD: (selected: GDSearchResultItem) => void;
}

export function GDSearchModal({ isOpen, onClose, onSelectGD }: GDSearchModalProps) {
  const [gdNumber, setGdNumber] = useState("003");
  const [gdType, setGdType] = useState("Lost Property");
  const [dateFrom, setDateFrom] = useState("2019-04-20");
  const [dateTo, setDateTo] = useState("2019-04-25");
  const [entryForOfficer, setEntryForOfficer] = useState("");
  const [subject, setSubject] = useState("Lost property");
  const [showRecords, setShowRecords] = useState("10");

  const [results, setResults] = useState<GDSearchResultItem[]>(() => lostPropertyService.searchGD({}));
  const [selectedId, setSelectedId] = useState<string>("gd_search_003");

  if (!isOpen) return null;

  const handleSearch = () => {
    const list = lostPropertyService.searchGD({
      gdNumber: gdNumber.trim(),
      gdType,
      subject: subject.trim(),
      entryForOfficer,
      dateFrom,
      dateTo,
    });
    setResults(list);
    if (list.length > 0 && !list.some((r) => r.id === selectedId)) {
      setSelectedId(list[0].id);
    }
  };

  const handleClear = () => {
    setGdNumber("");
    setGdType("Lost Property");
    setDateFrom("");
    setDateTo("");
    setEntryForOfficer("");
    setSubject("");
    const all = lostPropertyService.searchGD({});
    setResults(all);
    setSelectedId("");
  };

  const handleSubmit = () => {
    const chosen = results.find((r) => r.id === selectedId);
    if (!chosen) {
      alert("कृपया तालिका में से एक रोज़नामचा GD प्रविष्टि चुनें (Please select a GD entry from the table).");
      return;
    }
    onSelectGD(chosen);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#081225] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Search &amp; View General Diary (GD खोजने का Popup)
              </h3>
              <p className="text-[11px] text-slate-300">
                रोजनामचा आम में से खोई संपत्ति / Lost Property संबंधित रपट खोजें व जोड़ें
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Criteria Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">GD/SD/DD Number</label>
              <input
                type="text"
                value={gdNumber}
                onChange={(e) => setGdNumber(e.target.value)}
                placeholder="उदा. 003"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">General Diary Type</label>
              <select
                value={gdType}
                onChange={(e) => setGdType(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800 font-medium"
              >
                <option value="Lost Property">Lost Property (खोई संपत्ति)</option>
                <option value="Property Seizure">Property Seizure</option>
                <option value="General Information">General Information</option>
                <option value="All Types">-- All Types --</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date Range From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Date Range To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Entry for (Officer)</label>
              <select
                value={entryForOfficer}
                onChange={(e) => setEntryForOfficer(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
              >
                <option value="">-- All Officers --</option>
                {MOCK_ENQUIRY_OFFICERS_LIST.slice(0, 8).map((o) => (
                  <option key={o.number} value={o.name}>
                    {o.display}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="विषय / Subject"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Show Records</label>
              <select
                value={showRecords}
                onChange={(e) => setShowRecords(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="text-xs font-semibold gap-1.5 text-slate-700 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSearch}
              className="text-xs font-bold gap-1.5 bg-[#0b192c] hover:bg-slate-800 text-white h-8"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </Button>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
            <span className="font-bold">
              खोज परिणाम (Search Results: {results.length})
            </span>
            <span className="text-[11px] text-slate-500">
              एक रपट का चयन करके नीचे &apos;Submit&apos; दबाएं
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-12 text-center">Select</th>
                  <th className="p-2.5">GD/SD/DD Number</th>
                  <th className="p-2.5">General Diary Type</th>
                  <th className="p-2.5">Date Time</th>
                  <th className="p-2.5">Entry For (Officer)</th>
                  <th className="p-2.5">Subject</th>
                  <th className="p-2.5">General Diary Brief</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      कोई GD रपट नहीं मिली। कृपया खोज शर्तें बदलकर पुनः प्रयास करें।
                    </td>
                  </tr>
                ) : (
                  results.map((gd) => {
                    const isSelected = selectedId === gd.id;
                    return (
                      <tr
                        key={gd.id}
                        onClick={() => setSelectedId(gd.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-amber-50/80 font-medium" : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="radio"
                            name="gdSelectRadio"
                            checked={isSelected}
                            onChange={() => setSelectedId(gd.id)}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="p-2.5 font-mono font-bold text-blue-700">{gd.gdNumber}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {gd.gdType}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">{gd.dateTime}</td>
                        <td className="p-2.5 font-semibold text-slate-800">{gd.entryForOfficer}</td>
                        <td className="p-2.5 font-bold text-slate-900">{gd.subject}</td>
                        <td className="p-2.5 text-slate-600 text-[11px] max-w-xs truncate" title={gd.brief}>
                          {gd.brief}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            {selectedId ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                चयनित GD: <strong>{results.find((r) => r.id === selectedId)?.gdNumber || selectedId}</strong>
              </span>
            ) : (
              <span>कोई GD चयनित नहीं</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              className="text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit (चयन करें)</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
