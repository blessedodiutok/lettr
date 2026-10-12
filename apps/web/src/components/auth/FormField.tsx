// File: apps/web/src/components/auth/FormField.tsx
// Shared form field pattern for all auth forms
// Handles label, input, error state, and accessible markup in one place

"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { cn } from "../../lib/utils";

/* ── Base input classes ────────────────────────────────────────────────────── */
const inputBase = [
  "w-full h-11 px-4 rounded-lg text-sm",
  "bg-white text-[var(--color-neutral-800)]",
  "border transition-all duration-150",
  "placeholder:text-[var(--color-neutral-400)]",
  "focus:outline-none focus:ring-2 focus:ring-inset focus:border-transparent",
].join(" ");

const inputDefault = [
  "border-[var(--color-neutral-200)]",
  "hover:border-[var(--color-neutral-300)]",
  "focus:ring-[var(--color-primary-500)]",
].join(" ");

const inputError = [
  "border-[var(--color-danger-400)]",
  "bg-[var(--color-danger-50)]",
  "focus:ring-[var(--color-danger-400)]",
].join(" ");

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, optional, className, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <label
            htmlFor={fieldId}
            className="block text-sm font-semibold text-neutral-700"
          >
            {label}
          </label>
          {optional && (
            <span className="text-xs text-neutral-400 font-normal">
              Optional
            </span>
          )}
        </div>

        {/* Input wrapper */}
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={inputType}
            aria-invalid={hasError}
            aria-describedby={
              [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
              undefined
            }
            className={cn(
              inputBase,
              hasError ? inputError : inputDefault,
              isPassword && "pr-11",
              className,
            )}
            {...props}
          />

          {/* Password visibility toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                text-neutral-400
                hover:text-neutral-600
                transition-colors duration-150
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-ring
                rounded
              "
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div id={errorId} role="alert" className="flex items-start gap-1.5">
            <svg
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
              aria-hidden="true"
              className="shrink-0 mt-0.5"
            >
              <circle
                cx="6.5"
                cy="6.5"
                r="5.5"
                fill="var(--color-danger-500)"
              />
              <path
                d="M6.5 4v3M6.5 9h.01"
                stroke="white"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-xs text-(--color-danger-600)">{error}</p>
          </div>
        )}

        {/* Hint */}
        {hint && !error && (
          <p id={hintId} className="text-xs text-neutral-400">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

FormField.displayName = "FormField";
