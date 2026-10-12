// File: apps/mobile/lib/utils.ts

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateAgentSaving(annualRent: number): number {
  return annualRent * 0.15;
}

export function calculatePlatformFee(annualRent: number): number {
  return annualRent * 0.03;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

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
    DETACHED: "Detached",
  };
  return labels[type] ?? type;
}
