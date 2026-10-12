// File: apps/web/src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { HeroSearch } from "../components/HeroSearch";
import { HomepageListings } from "../components/HomePageListings";
import { HowItWorks } from "../components/HowItWorks";
import { SavingsCalculator } from "../components/SavingsCalculator";

export const metadata: Metadata = {
  title: "Lettr — Find Your Home, Cut the Agent",
};

export default function HomePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative bg-brand-navy text-white overflow-hidden">
        {/* Subtle geometric texture overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Radial glow — bottom right */}
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 w-150 h-150 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent-400) 0%, transparent 70%)",
          }}
        />

        <div className="page-container relative z-10 py-24 lg:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-px bg-(--color-accent-400)" />
              <p className="text-(--color-accent-400) font-semibold text-xs uppercase tracking-[0.15em]">
                Nigeria's first agent-free rental platform
              </p>
            </div>

            {/* Headline */}
            <h1 className="heading-display text-4xl sm:text-5xl lg:text-[3.75rem] text-white mb-6">
              Find your home.{" "}
              <span className="text-(--color-accent-400) italic">
                Cut the agent.
              </span>
            </h1>

            <p className="text-(--color-primary-200) text-lg leading-relaxed mb-10 max-w-xl">
              Browse thousands of verified listings across Lagos, Abuja, and
              Port Harcourt. Rent directly from landlords and save up to{" "}
              <strong className="text-white font-semibold">15%</strong> in agent
              fees.
            </p>

            <HeroSearch />

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8">
              {[
                "12,000+ verified listings",
                "Zero agent fees",
                "Escrow-protected payments",
              ].map((signal) => (
                <div
                  key={signal}
                  className="flex items-center gap-2 text-sm text-(--color-primary-200)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      fill="var(--color-accent-500)"
                      opacity="0.3"
                    />
                    <path
                      d="M4.5 7l2 2 3-3"
                      stroke="var(--color-accent-400)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {signal}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Savings strip ───────────────────────────────────────────────── */}
      <section className="bg-brand-gold border-b border-(--color-accent-600)">
        <div className="page-container py-3.5">
          <p className="text-white text-center text-sm font-semibold">
            🏠 The average Lettr renter saves{" "}
            <span className="font-(family-name:--font-display) text-base font-bold">
              ₦315,000
            </span>{" "}
            in agent fees per tenancy.{" "}
            <span className="opacity-80">Zero agents. Zero surprises.</span>
          </p>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="section-gap bg-white">
        <div className="page-container">
          <div className="text-center mb-16">
            <p className="label-section mb-3">Simple by design</p>
            <h2 className="heading-display text-3xl sm:text-4xl text-brand-navy mb-4">
              Renting made simple
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto leading-relaxed">
              No agents. No mystery fees. A clear, transparent process from
              search to handover.
            </p>
          </div>
          <HowItWorks />
        </div>
      </section>

      {/* ── Featured listings ───────────────────────────────────────────── */}
      <section className="section-gap bg-(--color-neutral-50)">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label-section mb-2">Fresh on Lettr</p>
              <h2 className="heading-display text-3xl text-brand-navy">
                Latest listings
              </h2>
            </div>
            <Link
              href="/listings"
              className="
                group flex items-center gap-1.5
                text-sm font-semibold text-brand-navy
                hover:text-(--color-primary-700)
                transition-colors
              "
            >
              View all
              <span
                className="
                  inline-block transition-transform duration-150
                  group-hover:translate-x-0.5
                "
              >
                →
              </span>
            </Link>
          </div>
          <HomepageListings />
        </div>
      </section>

      {/* ── Savings calculator ──────────────────────────────────────────── */}
      <section className="section-gap bg-white">
        <div className="page-container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="label-section mb-3">Do the math</p>
            <h2 className="heading-display text-3xl text-brand-navy mb-4">
              How much could you save?
            </h2>
            <p className="text-neutral-500">
              Enter your expected annual rent to see your exact saving.
            </p>
          </div>
          <SavingsCalculator />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-(--color-primary-900) overflow-hidden">
        {/* Diagonal accent bar */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-1/2 h-full opacity-5"
          style={{
            background:
              "linear-gradient(135deg, transparent 40%, var(--color-accent-500) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "var(--color-primary-400)" }}
        />

        <div className="page-container relative z-10 py-20 lg:py-24">
          <div className="max-w-2xl mx-auto text-center">
            <p className="label-section text-(--color-accent-400) mb-4">
              Join the movement
            </p>
            <h2 className="heading-display text-3xl sm:text-4xl text-white mb-4">
              Ready to ditch the agent?
            </h2>
            <p className="text-(--color-primary-300) mb-10 text-lg">
              Join thousands of Nigerians renting smarter.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/signup?role=TENANT"
                className="
                  inline-flex items-center justify-center
                  h-12 px-8 rounded-(--radius-lg)
                  bg-brand-gold text-white
                  font-semibold text-sm
                  hover:bg-(--color-accent-600)
                  transition-all duration-150
                  shadow-lg shadow-(--color-accent-900)/30
                  hover:shadow-xl hover:-translate-y-0.5
                "
              >
                Find a home
              </Link>
              <Link
                href="/auth/signup?role=LANDLORD"
                className="
                  inline-flex items-center justify-center
                  h-12 px-8 rounded-(--radius-lg)
                  border border-white/20 text-white
                  font-semibold text-sm
                  hover:bg-white/8 hover:border-white/30
                  transition-all duration-150
                  backdrop-blur-sm
                "
              >
                List your property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
