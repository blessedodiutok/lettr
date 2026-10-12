// File: apps/web/src/components/ui/badge.tsx
import { cn } from "../../lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)]",
    success: "bg-[var(--color-success-50)] text-[var(--color-success-700)]",
    warning: "bg-[var(--color-warning-50)] text-[var(--color-warning-600)]",
    danger: "bg-[var(--color-danger-50)] text-[var(--color-danger-600)]",
    gold: "bg-[var(--color-accent-50)] text-[var(--color-accent-600)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
