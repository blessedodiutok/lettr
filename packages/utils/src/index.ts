// File: packages/utils/src/index.ts
// Shared rules and helpers used by the API, web and mobile apps.
// Kept as a single module so Metro, Next.js and Node all resolve it the same way.

import axios, { type AxiosInstance } from "axios";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

// ─────────────────────────────────────────────
// PRICING — the only place fees are calculated
// ─────────────────────────────────────────────

/** Lettr's fee, charged to the tenant on top of rent. */
export const PLATFORM_FEE_RATE = 0.03;
/** Typical Nigerian agent commission, used only to show what a tenant avoids. */
export const AGENT_FEE_RATE = 0.15;

/** Round to kobo precision. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export interface MoveInCostInput {
  annualRent: number;
  cautionFee: number;
  serviceCharge?: number;
  legalFee?: number;
}

export interface MoveInCost {
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  platformFee: number;
  /** Everything the tenant pays into escrow. */
  total: number;
  /** What a 15% agent would have charged. */
  agentFeeAvoided: number;
  /** Agent fee avoided minus Lettr's fee — the honest saving. */
  netSaving: number;
}

export function calculatePlatformFee(annualRent: number): number {
  if (!isFinite(annualRent) || annualRent < 0) return 0;
  return roundMoney(annualRent * PLATFORM_FEE_RATE);
}

export function calculateAgentCommission(annualRent: number): number {
  if (!isFinite(annualRent) || annualRent < 0) return 0;
  return roundMoney(annualRent * AGENT_FEE_RATE);
}

/** Net saving versus a traditional agent, after Lettr's fee. */
export function calculateSavings(annualRent: number): number {
  return roundMoney(calculateAgentCommission(annualRent) - calculatePlatformFee(annualRent));
}

export function calculateMoveInCost(input: MoveInCostInput): MoveInCost {
  const annualRent = roundMoney(input.annualRent);
  const cautionFee = roundMoney(input.cautionFee);
  const serviceCharge = roundMoney(input.serviceCharge ?? 0);
  const legalFee = roundMoney(input.legalFee ?? 0);
  const platformFee = calculatePlatformFee(annualRent);
  return {
    annualRent,
    cautionFee,
    serviceCharge,
    legalFee,
    platformFee,
    total: roundMoney(annualRent + cautionFee + serviceCharge + legalFee + platformFee),
    agentFeeAvoided: calculateAgentCommission(annualRent),
    netSaving: calculateSavings(annualRent),
  };
}

/** Amount paid out to the landlord when escrow is released. */
export function calculateLandlordPayout(cost: Pick<MoveInCost, "total" | "platformFee">): number {
  return roundMoney(cost.total - cost.platformFee);
}

// ─────────────────────────────────────────────
// WORKFLOW RULES — time limits agreed for the rental journey
// ─────────────────────────────────────────────

export const RENTAL_RULES = {
  /** An offer stays open this long before it lapses. */
  offerValidDays: 5,
  /** After accepting, the tenant has this long to pay (covers bank daily limits). */
  paymentWindowHours: 72,
  /** Escrow releases automatically this long after handover unless disputed. */
  autoReleaseDays: 7,
  /** The tenant may cancel for a full refund if the landlord hasn't signed by then. */
  landlordSignDays: 7,
  /** Inquiries with no activity for this long are closed. */
  staleInquiryDays: 30,
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);
export const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);

// ─────────────────────────────────────────────
// STATUS PRESENTATION — one mapping for every client
// ─────────────────────────────────────────────

