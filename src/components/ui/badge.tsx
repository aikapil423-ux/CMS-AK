import React from "react";
import { cn } from "@/lib/utils";
import { ComplaintPriority, ComplaintStatus } from "@/types";

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

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  switch (status) {
    case "REGISTERED":
      return <Badge variant="default">New Registered</Badge>;
    case "ASSIGNED_TO_EO":
      return <Badge variant="warning">EO Assigned</Badge>;
    case "ENQUIRY_IN_PROGRESS":
      return <Badge variant="info">Enquiry Active</Badge>;
    case "INTERIM_REPORT_SUBMITTED":
      return <Badge variant="warning">Interim Filed</Badge>;
    case "REPORT_SUBMITTED":
      return <Badge variant="warning">Report Filed</Badge>;
    case "PENDING_SHO_REVIEW":
      return <Badge variant="danger">Pending SHO</Badge>;
    case "RECOMMENDED_FOR_FIR":
      return <Badge variant="danger">FIR Recommended</Badge>;
    case "DISPOSED_CIVIL_NATURE":
      return <Badge variant="neutral">Disposed (Civil)</Badge>;
    case "DISPOSED_MUTUAL_ACCORD":
      return <Badge variant="success">Settled Accord</Badge>;
    case "DISPOSED_UNSUBSTANTIATED":
      return <Badge variant="neutral">Unsubstantiated</Badge>;
    case "TRANSFERRED_OTHER_PS":
      return <Badge variant="neutral">Transferred</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
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
