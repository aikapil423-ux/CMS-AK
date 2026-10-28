"use client";

import React, { useState } from "react";
import { WeeklyCrimeDiaryData } from "@/types/reports";
import { Printer, Download, Search, Car, Users, Calendar } from "lucide-react";
import { printA4Element } from "@/utils/printElement";

interface WeeklyCrimeDiaryViewProps {
  data: WeeklyCrimeDiaryData;
}

export function WeeklyCrimeDiaryView({ data }: WeeklyCrimeDiaryViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState<"ALL" | "PART_VIII_UI" | "COMPLAINTS_05P" | "PARTIAL_CHALLANS" | "OVERVIEW">("ALL");

  const handlePrint = () => {
    printA4Element("printable-weekly-diary", `WEEKLY_CRIME_DIARY_${data.policeStation}_${data.dateRange.replace(/\s+/g, "_")}`);
  };

  const handleExportCsv = () => {
    const headers = ["FIR No", "Date", "Head", "U/S", "Amount", "Place", "Accused Arrested", "Accused Pending", "IO Name & Mobile", "Action Taken"];
    const rows = data.uiCasesPartA.map((c) => [
      `"${c.firNo}"`,
      `"${c.date}"`,
      `"${c.head}"`,
      `"${c.us}"`,
      `"${c.amount}"`,
      `"${c.placeOfOccurrence}"`,
      c.noOfAccusedArrested,
      c.noOfAccusedPendingArrest,
      `"${c.ioNameMobile}"`,
      `"${c.actionTaken}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WEEKLY_DIARY_UI_CASES_${data.policeStation}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUiCases = data.uiCasesPartA.filter(
    (c) =>
      !searchTerm ||
      c.firNo.includes(searchTerm) ||
      c.head.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ioNameMobile.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.us.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Minimalist Controls */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search FIR, Section, IO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-[11px] font-medium">
            <button
              onClick={() => setActiveSection("ALL")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeSection === "ALL" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Full Diary
            </button>
            <button
              onClick={() => setActiveSection("PART_VIII_UI")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeSection === "PART_VIII_UI" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active UI Cases ({data.uiCasesPartA.length})
            </button>
            <button
              onClick={() => setActiveSection("COMPLAINTS_05P")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeSection === "COMPLAINTS_05P" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Complaints 05-P ({data.pendingComplaints.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0b192c] hover:bg-[#081225] rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Diary (A4)</span>
          </button>
        </div>
      </div>

      {/* Printable Weekly Diary Document */}
      <div
        id="printable-weekly-diary"
        className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-900 font-sans max-w-5xl mx-auto space-y-6"
      >
{data.dataQualityWarnings?.map((warning,i)=><p key={i} className="my-2 border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">{warning}</p>)}
        {/* Header Block */}
        <div className="border-b pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              POLICE STATION: {data.policeStation} • {data.district}
            </span>
            <h1 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Police Station Weekly Crime Diary
            </h1>
            <p className="text-xs font-mono font-semibold text-slate-600">
              ({data.dateRange})
            </p>
          </div>
          <div className="text-xs text-slate-700 space-y-0.5 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0">
            <p><span className="font-bold">SHO:</span> {data.shoName} <span className="text-slate-400 text-[10px]">(Since {data.shoPostedSince})</span></p>
            <p><span className="font-bold">MHC:</span> {data.mhcName} <span className="text-slate-400 text-[10px]">(Since {data.mhcPostedSince})</span></p>
            <p><span className="font-bold">SO:</span> {data.soName} <span className="text-slate-400 text-[10px]">(Since {data.soChargeSince})</span></p>
          </div>
        </div>

        {/* Staff Strength & Vehicle Details (Compact Grid) */}
        {(activeSection === "ALL" || activeSection === "OVERVIEW") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staff Strength */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  Staff Strength (Total: {data.staffStrength.total})
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">INSP</p><p className="font-bold">{data.staffStrength.insp}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">SI/PSI</p><p className="font-bold">{data.staffStrength.siPsi}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">ASI</p><p className="font-bold">{data.staffStrength.asiLasi}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">HC</p><p className="font-bold">{data.staffStrength.hcLhc}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">CT</p><p className="font-bold">{data.staffStrength.ehcCt}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">SPO</p><p className="font-bold">{data.staffStrength.spo}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">HGH</p><p className="font-bold">{data.staffStrength.hgh}</p></div>
                <div className="bg-white p-1 rounded border border-slate-200"><p className="text-slate-400">HKRN</p><p className="font-bold">{data.staffStrength.hkrn}</p></div>
              </div>
            </div>

            {/* Vehicles */}
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-600" />
                  Police Vehicles ({data.vehicles.length})
                </span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {data.vehicles.length > 0 ? (
                  data.vehicles.map((v) => (
                    <div key={v.vehicleNo} className="bg-white p-1.5 rounded border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900">{v.vehicleNo}</span>
                        <span className="text-slate-500 text-[10px] ml-2">({v.makeModel} • {v.year})</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-600">ODO: {v.odometerReading} km</span>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-2 text-center rounded border border-slate-200 text-slate-500 italic text-[11px]">
                    Nil (कोई वाहन पंजीकृत नहीं)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 12 Parts Statutory Index */}
        {(activeSection === "ALL" || activeSection === "OVERVIEW") && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Statutory 12-Part Crime Summary
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-24">Part</th>
                    <th className="p-2 border-r border-slate-300">Description</th>
                    <th className="p-2 w-44 font-mono">Remarks / Disposal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.part1to12Overview.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-1.5 border-r border-slate-300 font-bold text-slate-800">{item.part}</td>
                      <td className="p-1.5 border-r border-slate-300">{item.table}</td>
                      <td className="p-1.5 font-mono text-[11px] font-semibold text-slate-700">{item.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PART VIII - Active Under Investigation Cases (Part A) */}
        {(activeSection === "ALL" || activeSection === "PART_VIII_UI") && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                PART VIII: List of Under Investigation Cases (Part A) ({filteredUiCases.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-12">Sr.</th>
                    <th className="p-2 border-r border-slate-300 w-28">FIR No. & Date</th>
                    <th className="p-2 border-r border-slate-300">Head & U/S</th>
                    <th className="p-2 border-r border-slate-300 w-24">Amount</th>
                    <th className="p-2 border-r border-slate-300">Brief Facts</th>
                    <th className="p-2 border-r border-slate-300 w-28">Arrest Status</th>
                    <th className="p-2 border-r border-slate-300 w-36">IO Name & Mob</th>
                    <th className="p-2">Action Taken & Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUiCases.length > 0 ? (
                    filteredUiCases.map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-[11px]">
                          {c.firNo}
                          <div className="text-[10px] text-slate-500 font-normal">{c.date}</div>
                          <span className="text-[9px] bg-amber-50 text-amber-800 px-1 rounded border border-amber-200">
                            {c.ageCategory}
                          </span>
                        </td>
                        <td className="p-1.5 border-r border-slate-300">
                          <p className="font-semibold text-slate-900">{c.head}</p>
                          <p className="font-mono text-[10px] text-slate-500">{c.us}</p>
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono font-semibold text-slate-800">
                          {c.amount ? `₹ ${c.amount}` : "Nil"}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-[11px] max-w-xs truncate" title={c.briefFacts}>
                          {c.briefFacts}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-[10px]">
                          <p className="text-emerald-700 font-bold">Arrested: {c.noOfAccusedArrested}</p>
                          <p className="text-red-700">Pending: {c.noOfAccusedPendingArrest}</p>
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-[11px] font-medium">{c.ioNameMobile}</td>
                        <td className="p-1.5 text-[11px] space-y-0.5">
                          <p className="text-slate-800">{c.actionTaken}</p>
                          {c.pendingReason && <p className="text-amber-800 text-[10px] italic">{c.pendingReason}</p>}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-3 text-center text-slate-500 italic font-medium">
                        Nil (कोई अनुसंधान मामला लंबित नहीं)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status of Complaints 05-P */}
        {(activeSection === "ALL" || activeSection === "COMPLAINTS_05P") && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              Status of Complaints 05-P (Pending Enquiries: {data.pendingComplaints.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-12">Sr.</th>
                    <th className="p-2 border-r border-slate-300 w-28">PS Diary No.</th>
                    <th className="p-2 border-r border-slate-300 w-24">Date</th>
                    <th className="p-2 border-r border-slate-300">Complainant Name & Mobile</th>
                    <th className="p-2 border-r border-slate-300">I/O & Mob No.</th>
                    <th className="p-2 border-r border-slate-300 w-28">Office Diary No.</th>
                    <th className="p-2 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.pendingComplaints.length > 0 ? (
                    data.pendingComplaints.map((comp) => (
                      <tr key={comp.srNo} className="hover:bg-slate-50/50">
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{comp.srNo}</td>
                        <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-[11px] text-blue-900">
                          {comp.psDiaryNo}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{comp.dateOfReceipt}</td>
                        <td className="p-1.5 border-r border-slate-300 font-medium">{comp.complainantNameMobile}</td>
                        <td className="p-1.5 border-r border-slate-300 font-medium text-slate-800">{comp.ioNameMobile}</td>
                        <td className="p-1.5 border-r border-slate-300 font-mono text-[11px]">{comp.officeDiaryNo}</td>
                        <td className="p-1.5 text-center">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {comp.cctnsNo}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-500 italic font-medium">
                        Nil (कोई शिकायत 05-P लंबित नहीं)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* State-wise Pending Parcha 12 Table */}
        {(activeSection === "ALL" || activeSection === "OVERVIEW") && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Parcha 12 Pending State-Wise Breakdown
            </h3>
            <div className="flex flex-wrap gap-2 text-xs">
              {data.parcha12Pending.map((p) => (
                <div key={p.state} className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-2">
                  <span className="font-semibold text-slate-700">{p.state}:</span>
                  <span className="font-mono font-bold text-slate-900">{p.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signatures Block */}
        <div className="pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-700">Prepared by:</p>
            <p className="font-bold text-slate-900">{data.preparedByName}</p>
            <p className="text-[10px] text-slate-500 font-mono">Date: {data.preparedByDate}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Counter Signature of MHC:</p>
            <p className="font-bold text-slate-900">{data.mhcName}</p>
            <p className="text-[10px] text-slate-500 font-mono">Dated: {data.dateRange.split("TO")[1] || data.preparedByDate}</p>
          </div>
          <div>
            <p className="font-semibold text-slate-700">Counter Signature of SHO:</p>
            <p className="font-bold text-slate-900">{data.shoName}</p>
            <p className="text-[10px] text-slate-500 font-mono">Station House Officer, {data.policeStation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
