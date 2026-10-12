// Payments and escrow.
//  - A tenant can pay only for a home they hold through an accepted offer.
//  - Webhook and manual verification share one locked processor, so a charge
//    is applied exactly once; charges that can't be honoured are refunded.
//  - Escrow is released by the tenant's move-in confirmation, automatically
//    after handover, or by an admin. Open disputes pause any release.

import {
  calculateLandlordPayout,
  calculateMoveInCost,
  formatAppointment,
  formatCurrency,
  generateReceiptNumber,
  nairaToKobo,
} from "@lettr/utils";
import type { Prisma, UserRole } from "@prisma/client";
import { env, isPaystackSimulated, isProduction } from "../config/env.js";
import { generateAgreementText, tenancyPeriod } from "../domain/agreement.js";
import * as paystack from "../lib/paystack.js";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import { notify } from "./notify.js";

type Money = { toNumber(): number } | number;
const money = (value: Money) => (typeof value === "number" ? value : value.toNumber());
const OPEN_DISPUTE = { status: { in: ["OPEN", "UNDER_REVIEW"] as ("OPEN" | "UNDER_REVIEW")[] } };

async function notifyAdmins(title: string, body: string, link: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } });
  await Promise.all(admins.map((admin) => notify({ userId: admin.id, type: "SYSTEM", title, body, link, email: true })));
}

// ── Initiate ───────────────────────────────────────────────────────────────

export async function initiatePayment(input: { listingId: string }, tenantId: string) {
  const inquiry = await prisma.inquiry.findUnique({
    where: { listingId_tenantId: { listingId: input.listingId, tenantId } },
    include: { tenant: true, listing: { include: { property: true } } },
  });
  if (!inquiry || inquiry.status !== "ACCEPTED") {
    throw createError("You can pay once the landlord makes you an offer and you accept it.", 409, { code: "OFFER_REQUIRED" });
  }
  if (inquiry.paymentDueAt && inquiry.paymentDueAt < new Date()) {
    throw createError("The time to pay for this offer has passed. Ask the landlord for a new offer.", 409, { code: "PAYMENT_WINDOW_CLOSED" });
  }
  if (inquiry.listing.status !== "UNDER_OFFER") throw createError("This home is no longer held for you.", 409);

  const escrowed = await prisma.payment.findFirst({
    where: { listingId: input.listingId, status: { in: ["PROCESSING", "IN_ESCROW", "RELEASED"] } },
  });
  if (escrowed) throw createError("This home has already been paid for.", 409);

  const listing = inquiry.listing;
  const cost = calculateMoveInCost({
    annualRent: money(listing.annualRent),
    cautionFee: money(listing.cautionFee),
    serviceCharge: money(listing.serviceCharge),
    legalFee: money(listing.legalFee),
  });

  // Reuse an unpaid checkout for this offer instead of opening a second one.
  const pending = await prisma.payment.findFirst({
    where: { inquiryId: inquiry.id, status: "PENDING", totalAmount: cost.total },
    orderBy: { createdAt: "desc" },
  });

  const payment =
    pending ??
    (await prisma.payment.create({
      data: {
        listingId: listing.id,
        tenantId,
        inquiryId: inquiry.id,
        annualRent: cost.annualRent,
        cautionFee: cost.cautionFee,
        serviceCharge: cost.serviceCharge,
        legalFee: cost.legalFee,
        platformFee: cost.platformFee,
        agentFeeSaved: cost.agentFeeAvoided,
        totalAmount: cost.total,
      },
    }));

  const callbackUrl = `${env.WEB_URL}/pay/${listing.id}/result?paymentId=${payment.id}`;
  try {
    const checkout =
      pending?.paystackAccessCode && !isPaystackSimulated
        ? { authorizationUrl: `https://checkout.paystack.com/${pending.paystackAccessCode}`, accessCode: pending.paystackAccessCode, reference: pending.paystackReference ?? payment.id }
        : await paystack.initializeTransaction({
            email: inquiry.tenant.email,
            amountKobo: nairaToKobo(cost.total),
            reference: payment.id,
            callbackUrl,
            metadata: { paymentId: payment.id, listingId: listing.id, tenantId, inquiryId: inquiry.id },
            simulateUrl: `${env.WEB_URL}/pay/${listing.id}/simulate?paymentId=${payment.id}`,
          });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { paystackReference: checkout.reference, paystackAccessCode: checkout.accessCode },
    });

    return {
      paymentId: payment.id,
      authorizationUrl: checkout.authorizationUrl,
      reference: checkout.reference,
      simulated: isPaystackSimulated,
      paymentDueAt: inquiry.paymentDueAt,
      breakdown: cost,
    };
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw error;
  }
}

