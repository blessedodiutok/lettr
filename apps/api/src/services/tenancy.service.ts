// File: apps/api/src/services/tenancy.service.ts
// Business logic for tenancy agreements
// Uses tenancy.repository for all Prisma queries

import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import * as notificationsRepo from "../repositories/notifications.repository.js";
import * as tenancyRepo from "../repositories/tenancy.repository.js";
import * as paymentsService from "./payments.service.js";

function generateAgreementText(params: {
  landlordName: string;
  tenantName: string;
  propertyAddress: string;
  annualRent: number;
  startDate: Date;
  endDate: Date;
}): string {
  const rentFormatted = `₦${params.annualRent.toLocaleString("en-NG")}`;
  const start = params.startDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const end = params.endDate.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `
RESIDENTIAL TENANCY AGREEMENT

This agreement is entered into between:
LANDLORD: ${params.landlordName}
TENANT: ${params.tenantName}

PROPERTY: ${params.propertyAddress}

TERMS:
1. TENANCY PERIOD: From ${start} to ${end} (12 months).
2. ANNUAL RENT: ${rentFormatted} payable annually in advance.
3. USE: The tenant shall use the property solely as a private residence.
4. MAINTENANCE: The tenant shall keep the property in good repair.
5. SUBLETTING: The tenant shall not sublet without written landlord consent.
6. TERMINATION: Two months' written notice required by either party.
7. PLATFORM: This tenancy was arranged through Lettr — no agent fees were charged.

Signed electronically via the Lettr platform.
  `.trim();
}

export async function createAgreement(
  body: {
    listingId: string;
    tenantId: string;
    tenancyStartDate: string;
    paymentId?: string;
  },
  landlordId: string,
) {
  // Fetch listing with property + landlord details for the agreement text
  const listing = await prisma.listing.findUnique({
    where: { id: body.listingId },
    include: { property: true, landlord: true },
  });
  if (!listing) throw createError("Listing not found", 404);
  if (listing.landlordId !== landlordId)
    throw createError("Not authorised", 403);

  const tenant = await prisma.user.findUnique({ where: { id: body.tenantId } });
  if (!tenant) throw createError("Tenant not found", 404);

  const startDate = new Date(body.tenancyStartDate);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const agreementText = generateAgreementText({
    landlordName: `${listing.landlord.firstName} ${listing.landlord.lastName}`,
    tenantName: `${tenant.firstName} ${tenant.lastName}`,
    propertyAddress: listing.property.address,
    annualRent: listing.annualRent.toNumber(),
    startDate,
    endDate,
  });

  const qualifyingPayment = body.paymentId
    ? await prisma.payment.findFirst({
        where: {
          id: body.paymentId,
          listingId: body.listingId,
          tenantId: body.tenantId,
          status: "IN_ESCROW",
        },
      })
    : null;
  const acceptedInquiry = await prisma.inquiry.findFirst({
    where: { listingId: body.listingId, tenantId: body.tenantId, status: "ACCEPTED" },
  });
  if (!qualifyingPayment && !acceptedInquiry) {
    throw createError("An accepted inquiry or escrowed payment is required", 409);
  }

  const agreement = await prisma.$transaction(async (tx) => {
    const created = await tx.tenancyAgreement.create({
      data: {
        listingId: body.listingId,
        tenantId: body.tenantId,
        landlordId,
        agreementText,
        tenancyStartDate: startDate,
        tenancyEndDate: endDate,
      },
    });
    if (qualifyingPayment) {
      await tx.payment.update({
        where: { id: qualifyingPayment.id },
        data: { tenancyAgreementId: created.id },
      });
    }
    return created;
  });

  await notificationsRepo.createNotification({
    userId: body.tenantId,
    type: "AGREEMENT_READY",
    title: "Your tenancy agreement is ready",
    body:
      "Please review and sign your tenancy agreement for " +
      listing.property.title,
    data: { agreementId: agreement.id },
  });

  return agreement;
}

export async function getMyTenancies(userId: string, role: UserRole) {
  return tenancyRepo.findTenanciesByUser(userId, role);
}

export async function getAgreement(id: string, userId: string) {
  const agreement = await tenancyRepo.findTenancyById(id);
  if (!agreement) throw createError("Agreement not found", 404);
  if (agreement.tenantId !== userId && agreement.landlordId !== userId)
    throw createError("Not authorised", 403);
  return agreement;
}

export async function signAgreement(
  id: string,
  userId: string,
  role: UserRole,
) {
  const agreement = await tenancyRepo.findTenancyById(id);
  if (!agreement) throw createError("Agreement not found", 404);
  if (agreement.tenantId !== userId && agreement.landlordId !== userId)
    throw createError("Not authorised", 403);

  if (role === "ADMIN") throw createError("Administrators cannot sign tenancy agreements", 403);
  const actualRole = agreement.tenantId === userId ? "TENANT" : "LANDLORD";
  if (role !== actualRole) throw createError("Role does not match agreement participant", 403);
  if (
    (actualRole === "TENANT" && agreement.tenantSignedAt) ||
    (actualRole === "LANDLORD" && agreement.landlordSignedAt)
  ) {
    throw createError("Agreement is already signed by this participant", 409);
  }
  const updated = await tenancyRepo.signTenancy(id, actualRole);

  // Notify the other party when both have signed
  if (updated.tenantSignedAt && updated.landlordSignedAt) {
    const recipientId =
      role === "TENANT" ? agreement.landlordId : agreement.tenantId;
    await notificationsRepo.createNotification({
      userId: recipientId,
      type: "AGREEMENT_SIGNED",
      title: "Tenancy agreement fully signed",
      body: "Both parties have signed. The tenancy agreement is now complete.",
      data: { agreementId: id },
    });
  }

  return updated;
}

export async function confirmHandover(id: string, landlordId: string) {
  const agreement = await tenancyRepo.findTenancyById(id);
  if (!agreement) throw createError("Agreement not found", 404);
  if (agreement.landlordId !== landlordId)
    throw createError("Not authorised", 403);
  if (!agreement.tenantSignedAt || !agreement.landlordSignedAt) {
    throw createError("Both parties must sign before handover", 409);
  }
  if (agreement.isHandoverConfirmed) return agreement;
  const payment = await prisma.payment.findFirst({
    where: { tenancyAgreementId: id, status: "IN_ESCROW" },
  });
  if (!payment) throw createError("An escrowed payment is required before handover", 409);
  const updated = await tenancyRepo.confirmTenancyHandover(id);
  await paymentsService.releaseEscrow(payment.id, landlordId, "LANDLORD");
  return updated;
}
