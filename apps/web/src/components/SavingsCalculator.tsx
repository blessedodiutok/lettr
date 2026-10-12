// File: apps/web/src/components/SavingsCalculator.tsx
"use client";

import { useState } from "react";
import {
  calculateAgentSaving,
  calculatePlatformFee,
  formatNaira,
} from "../lib/utils";

export function SavingsCalculator() {
  const [rent, setRent] = useState(1500000);

  const agentFee = calculateAgentSaving(rent);
  const platformFee = calculatePlatformFee(rent);
  const saving = agentFee - platformFee;

  return (
    <div className="bg-[var(--color-neutral-50)] rounded-2xl p-8 border border-[var(--color-neutral-200)]">
      <label
        htmlFor="rent-slider"
        className="block text-sm font-semibold text-[var(--color-neutral-700)] mb-2"
      >
        Annual rent
      </label>
      <div
        className="text-4xl font-bold text-[var(--color-primary-600)] mb-4"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {formatNaira(rent)}
      </div>
      <input
        id="rent-slider"
        type="range"
        min={400000}
        max={20000000}
        step={100000}
        value={rent}
        onChange={(e) => setRent(Number(e.target.value))}
        className="w-full h-2 accent-[var(--color-primary-600)] mb-8"
      />

      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-3 border-b border-[var(--color-neutral-200)]">
          <span className="text-[var(--color-neutral-600)]">
            Traditional agent fee (15%)
          </span>
          <span className="font-semibold line-through text-[var(--color-neutral-400)]">
            {formatNaira(agentFee)}
          </span>
        </div>
        <div className="flex justify-between py-3 border-b border-[var(--color-neutral-200)]">
          <span className="text-[var(--color-neutral-600)]">
            Lettr platform fee (3%)
          </span>
          <span className="font-semibold text-[var(--color-neutral-800)]">
            {formatNaira(platformFee)}
          </span>
        </div>
        <div className="flex justify-between py-3 bg-[var(--color-success-50)] px-4 rounded-xl">
          <span className="font-bold text-[var(--color-success-700)]">
            You save
          </span>
          <span
            className="font-bold text-2xl text-[var(--color-success-600)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatNaira(saving)}
          </span>
        </div>
      </div>
    </div>
  );
}
