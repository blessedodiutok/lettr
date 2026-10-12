import { describe, expect, it } from "vitest";
import { canPerform, statusAfterMessage, statusAfterOfferEnds } from "./inquiryRules.js";

describe("inquiry state machine", () => {
  it("lets only the landlord make an offer", () => {
    expect(canPerform("makeOffer", "LANDLORD", "INSPECTION_COMPLETED").allowed).toBe(true);
    expect(canPerform("makeOffer", "TENANT", "INSPECTION_COMPLETED")).toMatchObject({ allowed: false, reason: expect.stringContaining("landlord") });
  });

  it("lets only the tenant accept or decline an open offer", () => {
    expect(canPerform("acceptOffer", "TENANT", "OFFER_MADE").allowed).toBe(true);
    expect(canPerform("acceptOffer", "LANDLORD", "OFFER_MADE").allowed).toBe(false);
    expect(canPerform("declineOffer", "TENANT", "OFFER_MADE").allowed).toBe(true);
  });

  it("refuses to accept when no offer has been made", () => {
    expect(canPerform("acceptOffer", "TENANT", "RESPONDED")).toMatchObject({ allowed: false });
  });

  it("blocks every action on a closed conversation", () => {
    for (const status of ["DECLINED", "EXPIRED"] as const) {
      expect(canPerform("message", "TENANT", status)).toEqual({ allowed: false, reason: "This conversation is closed." });
      expect(canPerform("makeOffer", "LANDLORD", status).allowed).toBe(false);
    }
  });

  it("allows booking inspections before an offer but not after acceptance", () => {
    expect(canPerform("scheduleInspection", "TENANT", "OPEN").allowed).toBe(true);
    expect(canPerform("scheduleInspection", "LANDLORD", "ACCEPTED").allowed).toBe(false);
  });

  it("only lets the landlord mark an inspection complete", () => {
    expect(canPerform("completeInspection", "LANDLORD", "INSPECTION_SCHEDULED").allowed).toBe(true);
    expect(canPerform("completeInspection", "TENANT", "INSPECTION_SCHEDULED").allowed).toBe(false);
  });

  it("moves a new inquiry to RESPONDED when the landlord replies", () => {
    expect(statusAfterMessage("OPEN", "LANDLORD")).toBe("RESPONDED");
    expect(statusAfterMessage("OPEN", "TENANT")).toBe("OPEN");
    expect(statusAfterMessage("OFFER_MADE", "LANDLORD")).toBe("OFFER_MADE");
  });

  it("returns to the right status when an offer ends", () => {
    expect(statusAfterOfferEnds(true)).toBe("INSPECTION_COMPLETED");
    expect(statusAfterOfferEnds(false)).toBe("RESPONDED");
  });
});
