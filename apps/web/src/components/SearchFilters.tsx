// File: apps/web/src/components/SearchFilters.tsx
"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { formatNaira } from "../lib/utils";
import { useSearchStore, type SearchFilters as SearchFilterValues } from "../stores/searchStore";

const STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Kano",
  "Oyo",
  "Delta",
  "Anambra",
  "Enugu",
  "Ogun",
  "Edo",
  "Kaduna",
  "Imo",
];

const PROPERTY_TYPES = [
  { value: "SELF_CONTAINED", label: "Self Contained" },
  { value: "MINI_FLAT", label: "Mini Flat" },
  { value: "ONE_BEDROOM", label: "1 Bed" },
  { value: "TWO_BEDROOM", label: "2 Bed" },
  { value: "THREE_BEDROOM", label: "3 Bed" },
  { value: "FOUR_BEDROOM", label: "4 Bed" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "BUNGALOW", label: "Bungalow" },
  { value: "BOYS_QUARTERS", label: "Boys' Qtrs" },
] as const;

const BEDROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "0", label: "Studio" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
] as const;

/* ── Pill toggle button ────────────────────────────────────────────────────── */
function PillToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
        active
          ? "bg-[var(--color-primary-600)] text-white border-[var(--color-primary-600)] shadow-sm"
          : "bg-white text-[var(--color-neutral-600)] border-[var(--color-neutral-200)] hover:border-[var(--color-primary-300)] hover:text-[var(--color-primary-600)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

/* ── Filter section wrapper ────────────────────────────────────────────────── */
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-5 border-b border-[var(--color-neutral-100)] last:border-0">
      <p className="label-section mb-3">{title}</p>
      {children}
    </div>
  );
}

/* ── Active filter count ───────────────────────────────────────────────────── */
function useActiveFilterCount(
  filters: SearchFilterValues,
) {
  let count = 0;
  if (filters.state) count++;
  if (filters.propertyType) count++;
  if (filters.bedrooms) count++;
  if (filters.minRent) count++;
  if (filters.maxRent) count++;
  if (filters.isFurnished) count++;
  if (filters.isServiced) count++;
  return count;
}