// ── Process a confirmed charge (webhook, verify, simulation) ───────────────

interface Charge {
  status: string;
  reference: string;
  amount: number; // kobo
  currency: string;
  raw: Record<string, unknown>;
}

async function refundCapturedCharge(paymentId: string, amountNaira: number, reason: string) {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  if (payment.paystackReference) await paystack.refundTransaction(payment.paystackReference, nairaToKobo(amountNaira));
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED", refundedAt: new Date(), refundReason: reason, refundAmount: amountNaira },
  });
  await notify({
    userId: payment.tenantId,
    type: "PAYMENT_FAILED",
    title: "Your payment is being refunded",
    body: `${reason} ${formatCurrency(amountNaira)} is on its way back to you. Paystack refunds usually arrive within 5–10 working days.`,
    link: "/dashboard/payments",
    email: true,
  });
}

export async function processCharge(paymentId: string, charge: Charge): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { inquiry: true, tenant: true, listing: { include: { property: true, landlord: true } } },
  });
  if (!payment) return;

  if (charge.status !== "success") {
    await prisma.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: { status: "FAILED", paystackWebhookData: charge.raw as Prisma.InputJsonValue },
    });
    return;
  }

  // Claim the payment. Only one caller wins; FAILED is included because a
  // charge can succeed after the checkout lapsed, and must then be refunded.
  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "PROCESSING", paystackWebhookData: charge.raw as Prisma.InputJsonValue },
  });
  if (claimed.count === 0) return;

  const capturedNaira = charge.amount / 100;
  if (charge.reference !== payment.paystackReference || charge.currency !== payment.currency || charge.amount !== nairaToKobo(money(payment.totalAmount))) {
    await refundCapturedCharge(paymentId, capturedNaira, "The amount charged didn't match your offer.");
    await notifyAdmins("Payment mismatch refunded", `Payment ${paymentId} was charged ${formatCurrency(capturedNaira)} and refunded.`, `/admin/payments`);
    return;
  }

  const listing = payment.listing;
  const holdsHome =
    payment.inquiry?.status === "ACCEPTED" &&
    payment.inquiry.tenantId === payment.tenantId &&
    listing.status === "UNDER_OFFER" &&
    !(await prisma.payment.findFirst({ where: { listingId: listing.id, id: { not: paymentId }, status: { in: ["IN_ESCROW", "RELEASED"] } } }));
  if (!holdsHome) {
    await refundCapturedCharge(paymentId, capturedNaira, "The home was no longer held for you when the payment arrived.");
    return;
  }

  const { start, end } = tenancyPeriod(listing.availableFrom, listing.minimumLeaseTerm);
  const agreementText = generateAgreementText({
    landlordName: `${listing.landlord.firstName} ${listing.landlord.lastName}`,
    tenantName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
    propertyType: listing.property.propertyType,
    address: listing.property.address,
    neighbourhood: listing.property.neighbourhood,
    lga: listing.property.lga,
    state: listing.property.state,
    annualRent: money(payment.annualRent),
    cautionFee: money(payment.cautionFee),
    serviceCharge: money(payment.serviceCharge),
    startDate: start,
    endDate: end,
    leaseMonths: listing.minimumLeaseTerm,
    petsAllowed: listing.petsAllowed,
    smokingAllowed: listing.smokingAllowed,
  });

  const { tenancy, otherInquiries } = await prisma.$transaction(async (tx) => {
    const fresh = {
      agreementText,
      tenancyStartDate: start,
      tenancyEndDate: end,
      tenantSignedAt: null,
      landlordSignedAt: null,
      handoverMarkedAt: null,
      moveInConfirmedAt: null,
      autoReleaseAt: null,
      isHandoverConfirmed: false,
      handoverConfirmedAt: null,
      releaseMethod: null,
      cancelledAt: null,
      cancellationReason: null,
    };
    const tenancy = await tx.tenancyAgreement.upsert({
      where: { listingId_tenantId: { listingId: listing.id, tenantId: payment.tenantId } },
      create: { listingId: listing.id, tenantId: payment.tenantId, landlordId: listing.landlordId, ...fresh },
      update: fresh,
    });
    await tx.payment.update({ where: { id: paymentId }, data: { status: "IN_ESCROW", tenancyAgreementId: tenancy.id } });

    const [{ nextval }] = await tx.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('receipt_number_seq')`;
    await tx.receipt.upsert({
      where: { paymentId },
      create: { paymentId, receiptNumber: generateReceiptNumber(Number(nextval)) },
      update: {},
    });

    // Everyone else talking to the landlord about this home is told it's taken.
    const otherInquiries = await tx.inquiry.findMany({
      where: { listingId: listing.id, id: { not: payment.inquiryId! }, status: { notIn: ["DECLINED", "EXPIRED"] } },
      select: { id: true, tenantId: true },
    });
    if (otherInquiries.length) {
      await tx.inquiry.updateMany({
        where: { id: { in: otherInquiries.map((i) => i.id) } },
        data: { status: "DECLINED", closedAt: new Date(), closedReason: "Let to another tenant" },
      });
    }
    return { tenancy, otherInquiries };
  });

  const total = formatCurrency(money(payment.totalAmount));
  await Promise.all([
    notify({
      userId: payment.tenantId,
      type: "FUNDS_IN_ESCROW",
      title: "Payment received — now sign your agreement",
      body: `${total} for ${listing.property.title} is held in escrow. The landlord is paid only after you confirm you have the keys.`,
      link: `/tenancies/${tenancy.id}`,
      email: true,
      actionLabel: "Review and sign",
    }),
    notify({
      userId: listing.landlordId,
      type: "AGREEMENT_READY",
      title: `${payment.tenant.firstName} paid ${total} into escrow`,
      body: `Sign the tenancy agreement for ${listing.property.title}. You'll be paid after handover.`,
      link: `/tenancies/${tenancy.id}`,
      email: true,
      actionLabel: "Review and sign",
    }),
    ...otherInquiries.map((other) =>
      notify({
        userId: other.tenantId,
        type: "SYSTEM",
        title: `${listing.property.title} has been let`,
        body: "Another tenant secured this home. Your conversation has been closed — keep searching for your next place.",
        link: "/listings",
      }),
    ),
  ]);
}

