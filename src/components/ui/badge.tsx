import React from "react";
import { cn } from "@/lib/utils";
import { ComplaintPriority, ComplaintStatus, MainComplaintStatus } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-200/80",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-800 border-amber-200/60",
    danger: "bg-rose-50 text-rose-800 border-rose-200/60",
    info: "bg-slate-100 text-slate-700 border-slate-200/80",
    neutral: "bg-slate-50 text-slate-600 border-slate-200/70",
    gold: "bg-slate-100 text-slate-800 border-slate-300/80 font-medium",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium",
    md: "px-2.5 py-0.5 text-xs font-medium",
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
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50/80 text-amber-900 border border-amber-200/70",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Not Assigned</span>
      </span>
    );
  }

  // 2. FIR Register
  if (s === "FIR Register" || s === "FIR_REGISTER") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50/80 text-purple-900 border border-purple-200/70",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0" />
        <span>FIR Register</span>
      </span>
    );
  }

  // 2b. FIR Recommend
  if (s === "FIR Recommend" || s === "FIR_RECOMMEND" || s === "FIR_RECOMMENDED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50/80 text-amber-950 border border-amber-300/70",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
        <span>FIR Recommend</span>
      </span>
    );
  }

  // 3. FIR Registered
  if (s === "FIR Registered" || s === "FIR_REGISTERED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-rose-50/80 text-rose-800 border border-rose-200/70",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
        <span>FIR Registered</span>
      </span>
    );
  }

  // 4. Correction Required
  if (s === "Correction Required" || s === "CORRECTION_REQUIRED" || s === "RE_ENQUIRY") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50/80 text-amber-900 border border-amber-200/70",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        <span>Correction Required</span>
      </span>
    );
  }

  // 5. Complete
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
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50/80 text-emerald-800 border border-emerald-200/70",
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
        <span>Complete</span>
      </span>
    );
  }

  // 6. Pending
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
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