export type StatusTone = "ok" | "warn" | "bad" | "info" | "neutral";
export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const LISTING_STATUS: Record<string, StatusMeta> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "ok" },
  UNDER_OFFER: { label: "Under offer", tone: "warn" },
  TAKEN: { label: "Let", tone: "info" },
  SUSPENDED: { label: "Suspended", tone: "bad" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

const INQUIRY_STATUS: Record<string, StatusMeta> = {
  OPEN: { label: "New", tone: "info" },
  RESPONDED: { label: "In conversation", tone: "neutral" },
  INSPECTION_SCHEDULED: { label: "Inspection booked", tone: "info" },
  INSPECTION_COMPLETED: { label: "Inspected", tone: "neutral" },
  OFFER_MADE: { label: "Offer made", tone: "warn" },
  ACCEPTED: { label: "Offer accepted", tone: "ok" },
  DECLINED: { label: "Closed", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

const PAYMENT_STATUS: Record<string, StatusMeta> = {
  PENDING: { label: "Awaiting payment", tone: "warn" },
  PROCESSING: { label: "Processing", tone: "info" },
  IN_ESCROW: { label: "In escrow", tone: "info" },
  RELEASED: { label: "Paid out", tone: "ok" },
  FAILED: { label: "Failed", tone: "bad" },
  REFUNDED: { label: "Refunded", tone: "neutral" },
  PARTIALLY_REFUNDED: { label: "Partly refunded", tone: "neutral" },
};

const VERIFICATION_STATUS: Record<string, StatusMeta> = {
  UNVERIFIED: { label: "Not verified", tone: "neutral" },
  PENDING_REVIEW: { label: "In review", tone: "warn" },
  VERIFIED: { label: "ID verified", tone: "ok" },
  REJECTED: { label: "Rejected", tone: "bad" },
};

const DISPUTE_STATUS: Record<string, StatusMeta> = {
  OPEN: { label: "Open", tone: "bad" },
  UNDER_REVIEW: { label: "Under review", tone: "warn" },
  RESOLVED: { label: "Resolved", tone: "ok" },
  REJECTED: { label: "Rejected", tone: "neutral" },
};

const STATUS_TABLES = {
  listing: LISTING_STATUS,
  inquiry: INQUIRY_STATUS,
  payment: PAYMENT_STATUS,
  verification: VERIFICATION_STATUS,
  dispute: DISPUTE_STATUS,
} as const;

export type StatusKind = keyof typeof STATUS_TABLES;

export function getStatusMeta(kind: StatusKind, status: string): StatusMeta {
  return STATUS_TABLES[kind][status] ?? { label: enumToLabel(status), tone: "neutral" };
}

// ─────────────────────────────────────────────
// RENTAL JOURNEY — the stepper both apps show
// ─────────────────────────────────────────────

export type JourneyStepKey = "inquiry" | "inspection" | "offer" | "payment" | "agreement" | "movein";
export type JourneyStepState = "done" | "current" | "upcoming";

export interface JourneyInput {
  inquiry: { status: string; createdAt: string | Date; inspectionBooking?: { scheduledAt: string | Date; isCompleted?: boolean } | null };
  payment?: { status: string } | null;
  tenancy?: {
    tenantSignedAt?: string | Date | null;
    landlordSignedAt?: string | Date | null;
    isHandoverConfirmed?: boolean;
    cancelledAt?: string | Date | null;
  } | null;
}

export interface JourneyStep {
  key: JourneyStepKey;
  label: string;
  state: JourneyStepState;
}

const JOURNEY_LABELS: Record<JourneyStepKey, string> = {
  inquiry: "Inquiry",
  inspection: "Inspection",
  offer: "Offer",
  payment: "Pay into escrow",
  agreement: "Sign agreement",
  movein: "Move in",
};

const INQUIRY_PROGRESS: Record<string, number> = {
  OPEN: 1,
  RESPONDED: 1,
  INSPECTION_SCHEDULED: 1,
  INSPECTION_COMPLETED: 2,
  OFFER_MADE: 2,
  ACCEPTED: 3,
};

/** Work out which journey steps are done, which one is current, and which are ahead. */
export function getJourneySteps({ inquiry, payment, tenancy }: JourneyInput): JourneyStep[] {
  let completed = INQUIRY_PROGRESS[inquiry.status] ?? 1;
  if (inquiry.inspectionBooking?.isCompleted) completed = Math.max(completed, 2);
  const paid = payment && ["IN_ESCROW", "RELEASED"].includes(payment.status);
  if (paid) completed = 4;
  if (paid && tenancy?.tenantSignedAt && tenancy?.landlordSignedAt) completed = 5;
  if (tenancy?.isHandoverConfirmed) completed = 6;

  const keys: JourneyStepKey[] = ["inquiry", "inspection", "offer", "payment", "agreement", "movein"];
  return keys.map((key, index) => ({
    key,
    label: JOURNEY_LABELS[key],
    state: index < completed ? "done" : index === completed ? "current" : "upcoming",
  }));
}

// ─────────────────────────────────────────────
// CURRENCY
// ─────────────────────────────────────────────

/** 1500000 → "₦1,500,000" */
export function formatCurrency(amount: number): string {
  if (!isFinite(amount) || isNaN(amount)) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 4500000 → "₦4.5m", 950000 → "₦950k" — for tight spaces like map pins and phone cards. */
export function formatCurrencyShort(amount: number): string {
  if (!isFinite(amount)) return "₦0";
  if (amount >= 1_000_000) return `₦${trimNumber(amount / 1_000_000)}m`;
  if (amount >= 1_000) return `₦${trimNumber(amount / 1_000)}k`;
  return formatCurrency(amount);
}

function trimNumber(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

/** Kept for backwards compatibility — prefer calculateMoveInCost(). */
export function calculateTotalPayment(annualRent: number, cautionFee: number): number {
  return calculateMoveInCost({ annualRent, cautionFee }).total;
}

// ─────────────────────────────────────────────
// DATES
// ─────────────────────────────────────────────

function toDate(date: Date | string | number): Date {
  return typeof date === "string" ? parseISO(date) : new Date(date);
}

/** "12 June 2024" */
export function formatDate(date: Date | string | number): string {
  const d = toDate(date);
  return isValid(d) ? format(d, "d MMMM yyyy") : "Invalid date";
}

/** "12 Jun 2024" */
export function formatDateShort(date: Date | string | number): string {
  const d = toDate(date);
  return isValid(d) ? format(d, "d MMM yyyy") : "Invalid date";
}

/** "12 June 2024 at 2:30 PM" */
export function formatDateTime(date: Date | string | number): string {
  const d = toDate(date);
  return isValid(d) ? format(d, "d MMMM yyyy 'at' h:mm a") : "Invalid date";
}

/** "Sat 11 Oct, 11:00 AM" */
export function formatAppointment(date: Date | string | number): string {
  const d = toDate(date);
  return isValid(d) ? format(d, "EEE d MMM, h:mm a") : "Invalid date";
}

/** "3 days ago", "in 2 months" */
export function formatRelativeDate(date: Date | string | number): string {
  const d = toDate(date);
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "Unknown";
}

/** "June 2024 – June 2025" */
export function formatTenancyPeriod(startDate: Date | string, endDate: Date | string): string {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!isValid(start) || !isValid(end)) return "Invalid period";
  return `${format(start, "MMMM yyyy")} – ${format(end, "MMMM yyyy")}`;
}

// ─────────────────────────────────────────────
// PROPERTY HELPERS
// ─────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  SELF_CONTAINED: "Self-contained",
  MINI_FLAT: "Mini flat",
  ONE_BEDROOM: "1-bedroom flat",
  TWO_BEDROOM: "2-bedroom flat",
  THREE_BEDROOM: "3-bedroom flat",
  FOUR_BEDROOM: "4-bedroom flat",
  DUPLEX: "Duplex",
  BUNGALOW: "Bungalow",
  BOYS_QUARTERS: "Boys' quarters",
  MANSION: "Mansion",
  PENTHOUSE: "Penthouse",
  STUDIO: "Studio",
  TERRACE: "Terrace",
  SEMI_DETACHED: "Semi-detached house",
  DETACHED: "Detached house",
};

/** "TWO_BEDROOM" → "2-bedroom flat" */
export function formatPropertyType(type: string): string {
  return PROPERTY_TYPE_LABELS[type] ?? enumToLabel(type);
}

/** ("Lekki Phase 1", "Eti-Osa", "Lagos") → "Lekki Phase 1, Eti-Osa · Lagos" */
export function formatLocation(neighbourhood: string, lga: string, state: string): string {
  return `${neighbourhood}, ${lga} · ${state}`;
}

export function getCoverPhotoUrl(photos: Array<{ url: string; isCover: boolean }>): string | null {
  if (!photos.length) return null;
  return (photos.find((p) => p.isCover) ?? photos[0]).url;
}

/**
 * Request a resized, auto-format, auto-quality variant of a photo so phones on
 * mobile data download only what they display. Cloudinary and Unsplash URLs
 * are rewritten; anything else is returned unchanged.
 */
export function optimizeImage(url: string, width: number): string {
  const w = Math.round(width);
  const marker = "/image/upload/";
  if (url.includes("res.cloudinary.com") && url.includes(marker)) {
    return url.replace(marker, `${marker}f_auto,q_auto,c_limit,w_${w}/`);
  }
  if (url.startsWith("https://images.unsplash.com/")) {
    const base = url.split("?")[0];
    return `${base}?auto=format&fit=crop&q=70&w=${w}`;
  }
  return url;
}

/** @deprecated Use optimizeImage(). */
export const cloudinaryImage = optimizeImage;

// ─────────────────────────────────────────────
// STRING HELPERS
// ─────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/** "BOYS_QUARTERS" → "Boys quarters" */
export function enumToLabel(value: string): string {
  const words = value.toLowerCase().split("_");
  return words.map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)).join(" ");
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function pluralise(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

// ─────────────────────────────────────────────
// AXIOS FACTORY
// ─────────────────────────────────────────────

export function createAxiosInstance(baseURL: string): AxiosInstance {
  return axios.create({ baseURL, headers: { "Content-Type": "application/json" }, timeout: 15000 });
}

/** Pull the API's error message out of an axios error, with a readable fallback. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const data = (error as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } })?.response?.data;
  if (data?.details?.length) return data.details[0].message;
  if (data?.error) return data.error;
  if ((error as { code?: string })?.code === "ERR_NETWORK") return "You appear to be offline. Check your connection and try again.";
  return fallback;
}

// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────

export function isValidNigerianPhone(phone: string): boolean {
  return /^(\+234|0)(7|8|9)(0|1)\d{8}$/.test(phone);
}

export function isValidNairaAmount(amount: unknown): boolean {
  return typeof amount === "number" && isFinite(amount) && amount > 0;
}

// ─────────────────────────────────────────────
// PAYMENT HELPERS
// ─────────────────────────────────────────────

export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/** generateReceiptNumber(42, 2026) → "LTR-2026-000042" */
export function generateReceiptNumber(sequence: number, year = new Date().getFullYear()): string {
  return `LTR-${year}-${String(sequence).padStart(6, "0")}`;
}
