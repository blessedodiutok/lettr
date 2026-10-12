import {
  calculateLandlordPayout,
  calculateMoveInCost,
  formatCurrencyShort,
  generateReceiptNumber,
  getJourneySteps,
  optimizeImage,
} from "@lettr/utils";
import { describe, expect, it } from "vitest";

describe("move-in cost", () => {
  it("includes every fee and the 3% platform fee in the total", () => {
    const cost = calculateMoveInCost({ annualRent: 4_500_000, cautionFee: 450_000, serviceCharge: 300_000, legalFee: 0 });
    expect(cost.platformFee).toBe(135_000);
    expect(cost.total).toBe(5_385_000);
  });

  it("reports the saving net of the platform fee", () => {
    const cost = calculateMoveInCost({ annualRent: 4_500_000, cautionFee: 0 });
    expect(cost.agentFeeAvoided).toBe(675_000);
    expect(cost.netSaving).toBe(540_000);
  });

  it("rounds to kobo", () => {
    expect(calculateMoveInCost({ annualRent: 1_000_001, cautionFee: 0 }).platformFee).toBe(30_000.03);
  });

  it("pays the landlord everything except the platform fee", () => {
    const cost = calculateMoveInCost({ annualRent: 1_200_000, cautionFee: 120_000, serviceCharge: 50_000 });
    expect(calculateLandlordPayout(cost)).toBe(1_370_000);
  });
});

describe("formatting", () => {
  it("shortens large amounts", () => {
    expect(formatCurrencyShort(4_500_000)).toBe("₦4.5m");
    expect(formatCurrencyShort(950_000)).toBe("₦950k");
  });

  it("builds sequential receipt numbers", () => {
    expect(generateReceiptNumber(42, 2026)).toBe("LTR-2026-000042");
  });

  it("requests resized images from Cloudinary and Unsplash only", () => {
    expect(optimizeImage("https://res.cloudinary.com/x/image/upload/v1/a.jpg", 640)).toContain("/upload/f_auto,q_auto,c_limit,w_640/");
    expect(optimizeImage("https://images.unsplash.com/photo-1?x=1", 400)).toBe("https://images.unsplash.com/photo-1?auto=format&fit=crop&q=70&w=400");
    expect(optimizeImage("/api/media/a.jpg", 400)).toBe("/api/media/a.jpg");
  });
});

describe("rental journey", () => {
  const states = (input: Parameters<typeof getJourneySteps>[0]) => getJourneySteps(input).map((step) => step.state);

  it("starts at the inspection step after an inquiry", () => {
    expect(states({ inquiry: { status: "OPEN", createdAt: new Date() } })).toEqual(["done", "current", "upcoming", "upcoming", "upcoming", "upcoming"]);
  });

  it("waits on payment once the offer is accepted", () => {
    expect(states({ inquiry: { status: "ACCEPTED", createdAt: new Date() } })[3]).toBe("current");
  });

  it("moves to signing once rent is in escrow", () => {
    const steps = states({ inquiry: { status: "ACCEPTED", createdAt: new Date() }, payment: { status: "IN_ESCROW" } });
    expect(steps.slice(3)).toEqual(["done", "current", "upcoming"]);
  });

  it("completes when handover is confirmed", () => {
    const steps = states({
      inquiry: { status: "ACCEPTED", createdAt: new Date() },
      payment: { status: "RELEASED" },
      tenancy: { tenantSignedAt: new Date(), landlordSignedAt: new Date(), isHandoverConfirmed: true },
    });
    expect(steps.every((state) => state === "done")).toBe(true);
  });
});
