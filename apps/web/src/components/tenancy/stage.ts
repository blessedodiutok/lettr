import type { StatusTone } from "@lettr/utils";
import type { Tenancy } from "../../lib/types";

/** Plain-language stage of a tenancy, for lists and headers. */
export function tenancyStage(t: Tenancy): { label: string; tone: StatusTone } {
  if (t.cancelledAt) return { label: "Cancelled", tone: "neutral" };
  if (t.isHandoverConfirmed) {
    return t.tenancyEndDate && new Date(t.tenancyEndDate) < new Date() ? { label: "Ended", tone: "neutral" } : { label: "Active", tone: "ok" };
  }
  if (!t.tenantSignedAt || !t.landlordSignedAt) return { label: "Awaiting signatures", tone: "warn" };
  if (!t.handoverMarkedAt) return { label: "Awaiting handover", tone: "info" };
  return { label: "Awaiting move-in confirmation", tone: "info" };
}
