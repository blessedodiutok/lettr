import { beforeEach, describe, expect, it, vi } from "vitest";

const prisma = {
  tenancyAgreement: { findFirst: vi.fn() },
  inquiry: { findUnique: vi.fn() },
  payment: { findUnique: vi.fn() },
};

vi.mock("../lib/prisma.js", () => ({ prisma }));
vi.mock("../config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    WEB_URL: "http://localhost:3000",
    PAYSTACK_SECRET_KEY: undefined,
    PAYSTACK_WEBHOOK_SECRET: undefined,
    PAYSTACK_TRANSFER_ENABLED: false,
  },
}));
vi.mock("../repositories/inquiries.repository.js", () => ({
  findInquiryById: vi.fn(),
}));
vi.mock("../repositories/notifications.repository.js", () => ({
  createNotification: vi.fn(),
}));

describe("workflow authorization boundaries", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects reviews when the users have no completed tenancy", async () => {
    prisma.tenancyAgreement.findFirst.mockResolvedValue(null);
    const { createReview } = await import("./reviews.service.js");
    await expect(
      createReview(
        {
          listingId: "listing-1",
          revieweeId: "landlord-1",
          rating: 5,
          title: "Great landlord",
          body: "The completed tenancy experience was excellent.",
        },
        "tenant-1",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects messages from users outside an inquiry", async () => {
    const inquiriesRepo = await import("../repositories/inquiries.repository.js");
    vi.mocked(inquiriesRepo.findInquiryById).mockResolvedValue({
      id: "inquiry-1",
      tenantId: "tenant-1",
      landlordId: "landlord-1",
      status: "OPEN",
    } as never);
    const { sendMessage } = await import("./inquiries.service.js");
    await expect(sendMessage("inquiry-1", "Hello", "outsider-1")).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("does not release escrow before signatures and handover", async () => {
    prisma.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      status: "IN_ESCROW",
      listingId: "listing-1",
      tenantId: "tenant-1",
      listing: {
        landlordId: "landlord-1",
        landlord: { landlordProfile: {} },
      },
      tenancyAgreement: {
        tenantSignedAt: null,
        landlordSignedAt: null,
        isHandoverConfirmed: false,
      },
    });
    const { releaseEscrow } = await import("./payments.service.js");
    await expect(releaseEscrow("payment-1", "landlord-1", "LANDLORD")).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
