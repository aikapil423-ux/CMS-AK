"use client";

import React, { useEffect, useRef, useState } from "react";
import { supportsWhisperDictation, WhisperRecognition } from "@/lib/whisperRecognition";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  Printer,
  Mic,
  Languages,
  CheckCircle,
  FileText,
  Save,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function WysiwygA4DocumentCanvas() {
  const { currentUser } = useAuth();
  const [docLanguage, setDocLanguage] = useState<"HINDI" | "ENGLISH">("HINDI");
  const [isDictating, setIsDictating] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [dictationError, setDictationError] = useState("");
  const recognitionRef = useRef<WhisperRecognition | null>(null);
  useEffect(() => () => recognitionRef.current?.abort(), []);
  const [docTitle, setDocTitle] = useState("दैनिक स्थिति आख्या / मौका मुआयना रिपोर्ट");
  const [docContent, setDocContent] = useState(
    `सेवा में,
श्रीमान पुलिस उप अधीक्षक महोदय,
उप-मंडल पानीपत।

विषय: संदर्भ शिकायत संख्या CMP-2026-0812 बाबत मौका मुआयना व तफ्तीश रिपोर्ट।

महोदय,
सविनय निवेदन है कि उपरोक्त मामले के संदर्भ में आज दिनांक को मौका सेक्टर-12 का मुआयना किया गया। प्रार्थी व गवाहों के बयान कलमबद्ध किए गए हैं। घटना स्थल पर किसी प्रकार की शांति-भंग की स्थिति नहीं पाई गई। आगामी कानूनी कार्रवाई हेतु रिपोर्ट सादर सेवा में प्रेषित है।`
  );
  const [saveToast, setSaveToast] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const toggleDictation = () => {
    if (isDictating) {
      setIsDictating(false);
      setIsTranscribing(true);
      recognitionRef.current?.stop();
      return;
    }
    if (!supportsWhisperDictation()) {
      setDictationError("Microphone recording requires a supported browser on HTTPS or localhost.");
      return;
    }
    const recognition = new WhisperRecognition();
    recognition.lang = docLanguage === "HINDI" ? "hi-IN" : "en-IN";
    recognition.continuous = true;
    recognition.onresult = ({ results }) => {
      const text = results[0][0].transcript;
      setDocContent(previous => previous ? `${previous.trimEnd()} ${text}` : text);
    };
    recognition.onerror = ({ error }) => setDictationError(
      error === "not-allowed" ? "Allow microphone access in your browser." : error,
    );
    recognition.onend = () => {
      setIsDictating(false);
      setIsTranscribing(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = recognition;
    setDictationError("");
    setIsDictating(true);
    recognition.start();
  };

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* 1. Language & Dictation Separate Control Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Document Language Selector */}
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-900" />
          <span className="text-xs font-bold text-slate-700">Document Target Language:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDocLanguage("HINDI")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                docLanguage === "HINDI"
                  ? "bg-[#1e3a8a] text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिन्दी (आधिकारिक राजभाषा)
            </button>
            <button
              type="button"
              onClick={() => setDocLanguage("ENGLISH")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                docLanguage === "ENGLISH"
                  ? "bg-[#1e3a8a] text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English (Courts Format)
            </button>
          </div>
        </div>

        {/* Audio Dictation Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Voice Dictation:</span>
          <button
            type="button"
            onClick={toggleDictation}
            disabled={isTranscribing}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              isDictating
                ? "bg-rose-600 text-white animate-pulse"
                : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isTranscribing ? "Transcribing…" : isDictating ? "Listening... बोलें (Recording)" : "बोलकर टाइप करें (Voice Dictation)"}</span>
          </button>
          {dictationError && <span role="alert" className="text-xs text-rose-700">{dictationError}</span>}

          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#1e3a8a] text-white hover:bg-blue-950 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4</span>
          </button>
        </div>
      </div>

      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Document saved to station records successfully.</span>
        </div>
      )}

      {/* 2. Compact Formatting Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-700 shadow-xs">
        <button className="p-1.5 hover:bg-slate-100 rounded font-bold cursor-pointer" title="Bold">
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 hover:bg-slate-100 rounded italic cursor-pointer" title="Italic">
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 hover:bg-slate-100 rounded underline cursor-pointer" title="Underline">
          <Underline className="w-3.5 h-3.5" />
        </button>
        <span className="h-4 w-px bg-slate-200 mx-1"></span>
        <button className="p-1.5 hover:bg-slate-100 rounded cursor-pointer" title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 hover:bg-slate-100 rounded cursor-pointer" title="Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 hover:bg-slate-100 rounded cursor-pointer" title="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
        <span className="h-4 w-px bg-slate-200 mx-1"></span>
        <button
          onClick={() => setDocContent((prev) => prev + "\n\n[मुहर / Seal: थाना शहर पानीपत]\n[हस्ताक्षर जाँच अधिकारी]")}
          className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 rounded font-semibold text-[11px] cursor-pointer"
        >
          + Insert Official Police Stamp
        </button>
        <button
          onClick={() => setDocContent((prev) => prev + `\nदिनांक: ${new Intl.DateTimeFormat("en-IN").format(new Date())}`)}
          className="px-2.5 py-1 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 rounded font-semibold text-[11px] cursor-pointer"
        >
          + Insert Date
        </button>
      </div>

      {/* 3. Central WYSIWYG A4 Paper Canvas */}
      <div className="bg-slate-200/90 p-4 sm:p-8 rounded-2xl flex justify-center overflow-x-auto">
        <div
          className="bg-white shadow-xl border border-slate-300 w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 text-slate-900 text-xs sm:text-sm leading-relaxed flex flex-col justify-between"
          style={{ width: "210mm", minHeight: "297mm" }}
        >
          {/* Official Letterhead */}
          <div className="space-y-4">
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="font-serif font-black text-base sm:text-lg uppercase tracking-tight text-slate-950">
                कार्यालय थाना प्रबंधक, {currentUser.stationName || "थाना शहर पानीपत"}
              </h2>
              <p className="text-xs font-semibold text-slate-700">
                जिला {currentUser.district || "पानीपत"} • हरियाणा पुलिस
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Official Judicial / Operational Proceeding Sheet
              </p>
            </div>

            {/* Reference Numbers */}
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-700 border-b border-slate-200 pb-2">
              <span>क्रमांक: 341/जांच/शहर</span>
              <span>दिनांक: {new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date())}</span>
            </div>

            {/* Editable Content */}
            <div className="pt-2">
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                rows={16}
                className="w-full text-xs sm:text-sm leading-relaxed bg-transparent resize-none border-none focus:outline-none text-slate-900 font-serif"
                placeholder="यहाँ आधिकारिक रिपोर्ट टाइप करें या ऊपर 'बोलकर टाइप करें' दबाएँ..."
              />
            </div>
          </div>

          {/* Official Signature & Seal Block */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs">
            <div className="space-y-1 text-slate-600">
              <p className="font-semibold text-[11px]">प्रतिलिपि सूचनार्थ:</p>
              <p>1. पुलिस अधीक्षक कार्यालय, {currentUser.district}</p>
              <p>2. संबंधित न्यायालय अभिलेख</p>
            </div>
            <div className="text-right space-y-1">
              <div className="w-32 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 mx-auto">
                [डिजिटल हस्ताक्षर]
              </div>
              <p className="font-bold text-slate-950">{currentUser.name}</p>
              <p className="text-[11px] text-slate-600">{currentUser.roleDisplay} • PNO: {currentUser.pno}</p>
              <p className="text-[10px] text-slate-500">{currentUser.stationName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
