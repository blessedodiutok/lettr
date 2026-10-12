// File: apps/web/src/components/ListingsBrowser.tsx
"use client";

import { Filter, List, Map, X } from "lucide-react";
import { useState } from "react";
import { useListings } from "../hooks/useListings";
import { formatNaira } from "../lib/utils";
import { useSearchStore } from "../stores/searchStore";
import { EmptyState } from "./EmptyState";
import { PropertyCard } from "./PropertyCard";
import { SearchFilters } from "./SearchFilters";
import { Button } from "./ui/button";
import { PropertyCardSkeletonGrid } from "./ui/skeleton";

/* ── Active filter chips ───────────────────────────────────────────────────── */
function ActiveFilterChips() {
  const { filters, setFilter, resetFilters } = useSearchStore();

  const chips: { key: string; label: string; onRemove: () => void }[] = [];

  if (filters.state)
    chips.push({
      key: "state",
      label: filters.state,
      onRemove: () => setFilter("state", ""),
    });
  if (filters.propertyType)
    chips.push({
      key: "propertyType",
      label: filters.propertyType
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      onRemove: () => setFilter("propertyType", ""),
    });
  if (filters.bedrooms)
    chips.push({
      key: "bedrooms",
      label: filters.bedrooms === "0" ? "Studio" : `${filters.bedrooms}+ beds`,
      onRemove: () => setFilter("bedrooms", ""),
    });
  if (filters.minRent)
    chips.push({
      key: "minRent",
      label: `From ${formatNaira(Number(filters.minRent))}`,
      onRemove: () => setFilter("minRent", ""),
    });
  if (filters.maxRent)
    chips.push({
      key: "maxRent",
      label: `Up to ${formatNaira(Number(filters.maxRent))}`,
      onRemove: () => setFilter("maxRent", ""),
    });
  if (filters.isFurnished)
    chips.push({
      key: "isFurnished",
      label: "Furnished",
      onRemove: () => setFilter("isFurnished", null),
    });
  if (filters.isServiced)
    chips.push({
      key: "isServiced",
      label: "Serviced",
      onRemove: () => setFilter("isServiced", null),
    });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-[var(--color-neutral-400)] font-medium">
        Active:
      </span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="
            inline-flex items-center gap-1.5
            px-2.5 py-1 rounded-full
            text-xs font-medium
            bg-[var(--color-primary-50)]
            text-[var(--color-primary-700)]
            border border-[var(--color-primary-200)]
            hover:bg-[var(--color-primary-100)]
            hover:border-[var(--color-primary-300)]
            transition-colors duration-150
          "
        >
          {chip.label}
          <X size={10} aria-hidden="true" />
        </button>
      ))}
      <button
        type="button"
        onClick={resetFilters}
        className="text-xs text-[var(--color-neutral-400)] hover:text-[var(--color-danger-500)] transition-colors font-medium"
      >
        Clear all
      </button>
    </div>
  );
}

/* ── Pagination ────────────────────────────────────────────────────────────── */
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  /* Build page numbers with ellipsis */
  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (page >= totalPages - 3)
      return [
        1,
        "…",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className="
          w-9 h-9 rounded-lg flex items-center justify-center
          text-sm font-medium
          border border-[var(--color-neutral-200)]
          text-[var(--color-neutral-600)]
          hover:bg-[var(--color-neutral-100)]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors duration-150
        "
      >
        ‹
      </button>

      {getPages().map((p, i) =>
        p === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="w-9 h-9 flex items-center justify-center text-sm text-[var(--color-neutral-400)]"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={[
              "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-150",
              p === page
                ? "bg-[var(--color-primary-600)] text-white border border-[var(--color-primary-600)] shadow-sm"
                : "border border-[var(--color-neutral-200)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-100)]",
            ].join(" ")}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className="
          w-9 h-9 rounded-lg flex items-center justify-center
          text-sm font-medium
          border border-[var(--color-neutral-200)]
          text-[var(--color-neutral-600)]
          hover:bg-[var(--color-neutral-100)]
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors duration-150
        "
      >
        ›
      </button>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export function ListingsBrowser() {
  const { filters, isMapView, toggleMapView } = useSearchStore();
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data, isLoading, isError } = useListings(filters, page);

  const totalResults = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  function handlePageChange(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* ── Filter sidebar — desktop ──────────────────────────────────────── */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <SearchFilters />
      </aside>

      {/* ── Results area ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="
                lg:hidden flex items-center gap-1.5
                h-9 px-3 rounded-lg
                border border-[var(--color-neutral-200)]
                text-sm font-medium text-[var(--color-neutral-700)]
                bg-white hover:bg-[var(--color-neutral-50)]
                transition-colors duration-150
              "
            >
              <Filter size={14} aria-hidden="true" />
              Filters
            </button>

            {/* Result count */}
            <p className="text-sm text-[var(--color-neutral-500)]">
              {isLoading ? (
                <span className="inline-block w-24 h-4 rounded skeleton" />
              ) : (
                <>
                  <span className="font-semibold text-[var(--color-neutral-800)]">
                    {totalResults.toLocaleString()}
                  </span>{" "}
                  {totalResults === 1 ? "property" : "properties"} found
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Map / list toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMapView}
              className="gap-1.5 text-[var(--color-neutral-600)]"
            >
              {isMapView ? (
                <>
                  <List size={14} aria-hidden="true" /> List
                </>
              ) : (
                <>
                  <Map size={14} aria-hidden="true" /> Map
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active filter chips */}
        <ActiveFilterChips />

        {/* Results grid */}
        {isLoading ? (
          <PropertyCardSkeletonGrid count={9} />
        ) : isError ? (
          <EmptyState
            icon="search"
            title="Something went wrong"
            description="We couldn't load listings right now. Please try again."
          />
        ) : !data?.listings.length ? (
          <EmptyState
            icon="search"
            title="No listings found"
            description="Try adjusting your filters — there may be listings in nearby areas."
            ctaLabel="Clear filters"
            onCtaClick={() => useSearchStore.getState().resetFilters()}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {data.listings.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMobileFiltersOpen(false)}
        className={[
          "fixed inset-0 z-[var(--z-overlay)] bg-black/30 backdrop-blur-[2px]",
          "lg:hidden transition-opacity duration-200",
          mobileFiltersOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* Drawer panel */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-[var(--z-modal)] w-80 max-w-[90vw]",
          "lg:hidden bg-white shadow-2xl",
          "transition-transform duration-300 ease-out",
          mobileFiltersOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-neutral-200)]">
          <h2 className="font-semibold text-[var(--color-neutral-800)]">
            Filters
          </h2>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            aria-label="Close filters"
            className="
              w-8 h-8 rounded-lg flex items-center justify-center
              text-[var(--color-neutral-500)]
              hover:bg-[var(--color-neutral-100)]
              transition-colors
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter content — reuse the same component */}
        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          <div className="px-2 py-4">
            <SearchFilters />
          </div>
        </div>
      </div>
    </div>
  );
}
