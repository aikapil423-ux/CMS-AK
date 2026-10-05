"use client";

import React from "react";
import { Building2, Phone, Mail, MapPin, Shield, Users, Award, Radio } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StationProfilePage() {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[#b8001f]">
          Administrative Unit Profile
        </span>
        <h1 className="text-2xl font-black text-[#0b192c] tracking-tight">
          {currentUser.stationName}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Kurukshetra Police District • Ambala Range • Haryana Police
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0b192c]" />
              Police Station Particulars
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Station Code:</span>
              <span className="font-mono font-bold text-slate-800">{currentUser.stationCode}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Station House Officer (SHO):</span>
              <span className="font-semibold text-slate-800">Inspector Rajesh Kumar</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Supervisory Sub-Division:</span>
              <span className="font-semibold text-slate-800">Thanesar Sub-Division (DSP)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Control Room Phone:</span>
              <span className="font-mono font-bold text-slate-800">01744-220100</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Emergency Helpline:</span>
              <span className="font-mono font-bold text-[#b8001f]">Dial 112</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600" />
              Operational Strength & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Sanctioned Strength:</span>
              <span className="font-semibold text-slate-800">42 Officers & Men</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Investigating Officers (IO/EO):</span>
              <span className="font-semibold text-slate-800">8 Active (SI / ASI / HC)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Patrol Vehicles (ERVs / PCR):</span>
              <span className="font-semibold text-slate-800">3 ERVs + 2 PCR Motorcycles</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500">Roznamcha Status:</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Continuous 24-hr Active
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
