"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Lock, ArrowLeft, CheckCircle2, AlertCircle, Mic } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GeneralDiaryService } from "@/services/generalDiaryService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

export default function NewGDEntryPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState("");
  const [narrative, setNarrative] = useState("");
  const [entryType, setEntryType] = useState("MISCELLANEOUS_EVENT");
  const [relatedComplaint, setRelatedComplaint] = useState("");
  const [voiceLang, setVoiceLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !narrative.trim()) {
      setError("Please provide both subject and narrative for the Roznamcha entry.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await GeneralDiaryService.addEntry(
        subject,
        narrative,
        entryType,
        currentUser.name,
        currentUser.pno,
        currentUser.stationName,
        relatedComplaint.trim() || undefined
      );
      router.push("/general-diary");
    } catch (err: any) {
      setError(err.message || "Failed to log GD entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-50">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
            Roznamcha Aam Intake
          </span>
          <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">New General Diary Entry</h1>
          <p className="text-xs text-slate-500">Record a station event or departure/arrival in real time</p>
        </div>
        <Link href="/general-diary">
          <Button variant="outline" size="sm" className="text-xs">
            Cancel
          </Button>
        </Link>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-5 sm:p-7">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Voice Dictation Language Toggle Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50/70 border border-blue-200/60 rounded-lg text-xs text-blue-950">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="font-semibold text-slate-800">Voice Dictation</span>
                <span className="text-slate-500 text-[11px] hidden sm:inline">• Tap mic next to Subject or Narrative to speak</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-white px-2 py-1 rounded border border-blue-200 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500">Language:</span>
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-IN")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    voiceLang === "en-IN"
                      ? "bg-[#0b192c] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("hi-IN")}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    voiceLang === "hi-IN"
                      ? "bg-[#0b192c] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Hindi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entry Type *</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                >
                  <option value="MISCELLANEOUS_EVENT">General Occurrence / Misc</option>
                  <option value="SHIFT_RELIEF_TURNOVER">Shift Relief / Sentry Change</option>
                  <option value="OFFICER_DEPARTURE">Officer Departure (Investigation/Raid)</option>
                  <option value="OFFICER_ARRIVAL">Officer Arrival at Station</option>
                  <option value="PATROL_DEPARTURE_RETURN">Patrol / Domination</option>
                  <option value="COMPLAINT_RECEIPT">Receipt of Complaint Petition</option>
                  <option value="SEIZURE_MUDDMAL">Property Deposit (Malkhana)</option>
                  <option value="SUPERVISORY_INSPECTION">Supervisory Inspection (SP/DSP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Complaint ID (Optional)
                </label>
                <input
                  type="text"
                  value={relatedComplaint}
                  onChange={(e) => setRelatedComplaint(e.target.value)}
                  placeholder="e.g. HAR-KKR-2026-CMP-00482"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-[#0b192c]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Roznamcha Heading / Subject *
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Heading / Subject"
                  currentValue={subject}
                  onTranscript={(val) => setSubject(val)}
                />
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Departure of ASI Surender Pal for Spot Verification"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Full Narrative Description (Roznamcha Text) *
                </label>
                <VoiceInputButton
                  preferredLang={voiceLang}
                  fieldLabel="Full Narrative Description"
                  currentValue={narrative}
                  onTranscript={(val) => setNarrative(val)}
                />
              </div>
              <textarea
                rows={6}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Enter exact time, names of police personnel, arms carried, vehicle number, purpose of movement, or occurrence details (or tap Voice Input to speak)..."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0b192c]"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Tamper-evident legal log • Once saved, cannot be edited in-place
              </span>
              <span className="font-semibold text-slate-800">By: {currentUser.name}</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Link href="/general-diary">
                <Button variant="outline" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="bg-[#0b192c]"
              >
                Log Roznamcha Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
