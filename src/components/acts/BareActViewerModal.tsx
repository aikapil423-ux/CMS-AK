"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  BookOpen,
  X,
  Download,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { LegalActItem } from "@/types";
import { ActsService } from "@/services/actsService";
import { Button } from "@/components/ui/button";

interface BareActViewerModalProps {
  act: LegalActItem | null;
  initialPageNumber?: number | null;
  onClose: () => void;
}

export function BareActViewerModal({
  act: initialAct,
  initialPageNumber = null,
  onClose,
}: BareActViewerModalProps) {
  const [activeAct, setActiveAct] = useState<LegalActItem | null>(initialAct);
  const [targetPageNumber, setTargetPageNumber] = useState<number | null>(initialPageNumber);

  // Document Viewer Modes & Blob URL Resolution
  const [docViewerMode, setDocViewerMode] = useState<"EMBED" | "GAZETTE">("EMBED");
  const [resolvedDocumentUrl, setResolvedDocumentUrl] = useState<string>("");
  const [isLoadingFullDocument, setIsLoadingFullDocument] = useState<boolean>(false);

  useEffect(() => {
    setActiveAct(initialAct);
  }, [initialAct]);

  useEffect(() => {
    if (initialPageNumber !== undefined) setTargetPageNumber(initialPageNumber);
  }, [initialPageNumber]);

  // Prepare resolved document URL (converts Base64 dataUrls to Blob URLs and resolves IndexedDB if needed)
  useEffect(() => {
    let createdBlobUrl: string | null = null;

    if (!activeAct) {
      setResolvedDocumentUrl("");
      setIsLoadingFullDocument(false);
      return;
    }

    const prepareDocumentUrl = async () => {
      // 1. Direct fileUrl (built-in acts)
      if (activeAct.fileUrl) {
        setResolvedDocumentUrl(activeAct.fileUrl);
        return;
      }

      // 2. Base64 fileDataUrl
      if (activeAct.fileDataUrl) {
        if (activeAct.fileDataUrl.startsWith("data:application/pdf;base64,")) {
          try {
            const base64Data = activeAct.fileDataUrl.replace(/^data:application\/pdf;base64,/, "");
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            createdBlobUrl = URL.createObjectURL(blob);
            setResolvedDocumentUrl(createdBlobUrl);
            return;
          } catch (e) {
            console.warn("Failed to convert dataUrl to Blob URL:", e);
            setResolvedDocumentUrl(activeAct.fileDataUrl);
            return;
          }
        }
        setResolvedDocumentUrl(activeAct.fileDataUrl);
        return;
      }

      // 3. Fallback for acts where payload was stored in IndexedDB (hasLargeFileInIdb)
      if (activeAct.hasLargeFileInIdb) {
        setIsLoadingFullDocument(true);
        try {
          const fullActs = await ActsService.getAllActsAsync();
          const match = fullActs.find((a) => a.id === activeAct.id);
          if (match && match.fileDataUrl) {
            setActiveAct(match);
            if (match.fileDataUrl.startsWith("data:application/pdf;base64,")) {
              const base64Data = match.fileDataUrl.replace(/^data:application\/pdf;base64,/, "");
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: "application/pdf" });
              createdBlobUrl = URL.createObjectURL(blob);
              setResolvedDocumentUrl(createdBlobUrl);
            } else {
              setResolvedDocumentUrl(match.fileDataUrl);
            }
          }
        } catch (e) {
          console.warn("Failed to load large act from IndexedDB:", e);
        } finally {
          setIsLoadingFullDocument(false);
        }
      }
    };

    prepareDocumentUrl();

    return () => {
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [activeAct]);

  if (!activeAct) return null;

  const targetDocumentUrl = resolvedDocumentUrl || activeAct.fileUrl || activeAct.fileDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full h-[92vh] flex flex-col z-10 animate-in fade-in-0 zoom-in-95 overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0b192c] via-[#10243e] to-[#0b192c] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                {activeAct.shortName}
              </span>
              <span className="text-xs text-slate-300 font-mono">{activeAct.actNumber}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                {activeAct.totalSections} Sections &bull; {activeAct.totalChapters} Chapters
              </span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded border border-blue-700/50">
                {activeAct.categoryLabel}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-2xl">
              {activeAct.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ORIGINAL DOCUMENT PREVIEW (PDF / GAZETTE EMBED) */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 p-0">

            {/* Document View Body */}
            {isLoadingFullDocument ? (
              <div className="flex-1 min-h-[70vh] bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8 space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-slate-700">दस्तावेज़ लोड हो रहा है... (Loading Document Data...)</p>
              </div>
            ) : docViewerMode === "GAZETTE" || !targetDocumentUrl ? (
              /* Gazette View / Fallback */
              <div className="flex-1 bg-white rounded-2xl border border-slate-300 p-6 md:p-10 shadow-sm overflow-y-auto space-y-6">
                {/* Gazette Header */}
                <div className="text-center border-b-2 border-slate-900 pb-6 space-y-2">
                  <div className="font-serif text-lg md:text-xl font-black tracking-widest text-slate-900 uppercase">
                    भारत का राजपत्र / THE GAZETTE OF INDIA
                  </div>
                  <div className="text-xs font-serif font-bold text-slate-700 uppercase tracking-wider">
                    असाधारण / EXTRAORDINARY &bull; भाग II — खण्ड 1 / PART II — Section 1
                  </div>
                  <div className="text-xs text-slate-500 font-serif">
                    विधि और न्याय मंत्रालय (विधायी कार्य विभाग) / MINISTRY OF LAW AND JUSTICE
                  </div>
                  <div className="text-xs text-slate-500 font-serif">
                    नई दिल्ली / New Delhi &bull; अधिनियम संख्या: <strong>{activeAct.actNumber}</strong>
                  </div>
                </div>

                {/* Act Title */}
                <div className="text-center space-y-1">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase font-serif tracking-wide">
                    {activeAct.title}
                  </h2>
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-200">
                    लागू होने की तिथि: {activeAct.effectiveDate} &bull; स्वीकृति: {activeAct.enactmentDate}
                  </div>
                </div>

                {/* Official Preamble */}
                {activeAct.preambleVerbatim && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 text-xs md:text-sm text-slate-900 font-serif leading-relaxed whitespace-pre-wrap">
                    <strong className="block text-amber-950 mb-1 text-sm">प्राक्कथन / PREAMBLE:</strong>
                    {activeAct.preambleVerbatim}
                  </div>
                )}

                {/* Chapters & Key Sections Overview */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>अधिनियम की धाराएं व प्रावधान ({activeAct.keySections.length} Sections on Record)</span>
                    <span className="text-xs text-slate-500 font-normal">कुल धाराएं: {activeAct.totalSections}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeAct.keySections.slice(0, 30).map((sec, secIdx) => (
                      <div
                        key={`${sec.sectionNumber}-${secIdx}`}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono">
                            धारा {sec.sectionNumber}
                          </span>
                          {sec.chapter && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              {sec.chapter}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-slate-800">{sec.title}</div>
                        <div className="text-slate-600 line-clamp-2">{sec.description}</div>
                        {sec.punishment && (
                          <div className="text-[11px] text-amber-800 font-medium">दण्ड: {sec.punishment}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Native PDF Object / Embed Frame */
              <div className="flex-1 min-h-[72vh] flex flex-col space-y-2">
                <div className="flex-1 min-h-[72vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-300 shadow-inner flex flex-col">
                  {activeAct.fileFormat === "IMAGE" || targetDocumentUrl.startsWith("data:image/") ? (
                    <div className="flex-1 flex items-center justify-center p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={targetDocumentUrl}
                        alt={activeAct.title}
                        className="max-h-[74vh] object-contain rounded-lg shadow-lg"
                      />
                    </div>
                  ) : (
                    <object
                      data={targetPageNumber && !targetDocumentUrl.startsWith("blob:") ? `${targetDocumentUrl}#page=${targetPageNumber}&toolbar=1` : `${targetDocumentUrl}#toolbar=1`}
                      type="application/pdf"
                      className="w-full h-full min-h-[72vh] flex-1 bg-white border-none"
                    >
                      <embed
                        src={targetPageNumber && !targetDocumentUrl.startsWith("blob:") ? `${targetDocumentUrl}#page=${targetPageNumber}&toolbar=1` : `${targetDocumentUrl}#toolbar=1`}
                        type="application/pdf"
                        className="w-full h-full min-h-[72vh] flex-1"
                      />
                      <iframe
                        src={targetPageNumber && !targetDocumentUrl.startsWith("blob:") ? `${targetDocumentUrl}#page=${targetPageNumber}&toolbar=1` : `${targetDocumentUrl}#toolbar=1`}
                        className="w-full h-full min-h-[72vh] flex-1 bg-white border-none"
                        title={activeAct.title}
                      />
                      <div className="p-8 text-center text-slate-300 space-y-3 flex flex-col items-center justify-center h-full">
                        <FileText className="w-12 h-12 text-slate-400" />
                        <h4 className="font-bold text-white text-sm">PDF Viewer Fallback</h4>
                        <p className="text-xs text-slate-400 max-w-md">
                          आपके ब्राउज़र में PDF स्वतः प्रदर्शित नहीं हो रहा है। नीचे दिए गए बटन से नए टैब में खोलें या गज़ट पाठ देखें।
                        </p>
                        <div className="flex gap-2">
                          <a
                            href={targetDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                          >
                            Open in New Tab
                          </a>
                          <button
                            type="button"
                            onClick={() => setDocViewerMode("GAZETTE")}
                            className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-bold"
                          >
                            Switch to Gazette View
                          </button>
                        </div>
                      </div>
                    </object>
                  )}
                </div>

                {/* Sub-bar below viewer */}
                <div className="flex items-center justify-between text-xs text-slate-600 px-2 py-1 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{activeAct.fileName || activeAct.title}</span>
                    {targetPageNumber && (
                      <span className="text-amber-800 bg-amber-50 font-bold px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                        Target: Bare Act Page #{targetPageNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDocViewerMode(docViewerMode === "EMBED" ? "GAZETTE" : "EMBED")}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] underline cursor-pointer"
                    >
                      {docViewerMode === "EMBED" ? "समस्या आ रही है? गज़ट दृश्य पर बदलें" : "मूल PDF पर वापस जाएं"}
                    </button>
                    <a
                      href={targetDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>विस्तारित विंडो</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[11px]">
            Haryana Police Statutory Repository &bull; {activeAct.shortName} &bull; Verbatim Certified
          </span>
          <Button size="sm" variant="outline" onClick={onClose} className="cursor-pointer">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
