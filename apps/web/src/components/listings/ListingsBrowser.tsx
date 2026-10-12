"use client";

import { LAUNCH_STATES, NIGERIAN_STATES, PROPERTY_TYPE_LABELS } from "@lettr/types";
import { formatCurrencyShort } from "@lettr/utils";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FILTER_KEYS, type ListingFilters, useListingSearch } from "../../hooks/useListings";
import { cn } from "../../lib/cn";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { EmptyState, ErrorState } from "../ui/display";
import { Checkbox, Field, Input, Select } from "../ui/field";
import { ListingCard, ListingCardSkeleton } from "./ListingCard";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Lowest price" },
  { value: "price_desc", label: "Highest price" },
  { value: "popular", label: "Most viewed" },
];

const OTHER_STATES = NIGERIAN_STATES.filter((s) => !LAUNCH_STATES.includes(s));

function useFilters(): [ListingFilters, (patch: Partial<ListingFilters>) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? undefined])) as ListingFilters;
  const update = (patch: Partial<ListingFilters>) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any change other than paging returns to the first page.
    if (!("page" in patch)) next.delete("page");
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: "page" in patch });
  };
  return [filters, update];
}

function chipsFor(filters: ListingFilters): Array<{ key: keyof ListingFilters; label: string }> {
  const chips: Array<{ key: keyof ListingFilters; label: string }> = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.state) chips.push({ key: "state", label: filters.state });
  if (filters.propertyType) chips.push({ key: "propertyType", label: PROPERTY_TYPE_LABELS[filters.propertyType as keyof typeof PROPERTY_TYPE_LABELS] ?? filters.propertyType });
  if (filters.bedrooms) chips.push({ key: "bedrooms", label: `${filters.bedrooms}+ bedrooms` });
  if (filters.minRent) chips.push({ key: "minRent", label: `From ${formatCurrencyShort(Number(filters.minRent))}` });
  if (filters.maxRent) chips.push({ key: "maxRent", label: `Up to ${formatCurrencyShort(Number(filters.maxRent))}` });
  if (filters.isFurnished) chips.push({ key: "isFurnished", label: "Furnished" });
  if (filters.isServiced) chips.push({ key: "isServiced", label: "Serviced" });
  return chips;
}

