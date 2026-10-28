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
      "cms-button inline-flex items-center justify-center font-semibold rounded-none border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.99] select-none";

    const variantStyles = {
      primary: "bg-[#203c88] hover:bg-[#172e70] border-[#203c88] text-white",
      secondary: "bg-[#eef1ff] hover:bg-[#e0e7ff] text-[#26334a] border-[#a8b5d1]",
      danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-xs",
      outline: "border-[#26334a] bg-white hover:bg-[#eef1ff] text-[#26334a]",
      ghost: "border-transparent hover:bg-[#eef1ff] text-[#203c88]",
      gold: "bg-[#203c88] hover:bg-[#172e70] border-[#203c88] text-white",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs gap-1.5 min-h-[32px]",
      md: "h-9 px-3.5 text-xs sm:text-sm gap-2 min-h-[36px]",
      lg: "h-10 px-4 text-sm gap-2 min-h-[40px]",
      icon: "h-8.5 w-8.5 min-h-[34px] min-w-[34px] p-0",
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
