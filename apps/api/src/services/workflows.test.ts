// Service-level rules checked against a mocked database.
import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  tenancyAgreement: { findFirst: vi.fn(), findUnique: vi.fn() },
  review: { findFirst: vi.fn() },
  inquiry: { findUnique: vi.fn() },
  payment: { findUnique: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn() },
  listing: { findUnique: vi.fn() },
  user: { findMany: vi.fn(), findUnique: vi.fn() },
};

vi.mock("../lib/prisma.js", () => ({ prisma }));
vi.mock("../config/env.js", () => ({
  env: { NODE_ENV: "test", WEB_URL: "http://localhost:3000", PAYSTACK_TRANSFER_ENABLED: false, OTP_EXPIRY_SECONDS: 600 },
  isProduction: false,
  isPaystackSimulated: true,
}));
vi.mock("./notify.js", () => ({ notify: vi.fn(), notifyLater: vi.fn() }));
vi.mock("../repositories/inquiries.repository.js", () => ({ findInquiryById: vi.fn(), INQUIRY_DETAIL: {} }));

describe("workflow boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.findMany.mockResolvedValue([]);
  });

  it("rejects reviews without a started tenancy", async () => {
    prisma.tenancyAgreement.findFirst.mockResolvedValue(null);
    const { createReview } = await import("./reviews.service.js");
    await expect(
      createReview({ revieweeId: "landlord-1", rating: 5, title: "Great landlord", body: "The tenancy experience was excellent." }, "tenant-1"),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects messages from someone outside the conversation", async () => {
    const repo = await import("../repositories/inquiries.repository.js");
    vi.mocked(repo.findInquiryById).mockResolvedValue({ id: "inq-1", tenantId: "tenant-1", landlordId: "landlord-1", status: "OPEN" } as never);
    const { sendMessage } = await import("./inquiries.service.js");
    await expect(sendMessage("inq-1", "Hello", "outsider")).rejects.toMatchObject({ statusCode: 403 });
  });

  it("does not let a tenant accept an offer the landlord never made", async () => {
    const repo = await import("../repositories/inquiries.repository.js");
    vi.mocked(repo.findInquiryById).mockResolvedValue({ id: "inq-1", tenantId: "tenant-1", landlordId: "landlord-1", status: "RESPONDED" } as never);
    const { acceptOffer } = await import("./inquiries.service.js");
    await expect(acceptOffer("inq-1", "tenant-1")).rejects.toMatchObject({ statusCode: 409, code: "ACTION_NOT_ALLOWED" });
  });

  it("requires an accepted offer before payment", async () => {
    prisma.inquiry.findUnique.mockResolvedValue({ status: "OFFER_MADE" });
    const { initiatePayment } = await import("./payments.service.js");
    await expect(initiatePayment({ listingId: "listing-1" }, "tenant-1")).rejects.toMatchObject({ code: "OFFER_REQUIRED" });
  });

  it("does not release escrow before both signatures", async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: "pay-1",
      status: "IN_ESCROW",
      disputes: [],
      tenancyAgreement: { tenantSignedAt: new Date(), landlordSignedAt: null, cancelledAt: null },
      listing: { landlord: { landlordProfile: {} } },
    });
    const { releaseEscrow } = await import("./payments.service.js");
    await expect(releaseEscrow("pay-1", "AUTO")).rejects.toMatchObject({ statusCode: 409 });
  });

  it("pauses release while a dispute is open", async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: "pay-1",
      status: "IN_ESCROW",
      disputes: [{ id: "d-1", status: "OPEN" }],
      tenancyAgreement: { tenantSignedAt: new Date(), landlordSignedAt: new Date(), cancelledAt: null },
      listing: { landlord: { landlordProfile: {} } },
    });
    const { releaseEscrow } = await import("./payments.service.js");
    await expect(releaseEscrow("pay-1", "AUTO")).rejects.toMatchObject({ code: "DISPUTE_OPEN" });
  });

  it("refunds a charge that arrives after the home stopped being held", async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: "pay-1",
      tenantId: "tenant-1",
      totalAmount: 1000,
      currency: "NGN",
      paystackReference: "pay-1",
      inquiry: { status: "EXPIRED", tenantId: "tenant-1" },
      tenant: {},
      listing: { id: "listing-1", status: "ACTIVE", property: {}, landlord: {} },
    });
    prisma.payment.findUniqueOrThrow.mockResolvedValue({ id: "pay-1", tenantId: "tenant-1", paystackReference: "pay-1" });
    prisma.payment.updateMany.mockResolvedValue({ count: 1 });
    const { processCharge } = await import("./payments.service.js");
    await processCharge("pay-1", { status: "success", reference: "pay-1", amount: 100_000, currency: "NGN", raw: {} });
    expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "REFUNDED" }) }));
  });

  it("applies a charge only once when two callers race", async () => {
    prisma.payment.findUnique.mockResolvedValue({ id: "pay-1", inquiry: null, tenant: {}, listing: {} });
    prisma.payment.updateMany.mockResolvedValue({ count: 0 });
    const { processCharge } = await import("./payments.service.js");
    await processCharge("pay-1", { status: "success", reference: "pay-1", amount: 100_000, currency: "NGN", raw: {} });
    expect(prisma.payment.update).not.toHaveBeenCalled();
  });
});
