import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, label, className = "", ...props }, ref) => {
    const baseClasses = "w-full px-4 py-2 rounded-lg border border-stone-200 bg-white text-stone-900 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-stone-400";

    const errorClasses = error ? "border-red-500 focus:ring-red-500" : "";

    const classes = [baseClasses, errorClasses, className].filter(Boolean).join(" ");

    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 text-sm font-medium text-stone-600">
            {label}
          </label>
        )}
        <input ref={ref} className={classes} {...props} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