// ── Webhook, verification and local simulation ─────────────────────────────

interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: { paymentId?: string };
    reason?: string;
  };
}

export async function handlePaystackWebhook(rawBody: Buffer, signature: string) {
  if (!paystack.verifyWebhookSignature(rawBody, signature)) throw createError("Invalid webhook signature", 401);
  const event = JSON.parse(rawBody.toString()) as PaystackEvent;

  if (event.event === "charge.success") {
    const paymentId = event.data.metadata?.paymentId ?? event.data.reference;
    await processCharge(paymentId, { ...event.data, raw: event.data as unknown as Record<string, unknown> });
    return;
  }

  if (event.event.startsWith("transfer.")) {
    const payment = await prisma.payment.findUnique({ where: { transferReference: event.data.reference } });
    if (!payment) return;
    if (event.event === "transfer.success") {
      await prisma.payment.update({ where: { id: payment.id }, data: { releaseError: null } });
    } else {
      // Failed or reversed: the money is back in Lettr's balance. Return the
      // payment to escrow so the scheduler retries, and alert an admin.
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "IN_ESCROW", escrowReleasedAt: null, releaseError: `Transfer ${event.event.split(".")[1]}: ${event.data.reason ?? "no reason given"}` },
      });
      await notifyAdmins("Landlord payout failed", `The payout for payment ${payment.id} failed and will be retried.`, "/admin/payments");
    }
  }
}

