import React from "react";
import { cn } from "@/lib/utils";
import { ComplaintPriority, ComplaintStatus, MainComplaintStatus } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-slate-50 text-slate-700 border-slate-200",
    warning: "bg-slate-100 text-slate-700 border-slate-200",
    danger: "bg-rose-50 text-rose-800 border-rose-200",
    info: "bg-slate-100 text-slate-700 border-slate-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
    gold: "bg-slate-100 text-slate-800 border-slate-300 font-semibold",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-1 text-xs font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border tracking-tight",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus | MainComplaintStatus | string;
  className?: string;
}) {
  const s = String(status || "").trim();

  // 1. Not Assigned
  if (s === "Not Assigned" || s === "NOT_ASSIGNED" || s === "UNASSIGNED" || s === "REGISTERED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Not Assigned</span>
      </span>
    );
  }

  // 2. FIR Register (Direct Send to FIR, awaiting formal FIR registration by SHO)
  if (s === "FIR Register" || s === "FIR_REGISTER") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-900 border border-purple-300 shadow-2xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 animate-pulse" />
        <span>FIR Register</span>
      </span>
    );
  }

  // 2b. FIR Recommend (SHO Approved FIR recommendation, awaiting FIR registration)
  if (s === "FIR Recommend" || s === "FIR_RECOMMEND" || s === "FIR_RECOMMENDED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-950 border border-amber-400 shadow-2xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 animate-pulse" />
        <span>FIR Recommend</span>
      </span>
    );
  }

  // 3. FIR Registered (Formal FIR has been registered with FIR Number)
  if (s === "FIR Registered" || s === "FIR_REGISTERED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 shadow-2xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
        <span>FIR Registered</span>
      </span>
    );
  }

  // 4. Correction Required (Report rejected by SHO for correction/resubmission)
  if (s === "Correction Required" || s === "CORRECTION_REQUIRED" || s === "RE_ENQUIRY") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
        <span>Correction Required</span>
      </span>
    );
  }

  // 3. Complete
  if (
    s === "Complete" ||
    s === "COMPLETE" ||
    s === "DISPOSED_MUTUAL_ACCORD" ||
    s === "DISPOSED_CIVIL_NATURE" ||
    s === "DISPOSED_UNSUBSTANTIATED" ||
    s === "DISPOSED"
  ) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
        <span>Complete</span>
      </span>
    );
  }

  // 4. Pending (all in-progress / ongoing / awaiting SHO / re-enquiry)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
      <span>Pending</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ComplaintPriority }) {
  switch (priority) {
    case "CM_WINDOW_VIP":
      return (
        <Badge variant="gold" className="bg-slate-100 text-slate-800 border-slate-300">
          CM Window (VIP)
        </Badge>
      );
    case "CRITICAL_SENSITIVE":
      return <Badge variant="danger">Critical</Badge>;
    case "URGENT":
      return <Badge variant="danger">Urgent</Badge>;
    case "ROUTINE":
    default:
      return <Badge variant="neutral">Routine</Badge>;
  }
}
