import { forwardRef, type HTMLAttributes } from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", size = "md", className = "", children, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-full transition-colors";

    const variantClasses = {
      default: "bg-stone-100 text-stone-700",
      success: "bg-emerald-100 text-emerald-700",
      warning: "bg-amber-100 text-amber-700",
      error: "bg-red-100 text-red-700",
      info: "bg-blue-100 text-blue-700",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className]
      .filter(Boolean)
      .join(" ");

    return (
      <span ref={ref} className={classes} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