export async function verifyPayment(paymentId: string, userId: string, role: UserRole) {
  const payment = await getPayment(paymentId, userId, role);
  if (payment.status === "PENDING" && payment.paystackReference && !isPaystackSimulated) {
    const charge = await paystack.verifyTransaction(payment.paystackReference);
    if (charge.status === "success") await processCharge(paymentId, charge);
  }
  return getPayment(paymentId, userId, role);
}

/** Local development only: complete a checkout without Paystack. */
export async function simulateSuccess(paymentId: string, tenantId: string) {
  if (!isPaystackSimulated) throw createError("Not found", 404);
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.tenantId !== tenantId) throw createError("Payment not found", 404);
  await processCharge(paymentId, {
    status: "success",
    reference: payment.paystackReference ?? payment.id,
    amount: nairaToKobo(money(payment.totalAmount)),
    currency: payment.currency,
    raw: { simulated: true, at: new Date().toISOString() },
  });
  return getPayment(paymentId, tenantId, "TENANT");
}

// ── Release and refunds ────────────────────────────────────────────────────

export type ReleaseMethod = "TENANT_CONFIRMED" | "AUTO" | "ADMIN";

export async function releaseEscrow(paymentId: string, method: ReleaseMethod, options: { ignoreDisputeId?: string } = {}) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      tenancyAgreement: true,
      disputes: { where: OPEN_DISPUTE },
      tenant: true,
      listing: { include: { property: true, landlord: { include: { landlordProfile: true } } } },
    },
  });
  if (!payment) throw createError("Payment not found", 404);
  if (payment.status === "RELEASED") return payment;
  if (payment.status !== "IN_ESCROW") throw createError(`This payment can't be released while it is ${payment.status.toLowerCase()}.`, 409);

  const tenancy = payment.tenancyAgreement;
  if (!tenancy || tenancy.cancelledAt) throw createError("There's no active tenancy for this payment.", 409);
  if (!tenancy.tenantSignedAt || !tenancy.landlordSignedAt) throw createError("Both of you need to sign the agreement first.", 409);
  if (payment.disputes.some((dispute) => dispute.id !== options.ignoreDisputeId)) {
    throw createError("A dispute is open, so the payout is paused until it's resolved.", 409, { code: "DISPUTE_OPEN" });
  }

  const payout = calculateLandlordPayout({ total: money(payment.totalAmount), platformFee: money(payment.platformFee) });
  const profile = payment.listing.landlord.landlordProfile;
  let transferReference = `LTR-PAYOUT-${payment.id}`;
  let transferCode: string | null = null;
  let releaseError: string | null = null;

  if (env.PAYSTACK_TRANSFER_ENABLED) {
    if (!profile?.bankAccountNumber || !profile.bankCode || !profile.bankAccountName) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { releaseAttempts: { increment: 1 }, releaseError: "Landlord has not added a bank account" },
      });
      await notify({
        userId: payment.listing.landlordId,
        type: "SYSTEM",
        title: "Add your bank account to get paid",
        body: `${formatCurrency(payout)} for ${payment.listing.property.title} is ready to pay out.`,
        link: "/landlord/payouts",
        email: true,
      });
      throw createError("The landlord needs to add a bank account before the payout.", 409, { code: "NO_BANK_ACCOUNT" });
    }
    try {
      const transfer = await paystack.transferToBank({
        accountName: profile.bankAccountName,
        accountNumber: profile.bankAccountNumber,
        bankCode: profile.bankCode,
        amountKobo: nairaToKobo(payout),
        reference: transferReference,
        reason: `Lettr rent payout · ${payment.listing.property.title}`,
      });
      transferCode = transfer.transferCode;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transfer failed";
      await prisma.payment.update({ where: { id: paymentId }, data: { releaseAttempts: { increment: 1 }, releaseError: message } });
      throw createError("The payout couldn't be sent. We'll retry automatically.", 502, { code: "PAYOUT_FAILED" });
    }
  } else {
    transferReference = `MANUAL-${payment.id}`;
    if (isProduction) releaseError = "Automatic transfers are disabled — pay this landlord manually";
  }

  const now = new Date();
  const released = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "RELEASED", escrowReleasedAt: now, transferReference, paystackTransferCode: transferCode, releaseError },
    });
    await tx.tenancyAgreement.update({
      where: { id: tenancy.id },
      data: { isHandoverConfirmed: true, handoverConfirmedAt: now, releaseMethod: method },
    });
    await tx.listing.update({ where: { id: payment.listingId }, data: { status: "TAKEN", takenAt: now } });
    await tx.landlordProfile.updateMany({ where: { userId: payment.listing.landlordId }, data: { totalRentalsCompleted: { increment: 1 } } });
    if (payment.inquiryId) await tx.inquiry.update({ where: { id: payment.inquiryId }, data: { closedAt: now, closedReason: "Tenancy started" } });
    return updated;
  });

  await Promise.all([
    notify({
      userId: payment.listing.landlordId,
      type: "FUNDS_RELEASED",
      title: `${formatCurrency(payout)} is on its way to you`,
      body: `Escrow for ${payment.listing.property.title} has been released${method === "AUTO" ? " automatically after the handover period" : ""}.`,
      link: "/landlord/payouts",
      email: true,
    }),
    notify({
      userId: payment.tenantId,
      type: "HANDOVER_CONFIRMED",
      title: "Welcome home",
      body: `Your tenancy at ${payment.listing.property.title} has started. When you're settled, leave a review for your landlord.`,
      link: `/tenancies/${tenancy.id}`,
    }),
  ]);
  return released;
}

