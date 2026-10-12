// The inquiry state machine: which party may take which action, from which status.
// Pure functions so the rules are unit-tested without a database.

import type { InquiryStatus } from "@prisma/client";

export type InquiryAction =
  | "message"
  | "scheduleInspection"
  | "confirmInspection"
  | "completeInspection"
  | "makeOffer"
  | "withdrawOffer"
  | "acceptOffer"
  | "declineOffer"
  | "close";

export type Party = "TENANT" | "LANDLORD";

const CLOSED: InquiryStatus[] = ["DECLINED", "EXPIRED"];
const PRE_OFFER: InquiryStatus[] = ["OPEN", "RESPONDED", "INSPECTION_SCHEDULED", "INSPECTION_COMPLETED"];

interface Rule {
  parties: Party[];
  from: InquiryStatus[];
}

const RULES: Record<InquiryAction, Rule> = {
  message: { parties: ["TENANT", "LANDLORD"], from: [...PRE_OFFER, "OFFER_MADE", "ACCEPTED"] },
  scheduleInspection: { parties: ["TENANT", "LANDLORD"], from: PRE_OFFER },
  confirmInspection: { parties: ["TENANT", "LANDLORD"], from: ["INSPECTION_SCHEDULED"] },
  completeInspection: { parties: ["LANDLORD"], from: ["INSPECTION_SCHEDULED"] },
  makeOffer: { parties: ["LANDLORD"], from: PRE_OFFER },
  withdrawOffer: { parties: ["LANDLORD"], from: ["OFFER_MADE"] },
  acceptOffer: { parties: ["TENANT"], from: ["OFFER_MADE"] },
  declineOffer: { parties: ["TENANT"], from: ["OFFER_MADE"] },
  // Either side can end the conversation until money has moved.
  close: { parties: ["TENANT", "LANDLORD"], from: [...PRE_OFFER, "OFFER_MADE", "ACCEPTED"] },
};

const ACTION_NAMES: Record<InquiryAction, string> = {
  message: "send a message",
  scheduleInspection: "book an inspection",
  confirmInspection: "confirm the inspection",
  completeInspection: "mark the inspection as done",
  makeOffer: "make an offer",
  withdrawOffer: "withdraw the offer",
  acceptOffer: "accept the offer",
  declineOffer: "decline the offer",
  close: "close this conversation",
};

export type RuleCheck = { allowed: true } | { allowed: false; reason: string };

export function canPerform(action: InquiryAction, party: Party, status: InquiryStatus): RuleCheck {
  const rule = RULES[action];
  if (!rule.parties.includes(party)) {
    return { allowed: false, reason: `Only the ${rule.parties[0] === "LANDLORD" ? "landlord" : "tenant"} can ${ACTION_NAMES[action]}.` };
  }
  if (CLOSED.includes(status)) return { allowed: false, reason: "This conversation is closed." };
  if (!rule.from.includes(status)) return { allowed: false, reason: `You can't ${ACTION_NAMES[action]} at this stage.` };
  return { allowed: true };
}

/** Status to return to when an offer is withdrawn or lapses. */
export function statusAfterOfferEnds(inspectionCompleted: boolean): InquiryStatus {
  return inspectionCompleted ? "INSPECTION_COMPLETED" : "RESPONDED";
}

/** The status a landlord's first reply moves an inquiry to. */
export function statusAfterMessage(current: InquiryStatus, sender: Party): InquiryStatus {
  return current === "OPEN" && sender === "LANDLORD" ? "RESPONDED" : current;
}
