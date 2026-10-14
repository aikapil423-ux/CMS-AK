"use client";

import React, { Suspense } from "react";
import StorageOptimizationTab from "@/components/settings/StorageOptimizationTab";

export default function StorageOptimizationPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Suspense
        fallback={
          <div className="p-12 text-center text-xs text-slate-500">
            Loading Lossless Compression &amp; Storage Optimization Engine...
          </div>
        }
      >
        <StorageOptimizationTab />
      </Suspense>
    </div>
  );
}
