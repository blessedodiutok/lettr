// File: apps/web/src/components/HeroSearch.tsx
"use client";

import { Home, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NIGERIAN_STATES = [
  "Lagos",
  "Abuja (FCT)",
  "Rivers",
  "Kano",
  "Oyo",
  "Delta",
  "Anambra",
  "Enugu",
  "Imo",
  "Kaduna",
  "Ogun",
  "Edo",
];

const PROPERTY_TYPES = [
  { value: "SELF_CONTAINED", label: "Self Contained" },
  { value: "MINI_FLAT", label: "Mini Flat" },
  { value: "ONE_BEDROOM", label: "1 Bedroom" },
  { value: "TWO_BEDROOM", label: "2 Bedroom" },
  { value: "THREE_BEDROOM", label: "3 Bedroom" },
  { value: "DUPLEX", label: "Duplex" },
  { value: "BOYS_QUARTERS", label: "Boys' Quarters" },
] as const;

/* Styled select wrapper */
function SearchField({
  icon,
  label,
  value,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      {/* Icon */}
      <span
        aria-hidden="true"
        className="
          absolute left-3.5 top-1/2 -translate-y-1/2
          text-[var(--color-neutral-400)]
          pointer-events-none z-10
        "
      >
        {icon}
      </span>

      {/* Floating label */}
      <span
        className="
          absolute left-10 top-2 text-[10px] font-semibold
          text-[var(--color-neutral-400)] uppercase tracking-[0.08em]
          pointer-events-none z-10
          leading-none
        "
      >
        {label}
      </span>

      {/* Native select — styled to look custom */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="
          w-full h-[3.75rem] pt-5 pb-2 pl-10 pr-8
          bg-[var(--color-neutral-50)]
          text-[var(--color-neutral-800)] text-sm font-medium
          border border-[var(--color-neutral-200)]
          rounded-xl
          appearance-none
          focus:outline-none
          focus:ring-2 focus:ring-[var(--color-primary-600)]
          focus:ring-inset
          focus:border-transparent
          transition-all duration-150
          cursor-pointer
          hover:border-[var(--color-neutral-300)]
        "
      >
        {children}
      </select>

      {/* Custom chevron */}
      <span
        aria-hidden="true"
        className="
          absolute right-3 top-1/2 -translate-y-1/2
          pointer-events-none text-[var(--color-neutral-400)]
        "
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 5l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

export function HeroSearch() {
  const router = useRouter();
  const [state, setState] = useState("");
  const [propertyType, setPropertyType] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (propertyType) params.set("propertyType", propertyType);
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="
        bg-white rounded-2xl p-2
        flex flex-col sm:flex-row items-stretch gap-2
        shadow-[0_8px_40px_-8px_rgb(0,0,0,0.2)]
        max-w-2xl
        border border-white/60
      "
      role="search"
      aria-label="Search properties"
    >
      {/* State selector */}
      <SearchField
        icon={<MapPin size={15} />}
        label="Location"
        value={state}
        onChange={setState}
      >
        <option value="">All states</option>
        {NIGERIAN_STATES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </SearchField>

      {/* Divider — desktop only */}
      <div
        aria-hidden="true"
        className="hidden sm:block w-px bg-[var(--color-neutral-200)] self-stretch my-2"
      />

      {/* Property type selector */}
      <SearchField
        icon={<Home size={15} />}
        label="Property type"
        value={propertyType}
        onChange={setPropertyType}
      >
        <option value="">Any type</option>
        {PROPERTY_TYPES.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SearchField>

      {/* Submit */}
      <button
        type="submit"
        className="
          flex items-center justify-center gap-2
          h-[3.75rem] px-7 sm:px-6
          bg-[var(--color-primary-600)] text-white
          font-semibold text-sm
          rounded-xl
          hover:bg-[var(--color-primary-700)]
          active:bg-[var(--color-primary-800)]
          active:scale-[0.98]
          transition-all duration-150
          whitespace-nowrap
          shadow-md hover:shadow-lg
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-[var(--ring)]
          focus-visible:ring-offset-2
          focus-visible:ring-offset-white
          shrink-0
        "
      >
        <Search size={16} aria-hidden="true" />
        Search
      </button>
    </form>
  );
}
