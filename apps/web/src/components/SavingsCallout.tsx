// File: apps/web/src/components/SavingsCallout.tsx

import {
  calculateAgentSaving,
  calculatePlatformFee,
  formatNaira,
} from "../lib/utils";

interface SavingsCalloutProps {
  annualRent: number;
  variant?: "banner" | "card" | "inline";
}

export function SavingsCallout({
  annualRent,
  variant = "card",
}: SavingsCalloutProps) {
  const agentFee = calculateAgentSaving(annualRent);
  const platformFee = calculatePlatformFee(annualRent);
  const netSaving = agentFee - platformFee;

  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[var(--color-success-700)] font-semibold text-sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="6" fill="var(--color-success-100)" />
          <path
            d="M4.5 7l2 2 3-3"
            stroke="var(--color-success-600)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Save {formatNaira(netSaving)} vs agent
      </span>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className="
          rounded-xl p-4
          bg-[var(--color-success-50)]
          border border-[var(--color-success-100)]
          flex items-center gap-4
        "
      >
        {/* Icon */}
        <div
          className="
            shrink-0 w-12 h-12 rounded-xl
            bg-[var(--color-success-500)]
            flex items-center justify-center
            shadow-sm
          "
          aria-hidden="true"
        >
          <span
            className="
              text-white text-lg font-bold
              font-[family-name:var(--font-display)]
            "
          >
            ₦
          </span>
        </div>

        <div className="min-w-0">
          <p className="font-bold text-[var(--color-success-800)] text-lg leading-tight">
            You save{" "}
            <span className="font-[family-name:var(--font-display)]">
              {formatNaira(netSaving)}
            </span>
          </p>
          <p className="text-[var(--color-success-700)] text-sm mt-0.5">
            {formatNaira(platformFee)} platform fee instead of{" "}
            {formatNaira(agentFee)} agent commission
          </p>
        </div>
      </div>
    );
  }

  // ── Card (default) ────────────────────────────────────────────────────── */
  return (
    <div
      className="
        rounded-xl overflow-hidden
        border border-[var(--color-success-200)]
      "
    >
      {/* Header — saving amount hero */}
      <div
        className="
          px-5 py-4
          bg-gradient-to-br
          from-[var(--color-success-500)]
          to-[var(--color-success-600)]
        "
      >
        <p className="text-[var(--color-success-100)] text-xs font-semibold uppercase tracking-[0.08em] mb-1">
          Your saving with Lettr
        </p>
        <p
          className="
            text-white text-3xl font-bold leading-none
            font-[family-name:var(--font-display)]
          "
        >
          {formatNaira(netSaving)}
        </p>
      </div>

      {/* Breakdown */}
      <div className="px-5 py-4 bg-[var(--color-success-50)] space-y-2">
        <div className="flex justify-between text-sm text-[var(--color-neutral-600)]">
          <span>Traditional agent fee (15%)</span>
          <span className="line-through text-[var(--color-neutral-400)]">
            {formatNaira(agentFee)}
          </span>
        </div>
        <div className="flex justify-between text-sm text-[var(--color-neutral-700)]">
          <span>Lettr platform fee (3%)</span>
          <span className="font-medium">{formatNaira(platformFee)}</span>
        </div>
        <div
          className="
            flex justify-between
            pt-2.5 mt-0.5
            border-t border-[var(--color-success-200)]
            text-sm font-bold text-[var(--color-success-800)]
          "
        >
          <span>You save</span>
          <span className="font-[family-name:var(--font-display)] text-base">
            {formatNaira(netSaving)}
          </span>
        </div>
      </div>
    </div>
  );
}
