import { type HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-stone-200 animate-pulse";

  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
  };

  const classes = [baseClasses, variantClasses[variant], className]
    .filter(Boolean)
    .join(" ");

  const computedStyle = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
    ...style,
  };

  return <div className={classes} style={computedStyle} {...props} />;
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-white border border-stone-200">
      <Skeleton variant="text" width="60%" className="mb-4" />
      <Skeleton variant="text" width="100%" className="mb-2" />
      <Skeleton variant="text" width="80%" />
    </div>
  );
}
