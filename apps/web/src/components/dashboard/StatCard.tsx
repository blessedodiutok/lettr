// File: apps/web/src/components/dashboard/StatCard.tsx

import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  variant?: "default" | "success" | "warning" | "accent";
}

const variantStyles = {
  default: {
    icon: "bg-[var(--color-primary-50)]  text-[var(--color-primary-600)]",
    value: "text-[var(--color-primary-600)]",
  },
  success: {
    icon: "bg-[var(--color-success-50)]  text-[var(--color-success-600)]",
    value: "text-[var(--color-success-700)]",
  },
  warning: {
    icon: "bg-[var(--color-warning-50)]  text-[var(--color-warning-600)]",
    value: "text-[var(--color-warning-700)]",
  },
  accent: {
    icon: "bg-[var(--color-accent-50)]   text-[var(--color-accent-600)]",
    value: "text-[var(--color-accent-700)]",
  },
};

export function StatCard({
  label,
  value,
  icon,
  sub,
  variant = "default",
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className="
      bg-white rounded-2xl
      border border-[var(--color-neutral-200)]
      shadow-[var(--shadow-card)]
      p-5
      flex items-start gap-4
    "
    >
      {/* Icon bubble */}
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
          styles.icon,
        )}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p className="label-section mb-1">{label}</p>
        <p
          className={cn(
            "font-[family-name:var(--font-display)] font-bold text-2xl leading-none",
            styles.value,
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="text-xs text-[var(--color-neutral-400)] mt-1.5">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