export async function refundPayment(paymentId: string, input: { amount?: number; reason: string; actorId?: string }) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { tenancyAgreement: true } });
  if (!payment?.paystackReference) throw createError("This payment can't be refunded.", 409);
  if (!["IN_ESCROW", "PROCESSING"].includes(payment.status)) {
    throw createError(`A ${payment.status.toLowerCase().replace("_", " ")} payment can't be refunded.`, 409);
  }
  const total = money(payment.totalAmount);
  const amount = input.amount ?? total;
  if (amount > total) throw createError("The refund can't be more than the amount paid.", 400);

  await paystack.refundTransaction(payment.paystackReference, nairaToKobo(amount));
  const now = new Date();
  const refunded = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: amount === total ? "REFUNDED" : "PARTIALLY_REFUNDED",
        refundedAt: now,
        refundAmount: amount,
        refundReason: input.actorId ? `${input.reason} (admin ${input.actorId})` : input.reason,
      },
    });
    if (payment.tenancyAgreement && !payment.tenancyAgreement.isHandoverConfirmed) {
      await tx.tenancyAgreement.update({
        where: { id: payment.tenancyAgreement.id },
        data: { cancelledAt: now, cancellationReason: input.reason },
      });
      await tx.listing.updateMany({ where: { id: payment.listingId, status: "UNDER_OFFER" }, data: { status: "ACTIVE" } });
      if (payment.inquiryId) {
        await tx.inquiry.update({ where: { id: payment.inquiryId }, data: { status: "EXPIRED", closedAt: now, closedReason: "Payment refunded" } });
      }
    }
    return updated;
  });

  await notify({
    userId: payment.tenantId,
    type: "SYSTEM",
    title: `${formatCurrency(amount)} refunded`,
    body: `${input.reason} Paystack refunds usually arrive within 5–10 working days.`,
    link: "/dashboard/payments",
    email: true,
  });
  return refunded;
}

