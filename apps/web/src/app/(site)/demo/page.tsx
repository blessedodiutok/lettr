import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoAccounts } from "../../../components/demo/DemoAccounts";
import { DemoReset } from "../../../components/demo/DemoReset";
import { IS_DEMO, PORTFOLIO } from "../../../lib/demo";

export const metadata: Metadata = {
  title: "Demo tour",
  description: "Walk through a complete rental on Lettr as a tenant, a landlord and an admin.",
};

const TOUR = [
  {
    who: "Tenant",
    title: "Accept an offer and pay into escrow",
    body: "Open Messages and find Emeka's offer on the Lekki flat. Accept it, then pay on the simulated checkout. The money is held, and the agreement appears under My rental, ready to sign.",
  },
  {
    who: "Tenant",
    title: "Confirm move-in",
    body: "Under My rental, the Ikeja GRA flat is waiting for you. The keys have been handed over. Confirm move-in and watch escrow pay the landlord, with a receipt.",
  },
  {
    who: "Landlord",
    title: "Sign, hand over and answer a new enquiry",
    body: "Sign Ngozi's agreement for the Yaba studio, then mark the keys as handed over. In Inquiries, reply to Chidi, book an inspection or make an offer. New listings can be published too.",
  },
  {
    who: "Admin",
    title: "Settle a dispute and check an ID",
    body: "A dispute has paused a payout: refund the tenant or release to the landlord. Then review Bola's ID and read the audit log, which records every admin action.",
  },
];

const REAL = [
  "The full API and PostgreSQL database",
  "Rental rules: offers lapse, payment windows, no paying without an accepted offer",
  "Escrow states, disputes that pause release, sequential receipts",
  "Per-device sessions with token rotation and reuse detection",
  "Role-based access, enforced by the API on every request",
];

const SIMULATED = [
  "Paystack checkout, refunds and bank transfers. No payment details are asked for",
  "Email and push notifications. Nothing is sent, and they appear in the notification centre instead",
  "File uploads. Your files stay in your browser, and sample images take their place",
  "Sign-up. It's off, so that no personal details are collected",
];

const STACK = [
  { name: "Web", detail: "Next.js 16, React 19, Tailwind CSS 4, TanStack Query" },
  { name: "API", detail: "Express 5, Prisma 7, Zod, shared with the web app in one TypeScript monorepo" },
  { name: "Data", detail: "PostgreSQL, with money stored as exact decimals" },
  { name: "Testing", detail: "Vitest unit tests and Playwright journeys through a real browser" },
  { name: "Mobile", detail: "An Expo app on the same API is in the codebase, but isn't part of this web demo" },
];

export default function DemoPage() {
  if (!IS_DEMO) notFound();
  return (
    <div className="page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="eyebrow mb-2">Portfolio demo</p>
        <h1 className="font-display text-[34px] font-medium leading-tight text-ink sm:text-[44px]">See a whole rental, from every side</h1>
        <p className="mt-4 text-lg text-ink-2">
          Lettr is a concept for renting directly from landlords in Nigeria, with rent held in escrow until the tenant has the keys. It isn&apos;t a real service, and the homes and people here are fictional. Everything else runs as it would in production.
        </p>
      </header>

      <section aria-labelledby="start" className="mt-10">
        <h2 id="start" className="font-display text-2xl font-medium text-ink">
          Pick a role to start
        </h2>
        <p className="mb-4 mt-1 text-[15px] text-muted">Each account already has rentals in progress. You can switch at any time from the bar at the top.</p>
        <DemoAccounts />
      </section>

      <section aria-labelledby="tour" className="mt-14 max-w-3xl">
        <h2 id="tour" className="font-display text-2xl font-medium text-ink">
          A suggested route
        </h2>
        <ol className="mt-5 grid gap-6">
          {TOUR.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-navy text-sm font-bold text-on-navy" aria-hidden>
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-brass">{step.who}</p>
                <h3 className="font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="real" className="mt-14">
        <h2 id="real" className="font-display text-2xl font-medium text-ink">
          What&apos;s real, and what&apos;s simulated
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-card border border-line bg-surface p-5">
            <h3 className="font-semibold text-ink">Running for real</h3>
            <ul className="mt-3 grid list-disc gap-2 pl-5 text-[15px] text-ink-2">
              {REAL.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-line bg-surface p-5">
            <h3 className="font-semibold text-ink">Simulated in this demo</h3>
            <ul className="mt-3 grid list-disc gap-2 pl-5 text-[15px] text-ink-2">
              {SIMULATED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <DemoReset />
          <p className="min-w-0 text-sm text-muted">Other visitors share these accounts. The data goes back to its starting point every night, or whenever someone resets it.</p>
        </div>
      </section>

      <section aria-labelledby="stack" className="mt-14 max-w-3xl">
        <h2 id="stack" className="font-display text-2xl font-medium text-ink">
          How it&apos;s built
        </h2>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {STACK.map(({ name, detail }) => (
            <div key={name} className="grid gap-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-4">
              <dt className="font-semibold text-ink">{name}</dt>
              <dd className="text-[15px] text-ink-2">{detail}</dd>
            </div>
          ))}
        </dl>
        {(PORTFOLIO.author || PORTFOLIO.repo) && (
          <p className="mt-5 text-[15px] text-ink-2">
            {PORTFOLIO.author && (
              <>
                Built by{" "}
                {PORTFOLIO.url ? (
                  <a href={PORTFOLIO.url} className="font-semibold text-navy hover:underline">
                    {PORTFOLIO.author}
                  </a>
                ) : (
                  <strong className="text-ink">{PORTFOLIO.author}</strong>
                )}
                .{" "}
              </>
            )}
            {PORTFOLIO.repo && (
              <a href={PORTFOLIO.repo} className="font-semibold text-navy hover:underline">
                Read the source code
              </a>
            )}
          </p>
        )}
      </section>
    </div>
  );
}
