// Small display components shared across pages.

import { getInitials, getStatusMeta, type StatusKind, type StatusTone } from "@lettr/utils";
import { BadgeCheck } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { cn } from "../../lib/cn";

const TONES: Record<StatusTone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
  neutral: "bg-surface-2 text-muted",
};

export function Pill({ tone = "neutral", children, className }: { tone?: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5", TONES[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

/** Status pill with the shared label and colour for any listing, inquiry, payment or verification status. */
export function StatusPill({ kind, status, className }: { kind: StatusKind; status: string; className?: string }) {
  const meta = getStatusMeta(kind, status);
  return (
    <Pill tone={meta.tone} className={className}>
      {meta.label}
    </Pill>
  );
}

export function VerifiedBadge({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[13px] font-semibold text-ok", className)}>
      <BadgeCheck className="size-4" aria-hidden />
      {compact ? "Verified" : "ID verified"}
    </span>
  );
}

export function Avatar({ person, size = 40, className }: { person: { firstName: string; lastName: string; avatarUrl?: string | null }; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) };
  if (person.avatarUrl) {
    return (
      <Image
        src={person.avatarUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span aria-hidden style={style} className={cn("inline-grid shrink-0 place-items-center rounded-full bg-navy-soft font-bold text-navy", className)}>
      {getInitials(person.firstName, person.lastName)}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-12 text-center", className)}>
      {icon && <div className="mb-4 grid size-12 place-items-center rounded-full bg-navy-soft text-navy">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-card border border-bad/30 bg-bad-soft px-5 py-4 text-sm text-bad">
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 font-semibold underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function Card({ className, children, as: Tag = "section" }: { className?: string; children: React.ReactNode; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("rounded-card border border-line bg-surface p-5 shadow-1", className)}>{children}</Tag>;
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-[28px] font-medium leading-tight text-ink sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 16 16" aria-hidden>
          <path
            d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.4L8 11.2l-3.9 2.2.9-4.4-3.3-3 4.4-.5z"
            fill={n <= Math.round(rating) ? "var(--brass)" : "var(--line-strong)"}
          />
        </svg>
      ))}
    </span>
  );
}
