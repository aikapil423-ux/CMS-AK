"use client";

import React, { useState, useEffect } from "react";
import { SavedReportEntry, CrimeSitrepData } from "@/types/reports";
import { ReportsService } from "@/services/reportsService";
import {
  FileText,
  Trash2,
  Eye,
  Printer,
  Calendar,
  Building2,
  Download,
  Search,
  CheckCircle,
  FileBarChart,
} from "lucide-react";
import { printA4Element } from "@/utils/printElement";
import { downloadSitrepDataAsPdf } from "@/utils/sitrepPdfGenerator";

interface SavedReportsViewProps {
  onLoadSitrepReport: (data: CrimeSitrepData) => void;
}

export function SavedReportsView({ onLoadSitrepReport }: SavedReportsViewProps) {
  const [reports, setReports] = useState<SavedReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await ReportsService.getSavedReports();
      setReports(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    const handleUpdate = () => {
      loadReports();
    };
    window.addEventListener("cms_saved_reports_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("cms_saved_reports_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("क्या आप इस सहेजी गई रिपोर्ट को हटाना चाहते हैं? (Are you sure you want to delete this saved report?)")) {
      await ReportsService.deleteSavedReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setNotification("रिपोर्ट सफलतापूर्वक हटा दी गई (Report deleted successfully)");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDownloadPdf = async (report: SavedReportEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingReportId(report.id);
    try {
      if (report.data) {
        await downloadSitrepDataAsPdf(report.data as CrimeSitrepData);
        setNotification(`रिपोर्ट ${report.id} का PDF डाउनलोड हो गया!`);
        setTimeout(() => setNotification(null), 3500);
      }
    } catch (err) {
      console.error("PDF download failed", err);
      setNotification("PDF डाउनलोड करने में त्रुटि आई।");
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleDownloadJson = (report: SavedReportEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.id}_${report.district}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredReports = reports.filter(
    (r) =>
      !searchTerm ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportDate.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            {notification}
          </span>
          <button onClick={() => setNotification(null)} className="text-emerald-300 hover:text-white">✕</button>
        </div>
      )}

      {/* Control & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Saved Reports (ID, District, Date)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <FileBarChart className="w-4 h-4 text-slate-400" />
          <span>Total Saved Reports: <strong>{reports.length}</strong></span>
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          सहेजी गई रिपोर्ट लोड हो रही हैं... (Loading saved reports...)
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
            कोई सहेजी गई रिपोर्ट नहीं मिली (No Saved Reports Found)
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            "CrimeSITREP_District" टैब पर जाएँ और <strong>Generate CrimeSITREP</strong> बटन पर क्लिक करके रिपोर्ट तैयार करें। रिपोर्ट यहाँ स्वचालित रूप से सहेजी जाएगी।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-400 shadow-2xs hover:shadow-xs transition-all space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 uppercase tracking-wider font-mono">
                    {report.reportTitle}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    District {report.district}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">ID: {report.id}</p>
                </div>
                <span className="text-right text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                  <span className="font-bold text-slate-900">{report.caseCount}</span> Cases
                </span>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Report Date</span>
                  <span className="font-medium font-mono text-slate-900 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {report.reportDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Generated For</span>
                  <span className="font-medium text-slate-900 truncate block">
                    {report.generatedByRole}
                  </span>
                </div>
                <div className="col-span-2 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">Created: </span>
                  <span className="font-mono">{report.generatedAt}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => onLoadSitrepReport(report.data as CrimeSitrepData)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-[#0b192c] hover:bg-[#081225] transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open & Edit</span>
                </button>

                <button
                  onClick={(e) => handleDownloadPdf(report, e)}
                  disabled={downloadingReportId === report.id}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors active:scale-95"
                  title="Download in PDF format matching the police template"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingReportId === report.id ? "animate-spin" : ""}`} />
                  <span>{downloadingReportId === report.id ? "PDF..." : "Download PDF"}</span>
                </button>

                <button
                  onClick={(e) => handleDelete(report.id, e)}
                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  title="Delete Report"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
