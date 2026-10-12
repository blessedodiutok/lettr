import { calculateMoveInCost, formatCurrency } from "@lettr/utils";
import { BadgeCheck, Lock, MessageSquare, Wallet } from "lucide-react";
import Link from "next/link";
import { SampleMarker } from "../../components/layout/brand";
import { HeroSearch } from "../../components/listings/HeroSearch";
import { LatestListings } from "../../components/listings/LatestListings";
import { Button } from "../../components/ui/button";
import { SAMPLE_STATS, SAMPLE_TESTIMONIALS } from "../../content/sample";

const STEPS = [
  { title: "Inspect", body: "Message the landlord and book a viewing. No agent sits in the middle." },
  { title: "Pay into escrow", body: "Accept the landlord's offer and pay through Paystack. The landlord can't touch it yet." },
  { title: "Sign", body: "You both sign the tenancy agreement on Lettr, with every signature time-stamped." },
  { title: "Move in", body: "Confirm you have the keys. Only then is the landlord paid." },
];

const example = calculateMoveInCost({ annualRent: 4_500_000, cautionFee: 450_000, serviceCharge: 300_000 });

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-deep text-hero-ink">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-24 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(184_134_42/0.22),transparent_65%)]" />
        <div className="page relative py-16 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hero-accent">Lagos · Abuja · Port Harcourt</p>
          <h1 className="mt-4 max-w-3xl font-display text-[40px] font-medium leading-[1.04] tracking-tight sm:text-[60px]">Pay the landlord, not an agent.</h1>
          <p className="mt-5 max-w-xl text-[17px] text-hero-muted">Rent directly from ID-checked landlords. Your money waits in escrow until you have the keys.</p>
          <div className="mt-8 max-w-3xl">
            <HeroSearch />
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-hero-muted">
            <li className="flex items-center gap-2">
              <Lock className="size-4 text-hero-accent" aria-hidden /> <b className="font-semibold text-hero-ink">Paystack escrow</b> on every payment
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-hero-accent" aria-hidden /> <b className="font-semibold text-hero-ink">ID-checked</b> landlords
            </li>
            <li className="flex items-center gap-2">
              <Wallet className="size-4 text-hero-accent" aria-hidden /> <b className="font-semibold text-hero-ink">₦0</b> agent fee
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="how" className="border-b border-line bg-surface">
        <div className="page py-12">
          <h2 id="how" className="sr-only">
            How renting on Lettr works
          </h2>
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <span className="font-mono text-xs font-medium text-brass">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-1 text-base font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="page py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-1.5">New on Lettr</p>
            <h2 className="font-display text-3xl font-medium text-ink">Latest homes</h2>
          </div>
          <Link href="/listings" className="text-sm font-semibold text-navy hover:underline">
            See all homes →
          </Link>
        </div>
        <LatestListings />
      </section>

      <section className="border-y border-line bg-surface">
        <div className="page grid gap-10 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow mb-1.5">What you actually pay</p>
            <h2 className="font-display text-3xl font-medium text-ink">One price, shown up front.</h2>
            <p className="mt-3 max-w-lg text-[15px] text-muted">
              Every home shows the full amount to move in: rent, refundable caution fee, any service or legal charge, and Lettr&apos;s 3% fee. There&apos;s no agent fee and nothing added at the end.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link href="/how-it-works">How escrow protects you</Link>
            </Button>
          </div>
          <div className="rounded-card border border-line bg-bg p-6">
            <p className="text-sm font-semibold text-ink">Example: 2-bedroom flat at {formatCurrency(example.annualRent)} a year</p>
            <dl className="mt-4 grid gap-2 text-sm">
              {[
                ["Annual rent", example.annualRent],
                ["Caution fee (refundable)", example.cautionFee],
                ["Service charge", example.serviceCharge],
                ["Lettr fee (3%)", example.platformFee],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between">
                  <dt className="text-ink-2">{label}</dt>
                  <dd className="tnum">{formatCurrency(value as number)}</dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t border-line pt-3 font-bold">
                <dt>Total to move in</dt>
                <dd className="tnum">{formatCurrency(example.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-control bg-ok-soft px-3 py-2.5 text-[13px] font-semibold text-ok">
              An agent charging 15% would have cost {formatCurrency(example.agentFeeAvoided)}. You keep {formatCurrency(example.netSaving)}.
            </p>
          </div>
        </div>
      </section>

      <section className="page py-14">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h2 className="font-display text-3xl font-medium text-ink">Renters and landlords on Lettr</h2>
          <SampleMarker />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.8fr]">
          {SAMPLE_TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-card border border-line bg-surface p-6">
              <blockquote className="font-display text-xl leading-snug text-ink">“{t.quote}”</blockquote>
              <figcaption className="mt-4 text-sm">
                <b className="font-semibold text-ink">{t.name}</b> <span className="text-muted">· {t.detail}</span>
              </figcaption>
            </figure>
          ))}
          <dl className="grid content-center gap-4 rounded-card bg-navy-deep p-6 text-hero-ink">
            {SAMPLE_STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-[13px] text-hero-muted">{s.label}</dt>
                <dd className="font-display text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="page flex flex-col items-start gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-navy-soft text-navy">
              <MessageSquare className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="font-display text-2xl font-medium text-ink">Own a property? Let it without an agent.</h2>
              <p className="mt-1 text-[15px] text-muted">List it free, talk to tenants directly, and get paid as soon as they move in.</p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href="/for-landlords">List your property</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