/* ── Main component ────────────────────────────────────────────────────────── */
export function SearchFilters() {
  const { filters, setFilter, resetFilters } = useSearchStore();
  const activeCount = useActiveFilterCount(filters);

  return (
    <aside
      aria-label="Property search filters"
      className="
        bg-white rounded-2xl
        border border-[var(--color-neutral-200)]
        shadow-[var(--shadow-card)]
        sticky top-[5.5rem]
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-neutral-100)]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={15}
            className="text-[var(--color-primary-600)]"
            aria-hidden="true"
          />
          <h2 className="font-semibold text-sm text-[var(--color-neutral-800)]">
            Filters
          </h2>
          {activeCount > 0 && (
            <span
              className="
              inline-flex items-center justify-center
              w-5 h-5 rounded-full text-[10px] font-bold
              bg-[var(--color-primary-600)] text-white
            "
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="
              flex items-center gap-1 text-xs font-semibold
              text-[var(--color-danger-500)]
              hover:text-[var(--color-danger-600)]
              transition-colors
            "
          >
            <X size={12} aria-hidden="true" />
            Clear all
          </button>
        )}
      </div>

      <div className="px-5 overflow-y-auto max-h-[calc(100vh-12rem)]">
        {/* State */}
        <FilterSection title="Location">
          <div className="relative">
            <select
              value={filters.state ?? ""}
              onChange={(e) => setFilter("state", e.target.value)}
              aria-label="Filter by state"
              className="
                w-full h-10 pl-3 pr-8
                bg-[var(--color-neutral-50)]
                text-[var(--color-neutral-800)] text-sm
                border border-[var(--color-neutral-200)] rounded-lg
                appearance-none
                focus:outline-none focus:ring-2
                focus:ring-[var(--color-primary-600)] focus:ring-inset
                focus:border-transparent
                transition-all duration-150
                cursor-pointer
              "
            >
              <option value="">All states</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {/* Chevron */}
            <span
              aria-hidden="true"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-neutral-400)]"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 4.5l3.5 3 3.5-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </FilterSection>

        {/* Property type */}
        <FilterSection title="Property type">
          <div className="flex flex-wrap gap-1.5">
            <PillToggle
              active={!filters.propertyType}
              onClick={() => setFilter("propertyType", "")}
            >
              Any
            </PillToggle>
            {PROPERTY_TYPES.map((t) => (
              <PillToggle
                key={t.value}
                active={filters.propertyType === t.value}
                onClick={() =>
                  setFilter(
                    "propertyType",
                    filters.propertyType === t.value ? "" : t.value,
                  )
                }
              >
                {t.label}
              </PillToggle>
            ))}
          </div>
        </FilterSection>

        {/* Bedrooms */}
        <FilterSection title="Bedrooms">
          <div className="flex flex-wrap gap-1.5">
            {BEDROOM_OPTIONS.map(({ value, label }) => (
              <PillToggle
                key={value}
                active={filters.bedrooms === value}
                onClick={() => setFilter("bedrooms", value)}
              >
                {label}
              </PillToggle>
            ))}
          </div>
        </FilterSection>

        {/* Price range */}
        <FilterSection title="Annual rent (₦)">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {/* Min */}
              <div>
                <label
                  htmlFor="filter-min-rent"
                  className="block text-[10px] font-semibold text-[var(--color-neutral-400)] uppercase tracking-[0.08em] mb-1.5"
                >
                  Minimum
                </label>
                <input
                  id="filter-min-rent"
                  type="number"
                  min={0}
                  max={50_000_000}
                  step={100_000}
                  placeholder="No min"
                  value={filters.minRent ?? ""}
                  onChange={(e) => setFilter("minRent", e.target.value || "")}
                  className="
                    w-full h-9 px-3
                    bg-[var(--color-neutral-50)]
                    text-[var(--color-neutral-800)] text-sm
                    border border-[var(--color-neutral-200)] rounded-lg
                    focus:outline-none focus:ring-2
                    focus:ring-[var(--color-primary-600)] focus:ring-inset
                    focus:border-transparent
                    transition-all duration-150
                    [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                  "
                />
              </div>
              {/* Max */}
              <div>
                <label
                  htmlFor="filter-max-rent"
                  className="block text-[10px] font-semibold text-[var(--color-neutral-400)] uppercase tracking-[0.08em] mb-1.5"
                >
                  Maximum
                </label>
                <input
                  id="filter-max-rent"
                  type="number"
                  min={0}
                  max={100_000_000}
                  step={100_000}
                  placeholder="No max"
                  value={filters.maxRent ?? ""}
                  onChange={(e) => setFilter("maxRent", e.target.value || "")}
                  className="
                    w-full h-9 px-3
                    bg-[var(--color-neutral-50)]
                    text-[var(--color-neutral-800)] text-sm
                    border border-[var(--color-neutral-200)] rounded-lg
                    focus:outline-none focus:ring-2
                    focus:ring-[var(--color-primary-600)] focus:ring-inset
                    focus:border-transparent
                    transition-all duration-150
                    [appearance:textfield]
                    [&::-webkit-outer-spin-button]:appearance-none
                    [&::-webkit-inner-spin-button]:appearance-none
                  "
                />
              </div>
            </div>

            {/* Active range summary */}
            {(filters.minRent || filters.maxRent) && (
              <p className="text-xs text-[var(--color-primary-600)] font-medium">
                {filters.minRent &&
                  !filters.maxRent &&
                  `From ${formatNaira(Number(filters.minRent))}`}
                {!filters.minRent &&
                  filters.maxRent &&
                  `Up to ${formatNaira(Number(filters.maxRent))}`}
                {filters.minRent &&
                  filters.maxRent &&
                  `${formatNaira(Number(filters.minRent))} – ${formatNaira(Number(filters.maxRent))}`}
              </p>
            )}
          </div>
        </FilterSection>

        {/* Extras */}
        <FilterSection title="Features">
          <div className="space-y-2.5">
            {[
              {
                key: "isFurnished" as const,
                label: "Furnished",
                description: "Furniture included",
              },
              {
                key: "isServiced" as const,
                label: "Serviced",
                description: "Utilities & maintenance",
              },
            ].map(({ key, label, description }) => (
              <label
                key={key}
                className="
                  flex items-start gap-3 cursor-pointer
                  p-2.5 rounded-lg
                  hover:bg-[var(--color-neutral-50)]
                  transition-colors duration-150
                  group
                "
              >
                {/* Custom checkbox */}
                <span
                  className={[
                    "flex-shrink-0 w-4.5 h-4.5 mt-0.5 rounded",
                    "border-2 transition-all duration-150",
                    "flex items-center justify-center",
                    filters[key] === true
                      ? "bg-[var(--color-primary-600)] border-[var(--color-primary-600)]"
                      : "border-[var(--color-neutral-300)] group-hover:border-[var(--color-primary-400)]",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {filters[key] === true && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2.5 2.5L7.5 2"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={filters[key] === true}
                  onChange={(e) =>
                    setFilter(key, e.target.checked ? true : null)
                  }
                  aria-label={label}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-neutral-700)]">
                    {label}
                  </p>
                  <p className="text-xs text-[var(--color-neutral-400)]">
                    {description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  );
}
