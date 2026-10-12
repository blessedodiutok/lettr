// File: apps/web/src/components/ui/button.tsx
// shadcn-compatible Button — preserves Lettr's custom variant API
// Uses CSS variables from globals.css so it auto-adapts to dark mode

import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "../../lib/utils";

/* ── Variant map ───────────────────────────────────────────────────────────── */
const variantClasses = {
  primary: `
    bg-[var(--color-primary-600)] text-white
    hover:bg-[var(--color-primary-700)]
    active:bg-[var(--color-primary-800)]
    shadow-sm hover:shadow-md
    border border-transparent
  `,
  secondary: `
    bg-[var(--color-neutral-100)] text-[var(--color-neutral-800)]
    hover:bg-[var(--color-neutral-200)]
    active:bg-[var(--color-neutral-300)]
    border border-[var(--color-neutral-200)]
  `,
  ghost: `
    bg-transparent text-[var(--color-neutral-700)]
    hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)]
    active:bg-[var(--color-neutral-200)]
    border border-transparent
  `,
  outline: `
    bg-transparent text-[var(--color-primary-600)]
    hover:bg-[var(--color-primary-50)]
    active:bg-[var(--color-primary-100)]
    border border-[var(--color-primary-300)]
  `,
  accent: `
    bg-[var(--color-accent-500)] text-white
    hover:bg-[var(--color-accent-600)]
    active:bg-[var(--color-accent-700)]
    shadow-sm hover:shadow-md
    border border-transparent
  `,
  destructive: `
    bg-[var(--color-danger-500)] text-white
    hover:bg-[var(--color-danger-600)]
    active:bg-[var(--color-danger-600)]
    border border-transparent
  `,
  link: `
    bg-transparent text-[var(--color-primary-600)]
    hover:text-[var(--color-primary-700)]
    underline-offset-4 hover:underline
    border border-transparent
    p-0 h-auto
  `,
} as const;

const sizeClasses = {
  xs: "h-7  px-2.5 text-xs  gap-1.5 rounded-[var(--radius-sm)]",
  sm: "h-8  px-3   text-sm  gap-1.5 rounded-[var(--radius-md)]",
  md: "h-10 px-4   text-sm  gap-2   rounded-[var(--radius-md)]",
  lg: "h-11 px-5   text-base gap-2   rounded-[var(--radius-lg)]",
  xl: "h-12 px-6   text-base gap-2.5 rounded-[var(--radius-lg)]",
  icon: "h-9  w-9    text-sm  rounded-[var(--radius-md)]",
} as const;

/* ── Types ─────────────────────────────────────────────────────────────────── */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  isLoading?: boolean;
  loadingText?: string;
  asChild?: boolean; /* future Radix slot support */
}

/* ── Component ─────────────────────────────────────────────────────────────── */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          /* Base */
          "inline-flex items-center justify-center",
          "font-medium font-(family-name:--font-body)",
          "whitespace-nowrap select-none",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          /* Variant + size */
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <Loader2
            size={14}
            className="animate-spin shrink-0"
            aria-hidden="true"
          />
        )}
        {isLoading && loadingText ? loadingText : children}
      </button>
    );
  },
);

Button.displayName = "Button";
