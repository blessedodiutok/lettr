import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsBrowser } from "../../../components/listings/ListingsBrowser";

export const metadata: Metadata = {
  title: "Homes to rent",
  description: "Browse homes to rent directly from landlords across Nigeria. Every price shows the full amount to move in — no agent fee.",
};

export default function ListingsPage() {
  return (
    <div className="page py-8 sm:py-10">
      <header className="mb-6">
        <h1 className="font-display text-[32px] font-medium leading-tight text-ink sm:text-4xl">Homes to rent</h1>
        <p className="mt-1.5 text-[15px] text-muted">Talk to the landlord directly. Pay into escrow only when you&apos;ve accepted an offer.</p>
      </header>
      <Suspense>
        <ListingsBrowser />
      </Suspense>
    </div>
  );
}
