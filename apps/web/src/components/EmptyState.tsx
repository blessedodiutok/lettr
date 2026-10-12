// File: apps/web/src/components/EmptyState.tsx
// Empty state illustration + heading + actionable CTA

import Link from "next/link";
import { Button } from "./ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  icon?: "search" | "saved" | "messages" | "home";
}

const icons = {
  search: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-[var(--color-neutral-300)]"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  saved: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-[var(--color-neutral-300)]"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  messages: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-[var(--color-neutral-300)]"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  home: (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className="text-[var(--color-neutral-300)]"
      aria-hidden="true"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  icon = "search",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="mb-6">{icons[icon]}</div>
      <h3 className="text-xl font-bold text-[var(--color-neutral-800)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--color-neutral-500)] max-w-sm mb-6">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref}>
          <Button variant="primary">{ctaLabel}</Button>
        </Link>
      )}
      {ctaLabel && onCtaClick && (
        <Button variant="primary" onClick={onCtaClick}>
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