// ── Disputes ───────────────────────────────────────────────────────────────

export async function createDispute(paymentId: string, userId: string, reason: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { listing: { include: { property: true } }, disputes: { where: OPEN_DISPUTE } },
  });
  if (!payment) throw createError("Payment not found", 404);
  const isTenant = payment.tenantId === userId;
  if (!isTenant && payment.listing.landlordId !== userId) throw createError("You don't have access to this payment.", 403);
  if (payment.status !== "IN_ESCROW") throw createError("Disputes can be raised while money is in escrow.", 409);
  if (payment.disputes.length) throw createError("There's already an open dispute for this payment.", 409);

  const dispute = await prisma.paymentDispute.create({ data: { paymentId, openedById: userId, reason } });
  const otherPartyId = isTenant ? payment.listing.landlordId : payment.tenantId;
  await Promise.all([
    notify({
      userId: otherPartyId,
      type: "SYSTEM",
      title: "A dispute was raised",
      body: `The payout for ${payment.listing.property.title} is paused while Lettr reviews it. We'll contact you both.`,
      link: payment.tenancyAgreementId ? `/tenancies/${payment.tenancyAgreementId}` : "/notifications",
      email: true,
    }),
    notifyAdmins("New payment dispute", `${payment.listing.property.title}: ${reason.slice(0, 160)}`, "/admin/disputes"),
  ]);
  return dispute;
}

// ── Reads ──────────────────────────────────────────────────────────────────

const PAYMENT_LIST_INCLUDE = {
  receipt: true,
  tenancyAgreement: { select: { id: true, tenantSignedAt: true, landlordSignedAt: true, isHandoverConfirmed: true, autoReleaseAt: true, cancelledAt: true } },
  disputes: { select: { id: true, status: true, reason: true, outcome: true, createdAt: true } },
  tenant: { select: { id: true, firstName: true, lastName: true } },
  listing: {
    select: {
      id: true,
      landlordId: true,
      property: { select: { title: true, neighbourhood: true, state: true, photos: { where: { isCover: true }, take: 1, select: { url: true } } } },
    },
  },
} satisfies Prisma.PaymentInclude;

function withPayout<T extends { totalAmount: Money; platformFee: Money }>(payment: T) {
  return { ...payment, landlordPayout: calculateLandlordPayout({ total: money(payment.totalAmount), platformFee: money(payment.platformFee) }) };
}

export async function getMyPayments(userId: string, role: UserRole) {
  if (role === "ADMIN") throw createError("Use the admin payments view.", 403);
  const payments = await prisma.payment.findMany({
    where: role === "TENANT" ? { tenantId: userId } : { listing: { landlordId: userId }, status: { notIn: ["PENDING", "FAILED"] } },
    include: PAYMENT_LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return payments.map(withPayout);
}

export async function getPayment(paymentId: string, userId: string, role: UserRole) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: PAYMENT_LIST_INCLUDE });
  if (!payment) throw createError("Payment not found", 404);
  if (role !== "ADMIN" && payment.tenantId !== userId && payment.listing.landlordId !== userId) {
    throw createError("You don't have access to this payment.", 403);
  }
  return withPayout(payment);
}

/** Describe when a payment will be released — shown on the tenancy page. */
export function describeRelease(autoReleaseAt: Date | null): string | null {
  return autoReleaseAt ? `Escrow releases automatically on ${formatAppointment(autoReleaseAt)} unless a dispute is raised.` : null;
}
