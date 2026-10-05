"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export type PoliceModule = "COMPLAINTS" | "ROZNAMCHA";

interface ModuleContextType {
  activeModule: PoliceModule;
  setActiveModule: (mod: PoliceModule) => void;
  switchToModule: (mod: PoliceModule) => void;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<PoliceModule>("COMPLAINTS");

  // Synchronize active module with route when navigating
  useEffect(() => {
    if (pathname.startsWith("/general-diary")) {
      setActiveModule("ROZNAMCHA");
    } else if (
      pathname.startsWith("/complaints") ||
      pathname.startsWith("/enquiry-workspace")
    ) {
      setActiveModule("COMPLAINTS");
    }
  }, [pathname]);

  const switchToModule = (mod: PoliceModule) => {
    setActiveModule(mod);
    if (mod === "ROZNAMCHA") {
      router.push("/general-diary");
    } else {
      router.push("/complaints");
    }
  };

  return (
    <ModuleContext.Provider value={{ activeModule, setActiveModule, switchToModule }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModule() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModule must be used within a ModuleProvider");
  }
  return context;
}
