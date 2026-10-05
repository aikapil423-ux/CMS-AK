import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";

    const variantStyles = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-500 shadow-2xs",
      secondary: "bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 focus-visible:ring-blue-400",
      danger: "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 shadow-2xs",
      outline: "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus-visible:ring-slate-400 shadow-2xs",
      ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus-visible:ring-slate-300",
      gold: "bg-amber-500 hover:bg-amber-600 text-white focus-visible:ring-amber-400 shadow-2xs",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5 min-h-[32px]",
      md: "h-9 px-4 text-xs sm:text-sm gap-2 min-h-[38px]",
      lg: "h-11 px-5 text-sm gap-2 min-h-[44px]",
      icon: "h-9 w-9 min-h-[36px] min-w-[36px] p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
