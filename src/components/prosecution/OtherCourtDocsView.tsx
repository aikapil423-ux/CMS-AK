"use client";

import React, { useState, useEffect } from "react";
import { CourtMiscApplicationRecord } from "@/types/prosecution";
import { ProsecutionService } from "@/services/prosecutionService";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Printer,
  Trash2,
  Calendar,
  X,
  FileCheck2,
  Building,
  Eye,
  Tag,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";

const APPLICATION_TYPE_CONFIG: Record<
  CourtMiscApplicationRecord["applicationType"],
  { label: string; section: string; color: string }
> = {
  PRODUCTION_WARRANT: {
    label: "Production Warrant",
    section: "Sec. 302 BNSS (Sec. 267 CrPC)",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  NON_BAILABLE_WARRANT: {
    label: "Non-Bailable Warrant (NBW)",
    section: "Sec. 72 BNSS (Sec. 70 CrPC)",
    color: "bg-rose-100 text-rose-800 border-rose-200",
  },
  PROCLAMATION_84_BNSS: {
    label: "Proclamation / Attachment",
    section: "Sec. 84 & 85 BNSS (Sec. 82/83 CrPC)",
    color: "bg-amber-100 text-amber-800 border-amber-200",
  },
  POLICE_REMAND: {
    label: "Police Custody Remand",
    section: "Sec. 187 BNSS (Sec. 167 CrPC)",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  CASE_DIARY_SUBMISSION: {
    label: "Case Diary Submission",
    section: "Sec. 192 BNSS (Sec. 172 CrPC)",
    color: "bg-teal-100 text-teal-800 border-teal-200",
  },
  DISPOSAL_OF_PROPERTY: {
    label: "Disposal of Case Property",
    section: "Sec. 497 BNSS (Sec. 451 CrPC)",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

const COURT_OPTIONS = [
  "Court of Ld. Chief Judicial Magistrate (CJM), Panipat",
  "Court of Ld. Judicial Magistrate First Class (JMIC), Panipat",
  "Court of Ld. Additional District & Sessions Judge, Panipat",
  "Court of Ld. Sessions Judge, Panipat",
];

export function OtherCourtDocsView() {
  const [apps, setApps] = useState<CourtMiscApplicationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState<CourtMiscApplicationRecord | null>(null);

  const availableFirs = ProsecutionService.getAvailableFirs();

  // Form State
  const [appType, setAppType] = useState<CourtMiscApplicationRecord["applicationType"]>("NON_BAILABLE_WARRANT");
  const [selectedFir, setSelectedFir] = useState(availableFirs[0]?.firNumber || "");
  const [courtName, setCourtName] = useState(COURT_OPTIONS[0]);
  const [targetPerson, setTargetPerson] = useState("");
  const [grounds, setGrounds] = useState("");
  const [hearingDate, setHearingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString("en-IN");
  });

  const loadData = async () => {
    const data = await ProsecutionService.getMiscApplications();
    setApps(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFirChange = (firNo: string) => {
    setSelectedFir(firNo);
    const meta = availableFirs.find((f) => f.firNumber === firNo);
    if (meta) {
      setTargetPerson(meta.accusedNames.split(",")[0] || "");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const firMeta = availableFirs.find((f) => f.firNumber === selectedFir) || availableFirs[0];

    const newApp: CourtMiscApplicationRecord = {
      id: `app-${Date.now()}`,
      applicationType: appType,
      firNumber: selectedFir,
      policeStation: firMeta?.policeStation || "PS City Panipat",
      courtName,
      targetPersonName: targetPerson || firMeta?.accusedNames || "Accused",
      groundsAndFacts: grounds || "Application submitted in accordance with statutory procedures.",
      hearingDate,
      status: "FILED",
      filingDate: new Date().toLocaleDateString("en-IN"),
      officerName: `${firMeta?.ioRank || "SI"} ${firMeta?.ioName || "IO"}`,
    };

    await ProsecutionService.saveMiscApplication(newApp);
    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this application?")) {
      await ProsecutionService.deleteMiscApplication(id);
      loadData();
      if (viewingApp?.id === id) setViewingApp(null);
    }
  };

  const resetForm = () => {
    setGrounds("");
    setTargetPerson("");
  };

  const filteredApps = apps.filter((a) => {
    const matchSearch =
      a.firNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.targetPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.applicationType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === "ALL" || a.applicationType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Court Applications & Warrants (अन्य अदालती प्रार्थना पत्र)
          </h2>

        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          New Court Application
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search FIR, accused person, court..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Applications</option>
            {Object.entries(APPLICATION_TYPE_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Application Type & Sec</th>
                <th className="py-3 px-4">Target Person / Accused</th>
                <th className="py-3 px-4">FIR & Police Station</th>
                <th className="py-3 px-4">Target Court</th>
                <th className="py-3 px-4">Hearing Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No court applications found.
                  </td>
                </tr>
              ) : (
                filteredApps.map((a) => {
                  const cfg = APPLICATION_TYPE_CONFIG[a.applicationType];
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${cfg?.color}`}>
                          {cfg?.label || a.applicationType}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{cfg?.section}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{a.targetPersonName}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{a.firNumber}</div>
                        <div className="text-[11px] text-slate-500">{a.policeStation}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-[200px] truncate" title={a.courtName}>
                        {a.courtName}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {a.hearingDate}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => setViewingApp(a)}
                            title="View / Print A4 Application"
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            title="Delete Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE APPLICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">Draft Court Application</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Type */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Type</label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as CourtMiscApplicationRecord["applicationType"])}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.entries(APPLICATION_TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label} ({v.section})
                    </option>
                  ))}
                </select>
              </div>

              {/* FIR & Court */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target FIR No.</label>
                  <select
                    value={selectedFir}
                    onChange={(e) => handleFirChange(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    {availableFirs.map((f) => (
                      <option key={f.firNumber} value={f.firNumber}>
                        {f.firNumber} ({f.policeStation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hon&apos;ble Court</label>
                  <select
                    value={courtName}
                    onChange={(e) => setCourtName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    {COURT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Person & Hearing Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Person / Accused</label>
                  <input
                    type="text"
                    placeholder="Full name of accused/person"
                    value={targetPerson}
                    onChange={(e) => setTargetPerson(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Hearing / Filing</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Grounds and Facts */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Grounds & Facts Supporting Application</label>
                <textarea
                  rows={4}
                  value={grounds}
                  onChange={(e) => setGrounds(e.target.value)}
                  placeholder="Detail why NBW / Production Warrant / Remand is required. Mention previous attempts to serve, custody in another jail, or pending recoveries..."
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW / PRINT MODAL */}
      {viewingApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-6 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm">Application Preview</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printA4Element("court-app-dossier")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print A4
                </button>
                <button onClick={() => setViewingApp(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Container */}
            <div className="p-6 overflow-y-auto max-h-[80vh] bg-slate-100 flex justify-center">
              <div
                id="court-app-dossier"
                className="bg-white p-8 rounded-lg shadow-sm border border-slate-300 w-full max-w-[210mm] text-slate-900 font-serif leading-relaxed text-xs"
              >
                {/* Court Header */}
                <div className="text-center border-b-2 border-black pb-4 mb-4">
                  <p className="font-bold text-sm tracking-wide uppercase">
                    IN THE COURT OF {viewingApp.courtName.toUpperCase()}
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    State of Haryana vs {viewingApp.targetPersonName}
                  </p>
                  <p className="text-[11px] font-sans text-slate-600 mt-0.5">
                    Case: <strong>{viewingApp.firNumber}</strong>, PS: {viewingApp.policeStation}
                  </p>
                </div>

                <div className="text-center font-bold text-xs uppercase underline tracking-wider mb-5">
                  APPLICATION FOR {APPLICATION_TYPE_CONFIG[viewingApp.applicationType]?.label.toUpperCase()} UNDER{" "}
                  {APPLICATION_TYPE_CONFIG[viewingApp.applicationType]?.section.toUpperCase()}
                </div>

                {/* Body Paragraphs */}
                <div className="space-y-3 font-sans text-xs">
                  <p>
                    <span className="font-bold font-serif">MOST RESPECTFULLY SHOWETH:</span>
                  </p>

                  <p>
                    1. That the above-mentioned case has been registered at Police Station{" "}
                    <strong>{viewingApp.policeStation}</strong> and is currently under investigation.
                  </p>

                  <p>
                    2. That the target person/accused <strong>{viewingApp.targetPersonName}</strong> is directly involved in the commission of the alleged offences.
                  </p>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded">
                    <p className="font-semibold text-slate-800 mb-1">3. Grounds and Material Circumstances:</p>
                    <p className="text-slate-700 whitespace-pre-line">{viewingApp.groundsAndFacts}</p>
                  </div>

                  <p>
                    4. That the present application is being made bona fide and in the interest of fair justice to secure the presence/custody/compliance of the accused.
                  </p>

                  <p className="pt-2">
                    <strong>PRAYER:</strong>
                  </p>
                  <p className="italic pl-4 border-l-2 border-indigo-500 text-slate-800">
                    It is therefore respectfully prayed that this Hon&apos;ble Court may kindly be pleased to issue/allow{" "}
                    <strong>{APPLICATION_TYPE_CONFIG[viewingApp.applicationType]?.label}</strong> against accused{" "}
                    <strong>{viewingApp.targetPersonName}</strong> in the interest of justice.
                  </p>
                </div>

                {/* Signatures */}
                <div className="mt-12 flex justify-between items-end font-sans text-xs pt-6 border-t border-slate-300">
                  <div>
                    <p className="text-[11px] text-slate-500">Date: {viewingApp.filingDate}</p>
                    <p className="text-[11px] text-slate-500">Place: Panipat</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-black mb-1 mx-auto"></div>
                    <p className="font-semibold">{viewingApp.officerName}</p>
                    <p className="text-[10px] text-slate-500">Investigating Officer / PS {viewingApp.policeStation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
