"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { persistentFirService as firService } from "@/services/persistentFirService";
import { FIRItem } from "@/types";
import { FIRWorkspaceNav } from "@/components/fir-workspace/FIRWorkspaceNav";
import { CrimeDetailModal } from "@/components/fir/CrimeDetailModal";

function CrimeDetailsPageContent() {
  const { currentUser } = useAuth();
  const searchParams = useSearchParams();
  const firIdParam = searchParams.get("firId");

  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [selectedFirId, setSelectedFirId] = useState<string>("");
  const [activeFir, setActiveFir] = useState<FIRItem | null>(null);

  // Load registered FIRs
  useEffect(() => {
    const allFirs = firService.getAllFirs();
    setFirs(allFirs);
    if (firIdParam && allFirs.some((f) => f.id === firIdParam || f.firNumber === firIdParam)) {
      setSelectedFirId(firIdParam);
    }
  }, [firIdParam]);

  useEffect(() => {
    if (selectedFirId) {
      const found = firs.find((f) => f.id === selectedFirId || f.firNumber === selectedFirId);
      setActiveFir(found || null);
    } else {
      setActiveFir(null);
    }
  }, [selectedFirId, firs]);

  const handleFirUpdated = (updated: FIRItem) => {
    setActiveFir(updated);
    setFirs((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  return (
    <div className="space-y-4 animate-in fade-in-50">
      {/* Top Banner / Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">
                FORM IIF-II
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0b192c] tracking-tight">
                Crime Detail Form (IIF-II) / अपराध विवरण प्रपत्र
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              CCTNS Statutory Integrated Investigation Form II under Section 173(3) / 175 BNSS
            </p>
          </div>
        </div>

        {activeFir && (
          <Link
            href={`/fir/${activeFir.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>View FIR Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* FIR Module Workspace Navigation */}
      <FIRWorkspaceNav firId={selectedFirId} />

      {/* Active FIR Selector Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
        <div className="max-w-md">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
            सक्रिय अभियोग चुनें (Select Active FIR Case) *
          </label>
          <select
            value={selectedFirId}
            onChange={(e) => setSelectedFirId(e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900"
          >
            <option value="">
              -- सक्रिय अभियोग चुनें (Select Active FIR Case) --
            </option>
            {firs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.firNumber} — {f.actsAndSections?.slice(0, 40)} ({f.complainantName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Embedded Crime Details Form & Preview */}
      {activeFir ? (
        <CrimeDetailModal
          key={activeFir.id}
          fir={activeFir}
          isOpen={true}
          mode="page"
          onClose={() => {}}
          onSubmitted={handleFirUpdated}
          currentUserName={currentUser?.name || "Investigating Officer"}
        />
      ) : (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            कृपया सक्रिय अभियोग (FIR) चुनें
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Crime Details Form (IIF-II) भरने और प्रीव्यू देखने के लिए ऊपर दिए गए ड्रॉपडाउन से सक्रिय FIR केस का चयन करें।
          </p>
        </div>
      )}
    </div>
  );
}

export default function CrimeDetailsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading Crime Details Form (IIF-II)...</div>}>
      <CrimeDetailsPageContent />
    </Suspense>
  );
}
