import { describe, expect, it } from "vitest";
import { generateAgreementText, tenancyPeriod } from "./agreement.js";

describe("tenancy agreement", () => {
  const params = {
    landlordName: "Emeka Okonkwo",
    tenantName: "Ngozi Adeyemi",
    propertyType: "TWO_BEDROOM",
    address: "12 Admiralty Way",
    neighbourhood: "Lekki Phase 1",
    lga: "Eti-Osa",
    state: "Lagos",
    annualRent: 4_500_000,
    cautionFee: 450_000,
    serviceCharge: 0,
    startDate: new Date("2026-11-01T00:00:00Z"),
    endDate: new Date("2027-10-31T00:00:00Z"),
    leaseMonths: 12,
    petsAllowed: false,
    smokingAllowed: false,
  };

  it("names both parties, the property and the rent", () => {
    const text = generateAgreementText(params);
    expect(text).toContain("LANDLORD: Emeka Okonkwo");
    expect(text).toContain("TENANT: Ngozi Adeyemi");
    expect(text).toContain("2-bedroom flat at 12 Admiralty Way");
    expect(text).toMatch(/4,500,000/);
  });

  it("leaves out the service charge clause when there is none", () => {
    expect(generateAgreementText(params)).not.toContain("SERVICE CHARGE");
    expect(generateAgreementText({ ...params, serviceCharge: 300_000 })).toContain("SERVICE CHARGE");
  });

  it("starts a tenancy on the available date, or today if that has passed", () => {
    const now = new Date("2026-10-12T10:00:00Z");
    expect(tenancyPeriod(new Date("2026-11-01T00:00:00Z"), 12, now).start.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(tenancyPeriod(new Date("2026-09-01T00:00:00Z"), 12, now).start).toEqual(now);
  });
});
