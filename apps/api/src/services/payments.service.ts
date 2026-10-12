import { calculateAgentCommission, calculatePlatformFee } from "@lettr/utils";
import type { Prisma, UserRole } from "@prisma/client";
import axios from "axios";
import crypto from "crypto";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

interface InitiatePaymentInput {
  listingId: string;
}

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY ?? ""}`,
    "Content-Type": "application/json",
  },
});

function money(value: { toNumber(): number } | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function agreementText(listing: {
  property: { address: string };
  annualRent: { toNumber(): number };
}): string {
  return [
    "RESIDENTIAL TENANCY AGREEMENT",
    `PROPERTY: ${listing.property.address}`,
    `ANNUAL RENT: NGN ${money(listing.annualRent).toLocaleString("en-NG")}`,
    "Funds are held in Lettr escrow until the signed agreement and handover are confirmed.",
  ].join("\n\n");
}

export async function initiatePayment(
  input: InitiatePaymentInput,
  tenantId: string,
) {
  if (!env.PAYSTACK_SECRET_KEY) throw createError("Paystack is not configured", 500);

  const listing = await prisma.listing.findUnique({
    where: { id: input.listingId },
    include: { property: true },
  });
  if (!listing) throw createError("Listing not found", 404);
  if (listing.status !== "ACTIVE") throw createError("This listing is no longer available", 400);
  if (listing.landlordId === tenantId) throw createError("You cannot pay for your own listing", 400);

  const tenant = await prisma.user.findUnique({ where: { id: tenantId } });
  if (!tenant) throw createError("Tenant not found", 404);

  const existing = await prisma.payment.findFirst({
    where: {
      listingId: listing.id,
      status: { in: ["PROCESSING", "IN_ESCROW", "RELEASED"] },
    },
  });
  if (existing) throw createError("This listing already has an active payment", 409);

  const annualRent = money(listing.annualRent);
  const cautionFee = money(listing.cautionFee);
  const serviceCharge = money(listing.serviceCharge);
  const legalFee = money(listing.legalFee);
  const platformFee = calculatePlatformFee(annualRent);
  const agentFeeSaved = calculateAgentCommission(annualRent);
  const totalAmount = annualRent + cautionFee + serviceCharge + legalFee + platformFee;

  const payment = await prisma.payment.create({
    data: {
      listingId: listing.id,
      tenantId,
      annualRent,
      cautionFee,
      platformFee,
      agentFeeSaved,
      totalAmount,
    },
  });

  try {
    const response = await paystack.post("/transaction/initialize", {
      email: tenant.email,
      amount: Math.round(totalAmount * 100),
      reference: payment.id,
      metadata: { paymentId: payment.id, listingId: listing.id, tenantId },
      callback_url: `${env.WEB_URL}/pay/${listing.id}/success?paymentId=${payment.id}`,
    });
    const { authorization_url, access_code, reference } = response.data.data;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { paystackReference: reference, paystackAccessCode: access_code },
    });
    return {
      paymentId: payment.id,
      authorizationUrl: authorization_url,
      accessCode: access_code,
      reference,
      breakdown: { annualRent, cautionFee, serviceCharge, legalFee, platformFee, agentFeeSaved, totalAmount },
    };
  } catch (error) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw error;
  }
}

export async function handlePaystackWebhook(rawBody: Buffer, signature: string) {
  const webhookSecret = env.PAYSTACK_WEBHOOK_SECRET ?? env.PAYSTACK_SECRET_KEY;
  if (!webhookSecret) throw createError("Paystack webhook secret is not configured", 500);
  const expected = crypto.createHmac("sha512", webhookSecret).update(rawBody).digest("hex");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    throw createError("Invalid webhook signature", 401);
  }

  const event = JSON.parse(rawBody.toString()) as {
    event: string;
    data: {
      reference: string;
      status: string;
      amount: number;
      currency: string;
      metadata?: { paymentId?: string; listingId?: string; tenantId?: string };
    };
  };
  const paymentId = event.data.metadata?.paymentId ?? event.data.reference;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  if (event.event !== "charge.success" || event.data.status !== "success") {
    if (payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", paystackWebhookData: event.data as Prisma.InputJsonValue },
      });
    }
    return;
  }
  if (
    event.data.reference !== payment.paystackReference ||
    event.data.currency !== payment.currency ||
    event.data.amount !== Math.round(money(payment.totalAmount) * 100) ||
    event.data.metadata?.listingId !== payment.listingId ||
    event.data.metadata?.tenantId !== payment.tenantId
  ) {
    throw createError("Paystack transaction does not match the payment", 400);
  }
  if (payment.status !== "PENDING") return;

  await prisma.$transaction(async (tx) => {
    const locked = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "PROCESSING", paystackWebhookData: event.data as Prisma.InputJsonValue },
    });
    if (locked.count === 0) return;

    const listing = await tx.listing.findUnique({
      where: { id: payment.listingId },
      include: { property: true },
    });
    if (!listing || listing.status !== "ACTIVE") throw createError("Listing is no longer available", 409);

    const start = listing.availableFrom > new Date() ? listing.availableFrom : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + listing.minimumLeaseTerm);
    const tenancy = await tx.tenancyAgreement.create({
      data: {
        listingId: listing.id,
        tenantId: payment.tenantId,
        landlordId: listing.landlordId,
        agreementText: agreementText(listing),
        tenancyStartDate: start,
        tenancyEndDate: end,
      },
    });
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "IN_ESCROW", tenancyAgreementId: tenancy.id },
    });
    await tx.listing.update({ where: { id: listing.id }, data: { status: "UNDER_OFFER" } });
    await tx.receipt.create({
      data: { paymentId: payment.id, receiptNumber: `LTR-${new Date().getFullYear()}-${payment.id.toUpperCase()}` },
    });
    await tx.notification.createMany({
      data: [
        { userId: payment.tenantId, type: "FUNDS_IN_ESCROW", title: "Payment confirmed", body: "Your payment is held in escrow.", data: { paymentId: payment.id, agreementId: tenancy.id } },
        { userId: listing.landlordId, type: "AGREEMENT_READY", title: "Payment received and agreement ready", body: "Sign the agreement and complete handover to release funds.", data: { paymentId: payment.id, agreementId: tenancy.id } },
      ],
    });
  });
}

export async function verifyPayment(paymentId: string, userId: string, role: UserRole) {
  const payment = await getPayment(paymentId, userId, role);
  if (payment.status !== "PENDING" || !payment.paystackReference || !env.PAYSTACK_SECRET_KEY) return payment;
  const response = await paystack.get(`/transaction/verify/${payment.paystackReference}`);
  if (response.data.data.status === "success") {
    // Verification responses are trusted over the authenticated Paystack API, so process directly.
    const data = response.data.data;
    await processVerifiedCharge(paymentId, data);
  }
  return getPayment(paymentId, userId, role);
}

async function processVerifiedCharge(paymentId: string, data: Record<string, unknown>) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { listing: { include: { property: true } } } });
  if (!payment || payment.status !== "PENDING") return;
  if (payment.listing.status !== "ACTIVE") throw createError("Listing is no longer available", 409);
  if (Number(data.amount) !== Math.round(money(payment.totalAmount) * 100) || data.currency !== payment.currency) {
    throw createError("Verified transaction amount does not match", 400);
  }
  const start = payment.listing.availableFrom > new Date() ? payment.listing.availableFrom : new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + payment.listing.minimumLeaseTerm);
  await prisma.$transaction(async (tx) => {
    const tenancy = await tx.tenancyAgreement.create({
      data: {
        listingId: payment.listingId,
        tenantId: payment.tenantId,
        landlordId: payment.listing.landlordId,
        agreementText: agreementText(payment.listing),
        tenancyStartDate: start,
        tenancyEndDate: end,
      },
    });
    await tx.payment.update({ where: { id: payment.id }, data: { status: "IN_ESCROW", tenancyAgreementId: tenancy.id, paystackWebhookData: data as Prisma.InputJsonValue } });
    await tx.listing.update({ where: { id: payment.listingId }, data: { status: "UNDER_OFFER" } });
    await tx.receipt.upsert({ where: { paymentId: payment.id }, create: { paymentId: payment.id, receiptNumber: `LTR-${new Date().getFullYear()}-${payment.id.toUpperCase()}` }, update: {} });
  });
}

export async function releaseEscrow(paymentId: string, actorId: string, role: UserRole) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { listing: { include: { landlord: { include: { landlordProfile: true } } } }, tenancyAgreement: true },
  });
  if (!payment) throw createError("Payment not found", 404);
  if (role !== "ADMIN" && payment.listing.landlordId !== actorId) throw createError("Not authorised", 403);
  if (payment.status !== "IN_ESCROW") throw createError(`Cannot release payment in status: ${payment.status}`, 400);
  if (!payment.tenancyAgreement?.tenantSignedAt || !payment.tenancyAgreement.landlordSignedAt || !payment.tenancyAgreement.isHandoverConfirmed) {
    throw createError("Both signatures and confirmed handover are required", 409);
  }

  let transferCode: string | undefined;
  const transferReference = `LTR-TRANSFER-${payment.id}`;
  if (env.PAYSTACK_TRANSFER_ENABLED) {
    const profile = payment.listing.landlord.landlordProfile;
    if (!profile?.bankAccountName || !profile.bankAccountNumber || !profile.bankCode) {
      throw createError("Landlord bank details are incomplete", 409);
    }
    const recipient = await paystack.post("/transferrecipient", {
      type: "nuban",
      name: profile.bankAccountName,
      account_number: profile.bankAccountNumber,
      bank_code: profile.bankCode,
      currency: "NGN",
    });
    const transfer = await paystack.post("/transfer", {
      source: "balance",
      amount: Math.round((money(payment.totalAmount) - money(payment.platformFee)) * 100),
      recipient: recipient.data.data.recipient_code,
      reference: transferReference,
      reason: `Lettr escrow release for ${payment.listingId}`,
    });
    transferCode = transfer.data.data.transfer_code;
  } else if (env.NODE_ENV === "production") {
    throw createError("Paystack transfers must be enabled in production", 500);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "RELEASED", escrowReleasedAt: new Date(), transferReference, paystackTransferCode: transferCode },
    });
    await tx.listing.update({ where: { id: payment.listingId }, data: { status: "TAKEN", takenAt: new Date() } });
    await tx.landlordProfile.update({ where: { userId: payment.listing.landlordId }, data: { totalRentalsCompleted: { increment: 1 } } });
    return updated;
  });
}

export async function refundPayment(paymentId: string, amount: number | undefined, reason: string, adminId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment?.paystackReference) throw createError("Payment not found or not refundable", 404);
  const refundAmount = amount ?? money(payment.totalAmount);
  if (refundAmount > money(payment.totalAmount)) throw createError("Refund exceeds payment total", 400);
  if (env.PAYSTACK_SECRET_KEY) {
    await paystack.post("/refund", { transaction: payment.paystackReference, amount: Math.round(refundAmount * 100) });
  } else if (env.NODE_ENV === "production") {
    throw createError("Paystack is not configured", 500);
  }
  return prisma.payment.update({
    where: { id: paymentId },
    data: { status: refundAmount === money(payment.totalAmount) ? "REFUNDED" : "PARTIALLY_REFUNDED", refundedAt: new Date(), refundReason: `${reason} (admin: ${adminId})` },
  });
}

export async function createDispute(paymentId: string, userId: string, reason: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { listing: true } });
  if (!payment) throw createError("Payment not found", 404);
  if (payment.tenantId !== userId && payment.listing.landlordId !== userId) throw createError("Not authorised", 403);
  return prisma.paymentDispute.create({ data: { paymentId, openedById: userId, reason } });
}

export async function getMyPayments(userId: string, role: UserRole) {
  return prisma.payment.findMany({
    where: role === "TENANT" ? { tenantId: userId } : role === "LANDLORD" ? { listing: { landlordId: userId } } : {},
    include: { receipt: true, tenancyAgreement: true, listing: { include: { property: { include: { photos: { where: { isCover: true }, take: 1 } } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPayment(paymentId: string, userId: string, role: UserRole) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { receipt: true, tenancyAgreement: true, listing: true, disputes: true } });
  if (!payment) throw createError("Payment not found", 404);
  if (role !== "ADMIN" && payment.tenantId !== userId && payment.listing.landlordId !== userId) throw createError("Not authorised", 403);
  return payment;
}
