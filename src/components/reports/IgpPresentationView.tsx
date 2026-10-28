"use client";

import React, { useState } from "react";
import { IgpPresentationData } from "@/types/reports";
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  ShieldAlert,
  BarChart3,
  Presentation,
  CheckCircle2,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";

interface IgpPresentationViewProps {
  data: IgpPresentationData;
}

export function IgpPresentationView({ data }: IgpPresentationViewProps) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [viewMode, setViewMode] = useState<"SLIDES" | "DOCUMENT">("SLIDES");
  const totalSlides = 8;

  const handlePrint = () => {
    printA4Element("printable-igp-presentation", `IGP_MEETING_PRESENTATION_${data.district}_${data.meetingDate}`);
  };

  const nextSlide = () => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
  const prevSlide = () => setCurrentSlide((prev) => Math.max(prev - 1, 1));

  return (
    <div className="space-y-4">
      {/* Minimalist Controls Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 text-xs">
            <button
              onClick={() => setViewMode("SLIDES")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "SLIDES" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Interactive Slides</span>
            </button>
            <button
              onClick={() => setViewMode("DOCUMENT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === "DOCUMENT" ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Briefing Document</span>
            </button>
          </div>

          {viewMode === "SLIDES" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 1}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-slate-900 px-1">
                Slide {currentSlide} / {totalSlides}
              </span>
              <button
                onClick={nextSlide}
                disabled={currentSlide === totalSlides}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#0b192c] hover:bg-[#081225] rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Presentation (A4)</span>
          </button>
        </div>
      </div>

      {/* Main Document / Slide View */}
      <div
        id="printable-igp-presentation"
        className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-slate-900 font-sans max-w-5xl mx-auto"
      >
        {data.dataQualityWarnings?.map((warning,i)=><p key={i} className="my-2 border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">{warning}</p>)}
        {/* SLIDE 1: Title & Meeting Header */}
        {(viewMode === "DOCUMENT" || currentSlide === 1) && (
          <div className="text-center border-b pb-8 mb-8 animate-in fade-in-50">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs">
              ह.पु
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              HARYANA POLICE • {data.district}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 tracking-tight">
              IGP Crime, Law & Order and Administrative Issues Review
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 font-medium">
              Meeting held on {data.meetingDate} at {data.meetingTime} at {data.meetingLocation}
            </p>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Comparative Crime Assessment ({data.previousYear ?? new Date().getFullYear()-1} vs {data.currentYear ?? new Date().getFullYear()} Snapshot)
            </p>
          </div>
        )}

        {/* SLIDE 2: Comparative Crime Data Analysis */}
        {(viewMode === "DOCUMENT" || currentSlide === 2) && (
          <div className="mb-8 space-y-3 animate-in fade-in-50">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                1. Comparative Crime Data Analysis (2-Year Snapshot)
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">{data.previousYear ?? new Date().getFullYear()-1} / {data.currentYear ?? new Date().getFullYear()} — available CMS records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Category / Head</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">{data.previousYear ?? new Date().getFullYear()-1} Regd.</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">{data.currentYear ?? new Date().getFullYear()} Regd.</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Change</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Change %</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">{data.currentYear ?? new Date().getFullYear()} Chargesheet %</th>
                    <th className="p-2 text-center w-24">{data.currentYear ?? new Date().getFullYear()} Cases with Arrest %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.comparativeRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-1.5 border-r border-slate-300 font-medium">
                        <span className="text-[10px] text-slate-400 block">{row.category}</span>
                        {row.head}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.reg2025}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-slate-900">{row.reg2026}</td>
                      <td className={`p-1.5 border-r border-slate-300 text-center font-mono font-bold ${row.change < 0 ? "text-emerald-700" : "text-red-700"}`}>
                        {row.change > 0 ? `+${row.change}` : row.change}
                      </td>
                      <td className={`p-1.5 border-r border-slate-300 text-center font-mono ${row.changePct < 0 ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}`}>
                        {row.reg2025 === 0 ? 'N/A' : `${row.changePct}%`}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-blue-900">{row.workoutPct2026}%</td>
                      <td className="p-1.5 text-center font-mono">{row.arrestRate2026}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE 3: Violent Crimes & Extortion Calls */}
        {(viewMode === "DOCUMENT" || currentSlide === 3) && (
          <div className="mb-8 space-y-4 animate-in fade-in-50">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                2. Violent Crimes & Gang Extortion Threat Calls
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Calls</span>
                <p className="text-lg font-black text-slate-900 font-mono mt-0.5">{data.extortionOverview.totalCalls ?? "Not available"}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Cases Regd</span>
                <p className="text-lg font-black text-blue-900 font-mono mt-0.5">{data.extortionOverview.casesRegistered}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Accused Named</span>
                <p className="text-lg font-black text-slate-800 font-mono mt-0.5">{data.extortionOverview.accusedNamed}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="text-[10px] text-emerald-800 uppercase font-semibold">Arrested</span>
                <p className="text-lg font-black text-emerald-900 font-mono mt-0.5">{data.extortionOverview.accusedArrested}</p>
              </div>
              <div className="p-2.5 rounded-xl border border-red-200 bg-red-50">
                <span className="text-[10px] text-red-800 uppercase font-semibold">Pending Arrest</span>
                <p className="text-lg font-black text-red-900 font-mono mt-0.5">{data.extortionOverview.accusedPending}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Identified Active Gang Syndicates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.extortionOverview.gangs.map((g, idx) => (
                  <div key={idx} className="p-2 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{g.gangName}</span>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {g.callsCount} Incidents
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: Pendency of UI Cases (Part A) By Station */}
        {(viewMode === "DOCUMENT" || currentSlide === 4) && (
          <div className="mb-8 space-y-3 animate-in fade-in-50">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                3. Pendency of Under Investigation (UI) Cases By Police Station
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 w-10">SNo.</th>
                    <th className="p-2 border-r border-slate-300">Police Station</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Total Regd.</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Over 2 Yrs</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Over 1 Yr</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20">Over 6 Mos</th>
                    <th className="p-2 border-r border-slate-300 text-center w-20 text-red-700">Total &gt; 6 Mos</th>
                    <th className="p-2 text-center w-20 font-bold">Total UI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.uiPartAByStation.map((row) => (
                    <tr key={row.srNo} className="hover:bg-slate-50/50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.srNo}</td>
                      <td className="p-1.5 border-r border-slate-300 font-bold">{row.stationName}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.totalRegd}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.over2Year}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.over1Year}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.over6Month}</td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold text-red-700">{row.totalOver6Month}</td>
                      <td className="p-1.5 text-center font-mono font-black text-slate-900">{row.totalUi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE 5: Unsolved Heinous Crimes Review */}
        {(viewMode === "DOCUMENT" || currentSlide === 5) && (
          <div className="mb-8 space-y-3 animate-in fade-in-50">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                4. Unsolved Heinous Crime Cases & Direct Action Status
              </h2>
            </div>
            <div className="space-y-3">
              {data.unsolvedHeinousCases.length > 0 ? (
                data.unsolvedHeinousCases.map((c) => (
                  <div key={c.srNo} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-800">{c.head}</span>
                      <span className="text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        थाना {c.station}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-600 font-semibold">{c.firNoDateSection}</p>
                    <p className="text-[11px] text-slate-800 italic pt-1 border-t border-slate-100">
                      <span className="font-bold not-italic">संक्षिप्त तथ्य: </span>
                      {c.briefFactsHindi}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center rounded-xl border border-dashed border-slate-300 text-slate-500 bg-slate-50 text-xs font-semibold">
                  Nil (कोई अनसुलझा जघन्य अपराध नहीं)
                </div>
              )}
            </div>
          </div>
        )}

        {/* SLIDE 6: Active Criminals Checking (RJSF Pattern) */}
        {(viewMode === "DOCUMENT" || currentSlide === 6) && (
          <div className="mb-8 space-y-3 animate-in fade-in-50">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                5. Checking of Active Criminals (RJSF Pattern & FRS Verification)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">PS</th>
                    <th className="p-2 border-r border-slate-300 text-center">Total</th>
                    <th className="p-2 border-r border-slate-300 text-center">Present</th>
                    <th className="p-2 border-r border-slate-300 text-center">In Jail</th>
                    <th className="p-2 border-r border-slate-300 text-center">Absent/Fugitive</th>
                    <th className="p-2 border-r border-slate-300 text-center">Checked %</th>
                    <th className="p-2 text-center text-blue-900 font-bold">FRS Upload %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.activeCriminals.length > 0 ? (
                    data.activeCriminals.map((row) => (
                      <tr key={row.srNo} className="hover:bg-slate-50/50">
                        <td className="p-1.5 border-r border-slate-300 font-bold">{row.stationName}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.totalCriminals}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono text-emerald-700">{row.present}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{row.inJail}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono text-amber-700">{row.absent}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{row.criminalCheckingPct}%</td>
                        <td className="p-1.5 text-center font-mono font-bold text-blue-900">{row.frsPct}%</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-3 text-center text-slate-500 italic font-medium">
                        Nil (कोई सक्रिय अपराधी सूची दर्ज नहीं)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE 7: Action on NDPS & LSL Seizures */}
        {(viewMode === "DOCUMENT" || currentSlide === 7) && (
          <div className="mb-8 space-y-3 animate-in fade-in-50">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                6. Action on NDPS Act Seizures (Yearly Comparison)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-slate-300 text-left">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">Substance Head</th>
                    <th className="p-2 border-r border-slate-300 text-center">2023</th>
                    <th className="p-2 border-r border-slate-300 text-center">2024</th>
                    <th className="p-2 border-r border-slate-300 text-center">2025</th>
                    <th className="p-2 text-center font-bold text-slate-900">2026 (Upto Current)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.ndpsStats.length > 0 ? (
                    data.ndpsStats.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-1.5 border-r border-slate-300 font-semibold">{row.substance}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono text-[11px]">{row.yr2023}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono text-[11px]">{row.yr2024}</td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono text-[11px]">{row.yr2025}</td>
                        <td className="p-1.5 text-center font-mono font-bold text-[11px] text-blue-900">{row.yr2026}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-3 text-center text-slate-500 italic font-medium">
                        Nil (कोई एनडीपीएस जब्ती दर्ज नहीं)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLIDE 8: Cyber Crime Complaints & Financial Recovery */}
        {(viewMode === "DOCUMENT" || currentSlide === 8) && (
          <div className="space-y-4 animate-in fade-in-50">
            <div className="border-b pb-2">
              <h2 className="text-sm font-black text-slate-900 uppercase">
                7. Cyber Crime Complaints Pendency & Financial Recovery
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase">Complaints Received ({data.currentYear ?? new Date().getFullYear()})</span>
                <p className="text-base font-black text-slate-900 font-mono mt-1">{data.cyberOverview.complaints2026}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase">Defrauded Amount ({data.currentYear ?? new Date().getFullYear()})</span>
                <p className="text-sm font-bold text-red-900 font-mono mt-1">{data.cyberOverview.defrauded2026}</p>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] text-slate-500 uppercase">FIRs Registered ({data.currentYear ?? new Date().getFullYear()})</span>
                <p className="text-base font-black text-blue-900 font-mono mt-1">{data.cyberOverview.firs2026}</p>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="text-[10px] text-emerald-800 uppercase font-semibold">Recovered / Released</span>
                <p className="text-sm font-black text-emerald-900 font-mono mt-1">{data.cyberOverview.recovered2026}</p>
              </div>
            </div>
          </div>
        )}

        {/* Slide Presentation Footer */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Haryana Police • Official Crime Review Docket</span>
          <span className="font-mono">{data.district} District Police Line</span>
        </div>
      </div>
    </div>
  );
}
