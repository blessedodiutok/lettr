import { RENTAL_RULES } from "@lettr/utils";
import { BadgeCheck, Banknote, FileSignature, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SampleMarker } from "../../../components/layout/brand";
import { Button } from "../../../components/ui/button";
import { SAMPLE_TESTIMONIALS } from "../../../content/sample";

export const metadata: Metadata = {
  title: "List your property",
  description: "List your property on Lettr for free. Talk to tenants directly and get paid as soon as they move in.",
};

const POINTS = [
  { icon: MessageSquare, title: "Talk to tenants directly", body: "Every inquiry comes to you. See each tenant's profile, book inspections and choose who to offer the home to." },
  { icon: FileSignature, title: "Agreement generated for you", body: "A tenancy agreement is created from your listing's terms when the tenant pays. Both of you sign online." },
  { icon: Banknote, title: "Paid when they move in", body: `Rent is already in escrow before you hand over the keys. It's released when the tenant confirms, or ${RENTAL_RULES.autoReleaseDays} days after handover.` },
  { icon: BadgeCheck, title: "A badge tenants trust", body: "Verify your ID once and every listing carries the ID-verified badge." },
];

export default function ForLandlordsPage() {
  const quote = SAMPLE_TESTIMONIALS[1];
  return (
    <>
      <section className="bg-navy-deep text-hero-ink">
        <div className="page py-16 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-hero-accent">For landlords</p>
          <h1 className="mt-4 max-w-2xl font-display text-[40px] font-medium leading-[1.05] sm:text-[54px]">Let your property without an agent.</h1>
          <p className="mt-4 max-w-xl text-[17px] text-hero-muted">Listing is free. Tenants pay Lettr&apos;s 3% fee, and the rent is secured in escrow before you hand over a single key.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/auth/signup?role=LANDLORD">Create a landlord account</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/login?next=/landlord/listings/new">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>
      <section className="page grid gap-6 py-14 sm:grid-cols-2">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-soft text-navy">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-ink">{title}</h2>
              <p className="mt-1 text-[15px] text-muted">{body}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="border-t border-line bg-surface">
        <div className="page py-14">
          <h2 className="font-display text-3xl font-medium text-ink">Listing takes about ten minutes</h2>
          <ol className="mt-6 grid gap-4 text-[15px] text-ink-2 sm:grid-cols-3">
            <li className="rounded-card border border-line p-5">
              <b className="block text-ink">1. Describe the home</b>Location, rooms, amenities and the rent you want.
            </li>
            <li className="rounded-card border border-line p-5">
              <b className="block text-ink">2. Add photos</b>Bright, wide photos of every room. The first one becomes the cover.
            </li>
            <li className="rounded-card border border-line p-5">
              <b className="block text-ink">3. Verify and publish</b>Upload a government ID once. Your listing goes live straight away while we review it.
            </li>
          </ol>
          <figure className="mt-10 max-w-2xl">
            <div className="mb-2">
              <SampleMarker />
            </div>
            <blockquote className="font-display text-2xl leading-snug text-ink">“{quote.quote}”</blockquote>
            <figcaption className="mt-3 text-sm text-muted">
              {quote.name} · {quote.detail}
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
