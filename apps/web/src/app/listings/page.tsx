// File: apps/web/src/app/listings/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListingsBrowser } from "../../components/ListingsBrowser";

export const metadata: Metadata = {
  title: "Browse Listings",
  description: "Find your perfect rental across Nigeria. No agent fees.",
};

export default function ListingsPage() {
  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Page header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="page-container py-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex items-center gap-1.5 text-xs text-neutral-400">
              <li>
                <Link
                  href="/"
                  className="hover:text-brand-navy transition-colors"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-neutral-600 font-medium">Browse listings</li>
            </ol>
          </nav>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="heading-display text-3xl text-brand-navy">
                Browse properties
              </h1>
              <p className="text-neutral-500 mt-1.5 text-sm">
                Verified listings across Nigeria — zero agent fees, zero
                surprises
              </p>
            </div>

            {/* Trust badge */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 bg-(--color-success-50) border border-(--color-success-100) rounded-lg px-3 py-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="7" cy="7" r="6" fill="var(--color-success-500)" />
                <path
                  d="M4.5 7l2 2 3-3"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs font-semibold text-(--color-success-700)">
                All listings verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Browser */}
      <div className="page-container py-8">
        <Suspense>
          <ListingsBrowser />
        </Suspense>
      </div>
    </div>
  );
}
