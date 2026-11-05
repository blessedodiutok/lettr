"use client";

import Link from "next/link";
import { useDemoLogin, type DemoPersona } from "../../hooks/useDemo";
import { IS_DEMO } from "../../lib/demo";
import { cn } from "../../lib/cn";
import { useAuthStore } from "../../stores/authStore";

const VIEWS: Array<{ persona: DemoPersona; role: string; label: string }> = [
  { persona: "tenant", role: "TENANT", label: "Tenant" },
  { persona: "landlord", role: "LANDLORD", label: "Landlord" },
  { persona: "admin", role: "ADMIN", label: "Admin" },
];

/** Shown on every page of the demo, so nobody takes it for a real rental service. */
export function DemoBar() {
  const role = useAuthStore((s) => s.user?.role);
  const login = useDemoLogin();
  if (!IS_DEMO) return null;

  return (
    <aside aria-label="Portfolio demo" className="bg-navy-deep text-[13px] text-hero-muted" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-1.5 px-4 py-2 sm:px-6">
        <p className="min-w-0">
          <span className="font-semibold text-hero-accent">Portfolio demo.</span> Fictional homes and people. No real money moves.{" "}
          <Link href="/demo" className="whitespace-nowrap font-semibold text-hero-ink underline underline-offset-2">
            Take the tour
          </Link>
        </p>
        <div role="group" aria-label="View the demo as" className="flex items-center gap-1">
          <span className="mr-1 text-hero-muted">View as</span>
          {VIEWS.map((view) => (
            <button
              key={view.persona}
              type="button"
              aria-pressed={role === view.role}
              disabled={login.isPending}
              onClick={() => login.mutate(view.persona)}
              className={cn(
                "h-7 rounded-control px-2.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-hero-accent disabled:opacity-60",
                role === view.role ? "bg-brass text-on-brass" : "text-hero-ink hover:bg-white/10",
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
