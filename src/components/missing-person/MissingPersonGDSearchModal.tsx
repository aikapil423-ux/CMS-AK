"use client";

import React, { useState } from "react";
import { X, Search, RotateCcw, Check, FileText } from "lucide-react";
import { GDSearchResultItem } from "@/types/lostProperty";
import { MOCK_MP_GD_SEARCH_RESULTS } from "@/services/missingPersonService";

interface MissingPersonGDSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGd: (item: GDSearchResultItem) => void;
}

export const MissingPersonGDSearchModal: React.FC<MissingPersonGDSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectGd,
}) => {
  const [gdNumber, setGdNumber] = useState("002");
  const [gdType, setGdType] = useState("Missing person");
  const [dateFrom, setDateFrom] = useState("2019-04-19");
  const [dateTo, setDateTo] = useState("2019-04-19");
  const [officer, setOfficer] = useState("");
  const [subject, setSubject] = useState("Missing Person Report - Monu");
  const [showRecords, setShowRecords] = useState("10");

  const [selectedItem, setSelectedItem] = useState<GDSearchResultItem | null>(
    MOCK_MP_GD_SEARCH_RESULTS[0] || null
  );

  const [results, setResults] = useState<GDSearchResultItem[]>(
    MOCK_MP_GD_SEARCH_RESULTS
  );

  if (!isOpen) return null;

  const handleSearch = () => {
    let filtered = MOCK_MP_GD_SEARCH_RESULTS;
    if (gdNumber.trim()) {
      filtered = filtered.filter((item) =>
        item.gdNumber.toLowerCase().includes(gdNumber.toLowerCase().trim())
      );
    }
    if (subject.trim()) {
      filtered = filtered.filter((item) =>
        item.subject.toLowerCase().includes(subject.toLowerCase().trim())
      );
    }
    setResults(filtered);
    if (filtered.length > 0) {
      setSelectedItem(filtered[0]);
    } else {
      setSelectedItem(null);
    }
  };

  const handleClear = () => {
    setGdNumber("");
    setGdType("Missing person");
    setDateFrom("");
    setDateTo("");
    setOfficer("");
    setSubject("");
    setResults(MOCK_MP_GD_SEARCH_RESULTS);
    setSelectedItem(null);
  };

  const handleSubmit = () => {
    if (!selectedItem) {
      alert("Please select a GD record from the table.");
      return;
    }
    onSelectGd(selectedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide text-white">
              Search &amp; View General Diary (रोज़नामचा आम खोजें)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Box */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                GD/SD/DD Number
              </label>
              <input
                type="text"
                value={gdNumber}
                onChange={(e) => setGdNumber(e.target.value)}
                placeholder="e.g. 002"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                General Diary Type
              </label>
              <select
                value={gdType}
                onChange={(e) => setGdType(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              >
                <option value="Missing person">Missing person</option>
                <option value="Lost Property">Lost Property</option>
                <option value="Information">Information</option>
                <option value="Law & Order">Law &amp; Order</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Entry for (Officer)
              </label>
              <select
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              >
                <option value="">All Officers</option>
                <option value="ASI Sandeep Singh">ASI Sandeep Singh - 49102</option>
                <option value="SI Rajesh Kumar">SI Rajesh Kumar</option>
                <option value="Inspector Lalit Kumar">Inspector Lalit Kumar - 53175</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Date Range From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Date Range To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject keyword..."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Show Records
              </label>
              <select
                value={showRecords}
                onChange={(e) => setShowRecords(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              >
                <option value="10">10 Records</option>
                <option value="25">25 Records</option>
                <option value="50">50 Records</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-semibold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3 w-14 text-center">Select</th>
                  <th className="py-2.5 px-3">GD/SD/DD Number</th>
                  <th className="py-2.5 px-3">General Diary Type</th>
                  <th className="py-2.5 px-3">Date Time</th>
                  <th className="py-2.5 px-3">Entry For (Officer)</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-4 min-w-[200px]">General Diary Brief</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {results.length > 0 ? (
                  results.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? "bg-blue-50/90 font-medium"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="radio"
                          name="selectedGd"
                          checked={selectedItem?.id === item.id}
                          onChange={() => setSelectedItem(item)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                        {item.gdNumber}
                      </td>
                      <td className="py-2.5 px-3">{item.gdType}</td>
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                        {item.dateTime}
                      </td>
                      <td className="py-2.5 px-3">{item.entryForOfficer}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.subject}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                        {item.brief}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 italic">
                      No matching GD records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Selected:{" "}
            {selectedItem ? (
              <strong className="text-blue-900 font-mono">
                GD #{selectedItem.gdNumber} ({selectedItem.dateTime})
              </strong>
            ) : (
              "None"
            )}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedItem}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Submit Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
