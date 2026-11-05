import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { moneyAsNumber } from "./jsonReplacer.js";

describe("moneyAsNumber", () => {
  const send = (body: unknown) => JSON.parse(JSON.stringify(body, moneyAsNumber));

  it("sends decimals as numbers, at any depth", () => {
    const decimal = new Prisma.Decimal("900000.50");
    expect(send({ rent: decimal, nested: { list: [decimal] } })).toEqual({ rent: 900000.5, nested: { list: [900000.5] } });
  });

  it("adds up correctly in a client", () => {
    const payments = send([{ saved: new Prisma.Decimal("675000.00") }, { saved: new Prisma.Decimal("450000.00") }]) as { saved: number }[];
    expect(payments.reduce((sum, payment) => sum + payment.saved, 0)).toBe(1125000);
  });

  it("leaves everything else alone", () => {
    const at = new Date("2026-11-05T00:00:00.000Z");
    expect(send({ id: "abc", count: 3, none: null, at })).toEqual({ id: "abc", count: 3, none: null, at: at.toISOString() });
  });
});
