// File: apps/web/src/components/auth/AuthLayout.tsx
// Split-panel layout used by all auth pages.
// Left: brand panel (desktop only). Right: form panel.

import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — brand (desktop only) ────────────────────────────── */}
      <div
        className="
          hidden lg:flex lg:w-[46%] xl:w-2/5
          flex-col justify-between
          bg-brand-navy
          relative overflow-hidden
          p-10
        "
      >
        {/* Texture overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -right-40 w-125 h-125 rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent-400) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <Link
          href="/"
          className="
            relative z-10
            font-(family-name:--font-display)
            font-bold text-2xl text-white tracking-tight
            hover:opacity-90 transition-opacity
          "
        >
          Lettr
        </Link>

        {/* Brand copy */}
        <div className="relative z-10 space-y-8">
          {/* Pull quote */}
          <blockquote className="space-y-4">
            <p
              className="
                text-2xl xl:text-3xl font-bold text-white leading-snug
                font-(family-name:--font-display)
              "
            >
              "Saved ₦420,000 on my first year's rent. No agents, no stress."
            </p>
            <footer className="flex items-center gap-3">
              <div
                className="
                w-9 h-9 rounded-full
                bg-(--color-primary-400)
                flex items-center justify-center
                text-white text-sm font-bold
                shrink-0
              "
              >
                AO
              </div>
              <div>
                <p className="text-white text-sm font-semibold">
                  Adaeze Okafor
                </p>
                <p className="text-(--color-primary-300) text-xs">
                  Tenant · Lekki, Lagos
                </p>
              </div>
            </footer>
          </blockquote>

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[
              { stat: "12k+", label: "Listings" },
              { stat: "₦0", label: "Agent fees" },
              { stat: "4.9★", label: "User rating" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <p className="font-(family-name:--font-display) font-bold text-xl text-white">
                  {stat}
                </p>
                <p className="text-xs text-(--color-primary-300) mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-(--color-primary-400)">
          © {new Date().getFullYear()} Lettr Technologies Ltd
        </p>
      </div>

      {/* ── Right panel — form ─────────────────────────────────────────────── */}
      <div
        className="
        flex-1
        flex flex-col
        bg-(--color-neutral-50)
        overflow-y-auto
      "
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200">
          <Link
            href="/"
            className="
              font-(family-name:--font-display)
              font-bold text-xl text-brand-navy
            "
          >
            Lettr
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-neutral-500 hover:text-brand-navy transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-105">
            {/* Heading */}
            <div className="mb-8">
              <h1 className="heading-display text-3xl text-brand-navy mb-2">
                {heading}
              </h1>
              <p className="text-neutral-500g-relaxed">{subheading}</p>
            </div>

            {/* Form card */}
            <div
              className="
              bg-white rounded-2xl
              border border-neutral-200
              shadow-(--shadow-md)
              p-7
            "
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
