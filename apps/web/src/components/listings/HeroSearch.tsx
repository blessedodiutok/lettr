"use client";

import { PROPERTY_TYPE_LABELS } from "@lettr/types";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const BUDGETS = [
  { value: "", label: "Any budget" },
  { value: "1000000", label: "Up to ₦1m" },
  { value: "2500000", label: "Up to ₦2.5m" },
  { value: "5000000", label: "Up to ₦5m" },
  { value: "10000000", label: "Up to ₦10m" },
];

const TYPES = ["SELF_CONTAINED", "MINI_FLAT", "ONE_BEDROOM", "TWO_BEDROOM", "THREE_BEDROOM", "DUPLEX"] as const;

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxRent, setMaxRent] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (propertyType) params.set("propertyType", propertyType);
    if (maxRent) params.set("maxRent", maxRent);
    router.push(`/listings${params.size ? `?${params}` : ""}`);
  }

  const field = "flex flex-col rounded-[10px] bg-surface-2 px-3.5 py-2 focus-within:ring-2 focus-within:ring-navy/30";
  const label = "text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted";
  const input = "w-full bg-transparent text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-muted";

  return (
    <form onSubmit={submit} role="search" aria-label="Search homes" className="grid gap-1.5 rounded-[14px] bg-surface p-1.5 shadow-3 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
      <label className={field}>
        <span className={label}>Where</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Lekki, Yaba, Wuse 2…" className={input} />
      </label>
      <label className={field}>
        <span className={label}>Home type</span>
        <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={`${input} cursor-pointer appearance-none`}>
          <option value="">Any</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {PROPERTY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        <span className={label}>Budget per year</span>
        <select value={maxRent} onChange={(e) => setMaxRent(e.target.value)} className={`${input} cursor-pointer appearance-none`}>
          {BUDGETS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-brass px-6 text-[15px] font-semibold text-on-brass hover:bg-brass-hover sm:h-auto">
        <Search className="size-4" aria-hidden /> Search
      </button>
    </form>
  );
}
