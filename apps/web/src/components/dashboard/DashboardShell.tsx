// File: apps/web/src/components/dashboard/DashboardShell.tsx
// Shared outer shell for tenant and landlord dashboards

interface DashboardShellProps {
  greeting: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  children: React.ReactNode;
}

import Link from "next/link";
import { Button } from "../ui/button";

export function DashboardShell({
  greeting,
  subheading,
  ctaLabel,
  ctaHref,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="page-container py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="heading-display text-2xl sm:text-3xl text-brand-navy">
                {greeting}
              </h1>
              <p className="text-neutral-500 mt-1 text-sm">{subheading}</p>
            </div>
            <Link href={ctaHref} className="shrink-0">
              <Button variant="primary" size="sm">
                {ctaLabel}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container py-8">
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}
