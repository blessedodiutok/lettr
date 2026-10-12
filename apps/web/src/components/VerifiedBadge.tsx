// File: apps/web/src/components/VerifiedBadge.tsx
// Green verified badge shown on landlords who have been identity-verified

import { cn } from "../lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function VerifiedBadge({
  size = "md",
  className,
  showLabel = true,
}: VerifiedBadgeProps) {
  const sizes = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = { sm: 14, md: 16, lg: 20 };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold text-[var(--color-success-700)]",
        sizes[size],
        className,
      )}
      title="Verified Landlord — identity confirmed by Lettr"
    >
      <svg
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.497 3.773 3.745 3.745 0 01-3.773.497A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.773-.497 3.745 3.745 0 01-.497-3.773A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.497-3.773 3.745 3.745 0 013.773-.497A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.773.497 3.746 3.746 0 01.497 3.773A3.745 3.745 0 0121 12z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && "Verified"}
    </span>
  );
}
