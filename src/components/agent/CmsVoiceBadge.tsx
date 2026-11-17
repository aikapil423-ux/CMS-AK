"use client";

import React, { useEffect, useState } from "react";
import { CmsVoiceEngine, CmsVoiceStatus } from "@/services/agent/cmsVoiceEngine";
import { Mic, Radio, Volume2, ShieldCheck, Power, Sparkles } from "lucide-react";

interface CmsVoiceBadgeProps {
  className?: string;
  compact?: boolean;
}

export function CmsVoiceBadge({ className = "", compact = false }: CmsVoiceBadgeProps) {
  const [status, setStatus] = useState<CmsVoiceStatus>("STANDBY");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(CmsVoiceEngine.isEnabled());
    const unsubscribe = CmsVoiceEngine.subscribeStatus((newStatus) => {
      setStatus(newStatus);
    });

    if (CmsVoiceEngine.isEnabled()) {
      CmsVoiceEngine.startContinuousListening();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !enabled;
    setEnabled(next);
    CmsVoiceEngine.setEnabled(next);
  };

  const isActive = enabled && status !== "OFF" && status !== "ERROR";

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={
          isActive
            ? `Parth Voice Copilot: सक्रिय (${status}) - "Hey Parth" बोलकर 8 मॉड्यूल्स ऑपरेट करें (Click to Mute)`
            : "Parth Voice Copilot: बंद / स्टैंडबाय (Click to Start Hands-Free)"
        }
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
          isActive
            ? "bg-emerald-500/25 text-emerald-100 border border-emerald-400/70 shadow-xs hover:bg-emerald-500/35"
            : "bg-white/15 text-white/90 hover:bg-white/25 border border-white/40 shadow-xs"
        } ${className}`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            status === "LISTENING"
              ? "bg-blue-400 animate-ping shadow-xs shadow-blue-400"
              : status === "SPEAKING"
              ? "bg-amber-400 animate-pulse shadow-xs shadow-amber-400"
              : status === "PLANNING"
              ? "bg-purple-400 animate-spin"
              : status === "INTERRUPTED"
              ? "bg-rose-400 animate-pulse shadow-xs shadow-rose-400"
              : isActive
              ? "bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400"
              : "bg-slate-400"
          }`}
        />
        <span className="text-white font-semibold text-[11px] tracking-tight whitespace-nowrap">
          {status === "LISTENING"
            ? "सुन रहा हूँ..."
            : status === "PLANNING"
            ? "प्लानिंग..."
            : status === "SPEAKING"
            ? "बोल रहा हूँ"
            : status === "INTERRUPTED"
            ? "रुका (Interrupted)"
            : isActive
            ? "Hey Parth"
            : "Hey Parth Off"}
        </span>
        {isActive ? (
          status === "SPEAKING" ? (
            <Volume2 size={11} className="text-amber-300 shrink-0" />
          ) : (
            <Mic size={11} className="text-emerald-300 shrink-0" />
          )
        ) : (
          <Power size={11} className="text-white/80 shrink-0" />
        )}
      </button>
    );
  }

  return (
    <div
      className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border text-xs select-none transition-all ${
        isActive
          ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-200"
          : "bg-slate-900 border-slate-800 text-slate-400"
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isActive ? "bg-emerald-400 animate-ping absolute opacity-75" : ""
            }`}
          />
          <span
            className={`w-2.5 h-2.5 rounded-full relative z-10 ${
              isActive ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-[11px] text-white flex items-center gap-1.5">
            Parth Voice Copilot
            {isActive && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 font-mono border border-emerald-700/60">
                8 Modules Solo
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-300">
            {isActive ? (
              status === "LISTENING" ? (
                "आवाज सुनी जा रही है..."
              ) : status === "PLANNING" ? (
                "योजना तैयार कर रहा है..."
              ) : status === "SPEAKING" ? (
                "उत्तर दे रहा है (बोलते ही रुकेगा)"
              ) : (
                'सक्रिय: "Hey Parth" बोलें (Hands-free)'
              )
            ) : (
              'माइक्रोफोन बंद है (चालू करने के लिए क्लिक करें)'
            )}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggle}
        className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
          isActive
            ? "bg-emerald-900/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/70"
            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
        }`}
      >
        {isActive ? "सक्रिय" : "चालू करें"}
      </button>
    </div>
  );
}
