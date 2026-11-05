import Link from "next/link";
import { Logo, SampleMarker } from "../../../components/layout/brand";
import { SAMPLE_TESTIMONIALS } from "../../../content/sample";
import { IS_DEMO } from "../../../lib/demo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const quote = SAMPLE_TESTIMONIALS[0];
  return (
    <div className="flex min-h-svh">
      <aside className="relative hidden w-[42%] max-w-xl flex-col justify-between overflow-hidden bg-navy-deep p-10 text-hero-ink lg:flex">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 size-[480px] rounded-full bg-[radial-gradient(circle,rgb(184_134_42/0.22),transparent_65%)]" />
        <Link href="/" className="relative font-display text-2xl font-semibold">
          Lettr<span className="text-hero-accent">.</span>
        </Link>
        <figure className="relative">
          <SampleMarker className="mb-4 border-hero-accent/50 bg-transparent text-hero-accent" />
          <blockquote className="font-display text-[28px] leading-snug">“{quote.quote}”</blockquote>
          <figcaption className="mt-4 text-sm text-hero-muted">
            {quote.name} · {quote.detail}
          </figcaption>
        </figure>
        <p className="relative text-xs text-hero-muted">{IS_DEMO ? "Portfolio demo · Simulated payments" : "Payments secured by Paystack · No agent fees"}</p>
      </aside>
      <main id="main" className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-6 py-5 lg:hidden">
          <Logo />
          <Link href="/" className="text-sm text-muted hover:text-navy">
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </main>
    </div>
  );
}