function FiltersDialog({ open, onOpenChange, filters, apply }: { open: boolean; onOpenChange: (v: boolean) => void; filters: ListingFilters; apply: (f: Partial<ListingFilters>) => void }) {
  const [draft, setDraft] = useState<ListingFilters>(filters);
  useEffect(() => {
    if (open) setDraft(filters);
    // Only reset the draft when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (patch: Partial<ListingFilters>) => setDraft((d) => ({ ...d, ...patch }));
  const cleared: Partial<ListingFilters> = { state: undefined, propertyType: undefined, bedrooms: undefined, minRent: undefined, maxRent: undefined, isFurnished: undefined, isServiced: undefined };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Filters"
      footer={
        <>
          <Button variant="ghost" onClick={() => setDraft((d) => ({ ...d, ...cleared }))}>
            Clear filters
          </Button>
          <Button
            onClick={() => {
              apply({ state: draft.state, propertyType: draft.propertyType, bedrooms: draft.bedrooms, minRent: draft.minRent, maxRent: draft.maxRent, isFurnished: draft.isFurnished, isServiced: draft.isServiced });
              onOpenChange(false);
            }}
          >
            Show homes
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <Field label="State">
          <Select value={draft.state ?? ""} onChange={(e) => set({ state: e.target.value || undefined })}>
            <option value="">Anywhere</option>
            <optgroup label="Popular">
              {LAUNCH_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </optgroup>
            <optgroup label="All states">
              {OTHER_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="Home type">
          <Select value={draft.propertyType ?? ""} onChange={(e) => set({ propertyType: e.target.value || undefined })}>
            <option value="">Any</option>
            {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">Bedrooms</legend>
          <div className="flex flex-wrap gap-2">
            {["", "1", "2", "3", "4"].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={(draft.bedrooms ?? "") === value}
                onClick={() => set({ bedrooms: value || undefined })}
                className={cn(
                  "h-9 min-w-14 rounded-full border px-3 text-sm font-medium",
                  (draft.bedrooms ?? "") === value ? "border-navy bg-navy text-on-navy" : "border-line-strong bg-surface text-ink-2 hover:border-navy",
                )}
              >
                {value ? `${value}+` : "Any"}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min rent / year">
            <Input inputMode="numeric" prefix="₦" placeholder="No min" value={draft.minRent ?? ""} onChange={(e) => set({ minRent: e.target.value.replace(/\D/g, "") || undefined })} />
          </Field>
          <Field label="Max rent / year">
            <Input inputMode="numeric" prefix="₦" placeholder="No max" value={draft.maxRent ?? ""} onChange={(e) => set({ maxRent: e.target.value.replace(/\D/g, "") || undefined })} />
          </Field>
        </div>
        <div className="grid gap-1">
          <Checkbox label="Furnished" checked={draft.isFurnished === "true"} onChange={(e) => set({ isFurnished: e.target.checked ? "true" : undefined })} />
          <Checkbox label="Serviced" description="Estate management handles utilities and upkeep" checked={draft.isServiced === "true"} onChange={(e) => set({ isServiced: e.target.checked ? "true" : undefined })} />
        </div>
      </div>
    </Dialog>
  );
}

export function ListingsBrowser() {
  const [filters, update] = useFilters();
  const [query, setQuery] = useState(filters.q ?? "");
  const [dialog, setDialog] = useState(false);
  useEffect(() => setQuery(filters.q ?? ""), [filters.q]);
  const { data, isPending, isError, isFetching, refetch } = useListingSearch(filters);
  const chips = chipsFor(filters);
  const page = Number(filters.page ?? 1);
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: query.trim() || undefined });
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="listing-search" className="sr-only">
            Search by area, street or title
          </label>
          <input
            id="listing-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by area, street or title"
            className="h-12 w-full rounded-card border border-line-strong bg-surface pl-11 pr-4 text-[15px] text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/25"
          />
        </form>
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={() => setDialog(true)} className="flex-1 md:flex-none">
            <SlidersHorizontal className="size-4" aria-hidden /> Filters{chips.filter((c) => c.key !== "q").length ? ` · ${chips.filter((c) => c.key !== "q").length}` : ""}
          </Button>
          <label htmlFor="sort" className="sr-only">
            Sort by
          </label>
          <select
            id="sort"
            value={filters.sortBy ?? "newest"}
            onChange={(e) => update({ sortBy: e.target.value === "newest" ? undefined : e.target.value })}
            className="h-12 flex-1 cursor-pointer rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink md:flex-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => update({ [chip.key]: undefined })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-navy-soft px-3 text-[13px] font-medium text-navy hover:bg-navy-soft/70"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label} <X className="size-3.5" aria-hidden />
            </button>
          ))}
          <button
            type="button"
            className="text-[13px] font-semibold text-muted hover:text-ink"
            onClick={() => update(Object.fromEntries(FILTER_KEYS.filter((k) => k !== "sortBy").map((k) => [k, undefined])))}
          >
            Clear all
          </button>
        </div>
      )}

      <p className="mt-5 text-sm text-muted" aria-live="polite">
        {isPending ? "Searching…" : `${total.toLocaleString()} ${total === 1 ? "home" : "homes"}${filters.state ? ` in ${filters.state}` : ""} · prices are per year`}
      </p>

      <div className={cn("mt-4 transition-opacity", isFetching && !isPending && "opacity-60")}>
        {isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message="We couldn't load homes right now." onRetry={() => refetch()} />
        ) : data.listings.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" />}
            title="No homes match these filters"
            description="Try a wider budget, fewer bedrooms, or a nearby area."
            action={
              <Button variant="secondary" onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.listings.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 3} />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => update({ page: page > 2 ? String(page - 1) : undefined })}>
            Previous
          </Button>
          <span className="tnum text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) })}>
            Next
          </Button>
        </nav>
      )}

      <FiltersDialog open={dialog} onOpenChange={setDialog} filters={filters} apply={update} />
    </div>
  );
}
