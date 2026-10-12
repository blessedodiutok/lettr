// File: packages/utils/src/index.ts
// Shared utility functions used by the API, web, and mobile apps.

import axios, { type AxiosInstance } from "axios";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

// ─────────────────────────────────────────────
// CURRENCY
// ─────────────────────────────────────────────

/**
 * Format a number as Nigerian Naira.
 * 1500000 → "₦1,500,000"
 * Uses the standard Nigerian locale with no decimal places.
 */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate the traditional agent commission a tenant would have paid.
 * Nigerian norm: 10–15% of annual rent. Lettr uses 15% for the comparison.
 * 1_000_000 → 150_000
 */
export function calculateAgentCommission(annualRent: number): number {
  if (!isFinite(annualRent) || annualRent < 0) return 0;
  return annualRent * 0.15;
}

/**
 * Calculate the Lettr platform fee charged to the tenant.
 * 3% of annual rent.
 * 1_000_000 → 30_000
 */
export function calculatePlatformFee(annualRent: number): number {
  if (!isFinite(annualRent) || annualRent < 0) return 0;
  return annualRent * 0.03;
}

/**
 * Calculate how much a tenant saves by using Lettr vs a traditional agent.
 * saving = agentCommission - platformFee
 * 1_000_000 → 120_000
 */
export function calculateSavings(annualRent: number): number {
  if (!isFinite(annualRent) || annualRent < 0) return 0;
  return (
    calculateAgentCommission(annualRent) - calculatePlatformFee(annualRent)
  );
}

/**
 * Calculate the total upfront cost a tenant pays on Lettr.
 * total = annualRent + cautionFee + platformFee
 */
export function calculateTotalPayment(
  annualRent: number,
  cautionFee: number,
): number {
  return annualRent + cautionFee + calculatePlatformFee(annualRent);
}

// ─────────────────────────────────────────────
// DATES
// ─────────────────────────────────────────────

/**
 * Format a date in Nigerian style: "12 June 2024"
 * Accepts a Date object, ISO string, or timestamp.
 */
export function formatDate(date: Date | string | number): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    if (!isValid(d)) return "Invalid date";
    return format(d, "d MMMM yyyy");
  } catch {
    return "Invalid date";
  }
}

/**
 * Format a date with time: "12 June 2024 at 2:30 PM"
 */
export function formatDateTime(date: Date | string | number): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    if (!isValid(d)) return "Invalid date";
    return format(d, "d MMMM yyyy 'at' h:mm a");
  } catch {
    return "Invalid date";
  }
}

/**
 * Format a date as relative time: "3 days ago", "in 2 months"
 */
export function formatRelativeDate(date: Date | string | number): string {
  try {
    const d = typeof date === "string" ? parseISO(date) : new Date(date);
    if (!isValid(d)) return "Unknown";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

/**
 * Format a tenancy period: "June 2024 – June 2025"
 */
export function formatTenancyPeriod(
  startDate: Date | string,
  endDate: Date | string,
): string {
  try {
    const start =
      typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;
    if (!isValid(start) || !isValid(end)) return "Invalid period";
    return `${format(start, "MMMM yyyy")} – ${format(end, "MMMM yyyy")}`;
  } catch {
    return "Invalid period";
  }
}

// ─────────────────────────────────────────────
// PROPERTY HELPERS
// ─────────────────────────────────────────────

/**
 * Convert a PropertyType enum value to a human-readable label.
 * "TWO_BEDROOM" → "2 Bedroom"
 */
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

/**
 * Build a human-readable location string from parts.
 * ("Lekki Phase 1", "Eti-Osa", "Lagos") → "Lekki Phase 1, Eti-Osa · Lagos"
 */
export function formatLocation(
  neighbourhood: string,
  lga: string,
  state: string,
): string {
  return `${neighbourhood}, ${lga} · ${state}`;
}

/**
 * Return the cover photo URL for a property's photo array.
 * Falls back to the first photo if no cover is marked.
 */
export function getCoverPhotoUrl(
  photos: Array<{ url: string; isCover: boolean }>,
): string | null {
  if (!photos.length) return null;
  return (photos.find((p) => p.isCover) ?? photos[0]).url;
}

// ─────────────────────────────────────────────
// STRING HELPERS
// ─────────────────────────────────────────────

/**
 * Truncate a string to a maximum length and append an ellipsis.
 * truncate("Hello world", 8) → "Hello wo…"
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Convert a SCREAMING_SNAKE_CASE enum value to Title Case.
 * "BOYS_QUARTERS" → "Boys Quarters"
 */
export function enumToLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Generate initials from a first and last name.
 * ("Emeka", "Okonkwo") → "EO"
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Pluralise a word based on count.
 * pluralise(1, "bedroom", "bedrooms") → "1 bedroom"
 * pluralise(3, "bedroom", "bedrooms") → "3 bedrooms"
 */
export function pluralise(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// ─────────────────────────────────────────────
// AXIOS FACTORY
// ─────────────────────────────────────────────

/**
 * Create a configured Axios instance for a given base URL.
 * Used by apps that don't need the full interceptor setup —
 * e.g. server-side API calls or simple fetch helpers.
 *
 * For the full client with JWT refresh interceptors, use
 * the axios.ts file inside each app.
 */
export function createAxiosInstance(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
  });
}

// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────

/**
 * Check whether a string is a valid Nigerian phone number.
 * Accepts +234 and 0 prefixes.
 */
export function isValidNigerianPhone(phone: string): boolean {
  return /^(\+234|0)(7|8|9)(0|1)\d{8}$/.test(phone);
}

/**
 * Check whether a value is a valid positive Naira amount.
 */
export function isValidNairaAmount(amount: unknown): boolean {
  return typeof amount === "number" && isFinite(amount) && amount > 0;
}

// ─────────────────────────────────────────────
// PAYMENT HELPERS
// ─────────────────────────────────────────────

/**
 * Format a Paystack amount (in kobo) back to Naira.
 * Paystack stores and sends amounts in kobo (1/100 of a naira).
 * 150000 kobo → 1500 naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Convert a Naira amount to kobo for Paystack API calls.
 * 1500 naira → 150000 kobo
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Generate a Lettr receipt number from a sequential count.
 * generateReceiptNumber(42) → "LTR-2024-000042"
 */
export function generateReceiptNumber(count: number): string {
  const year = new Date().getFullYear();
  return `LTR-${year}-${String(count).padStart(6, "0")}`;
}
