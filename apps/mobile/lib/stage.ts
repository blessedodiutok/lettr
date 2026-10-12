import type { Tenancy } from "./types";

/** Plain-language stage of a tenancy. */
export function tenancyStage(t: Tenancy) {
  if (t.cancelledAt) return { label: "Cancelled", tone: "neutral" as const };
  if (t.isHandoverConfirmed) return { label: "Active", tone: "ok" as const };
  if (!t.tenantSignedAt || !t.landlordSignedAt) return { label: "Awaiting signatures", tone: "warn" as const };
  if (!t.handoverMarkedAt) return { label: "Awaiting handover", tone: "info" as const };
  return { label: "Confirm move-in", tone: "info" as const };
}
