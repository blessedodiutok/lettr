"use client";

import { Building2, Home, ShieldCheck } from "lucide-react";
import { useDemoLogin, type DemoPersona } from "../../hooks/useDemo";
import { cn } from "../../lib/cn";

const ACCOUNTS: Array<{ persona: DemoPersona; title: string; person: string; body: string; icon: typeof Home }> = [
  { persona: "tenant", title: "Tenant", person: "Tunde Bakare", body: "Has an offer to accept, keys to confirm and an inspection to attend.", icon: Home },
  { persona: "landlord", title: "Landlord", person: "Emeka Okonkwo", body: "Has an agreement to sign, a new enquiry and payouts to track.", icon: Building2 },
  { persona: "admin", title: "Admin", person: "Lettr Admin", body: "Has an ID to check, a dispute to settle and an audit log to read.", icon: ShieldCheck },
];

/** One-click sign-in. `stacked` is for narrow columns such as the login page. */
export function DemoAccounts({ stacked = false }: { stacked?: boolean }) {
  const login = useDemoLogin();
  return (
    <ul className={cn("grid gap-3", !stacked && "sm:grid-cols-3")}>
      {ACCOUNTS.map(({ persona, title, person, body, icon: Icon }) => (
        <li key={persona} className="min-w-0">
          <button
            type="button"
            disabled={login.isPending}
            onClick={() => login.mutate(persona)}
            className="flex h-full w-full items-start gap-3 rounded-card border border-line bg-surface p-4 text-left shadow-1 transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:opacity-60"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-navy-soft text-navy">
              <Icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-ink">
                {login.isPending && login.variables === persona ? "Signing in…" : `Continue as ${title.toLowerCase()}`}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-muted">{person}</span>
              <span className="mt-1.5 block text-[13px] leading-snug text-ink-2">{body}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
