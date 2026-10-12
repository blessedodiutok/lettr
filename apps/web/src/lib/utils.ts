// File: apps/web/src/lib/utils.ts
// Utility functions used across the web frontend

/**
 * cn() — merge Tailwind class names safely
 * Filters out falsy values so conditional classes work cleanly:
 *   cn('base-class', isActive && 'active-class', undefined)
 *   → 'base-class active-class'
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a number as Nigerian Naira: 1500000 → ₦1,500,000 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Calculate the agent fee a tenant saves by using Lettr (15% of annual rent) */
export function calculateAgentSaving(annualRent: number): number {
  return annualRent * 0.15;
}

/** Calculate Lettr's platform fee (3% of annual rent) */
export function calculatePlatformFee(annualRent: number): number {
  return annualRent * 0.03;
}

/** Format a date in Nigerian style: 12 June 2024 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Truncate a string to a given length and add ellipsis */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + "…";
}

/** Convert a PropertyType enum value to a human-readable label */
export function formatPropertyType(type: string): string {
  const labels: Record<string, string> = {
    SELF_CONTAINED: "Self Contained",
    MINI_FLAT: "Mini Flat",
    ONE_BEDROOM: "1 Bedroom",
    TWO_BEDROOM: "2 Bedroom",
    THREE_BEDROOM: "3 Bedroom",
    FOUR_BEDROOM: "4 Bedroom",
    DUPLEX: "Duplex",
    BUNGALOW: "Bungalow",
    BOYS_QUARTERS: "Boys' Quarters",
    MANSION: "Mansion",
    PENTHOUSE: "Penthouse",
    STUDIO: "Studio",
    TERRACE: "Terrace",
    SEMI_DETACHED: "Semi-Detached",
    DETACHED: "Detached House",
  };
  return labels[type] ?? type;
}

/** Return a short status label and colour class for a listing status */
export function getStatusMeta(status: string): {
  label: string;
  className: string;
} {
  const map: Record<string, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
    ACTIVE: { label: "Available", className: "bg-green-100 text-green-700" },
    UNDER_OFFER: {
      label: "Under Offer",
      className: "bg-yellow-100 text-yellow-700",
    },
    TAKEN: { label: "Taken", className: "bg-red-100 text-red-700" },
    SUSPENDED: {
      label: "Suspended",
      className: "bg-orange-100 text-orange-700",
    },
    ARCHIVED: {
      label: "Archived",
      className: "bg-neutral-100 text-neutral-500",
    },
  };
  return (
    map[status] ?? {
      label: status,
      className: "bg-neutral-100 text-neutral-600",
    }
  );
}
