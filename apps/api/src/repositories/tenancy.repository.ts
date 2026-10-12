// Prisma queries for tenancy agreements.

import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const PERSON = { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true, phone: true } } as const;

const TENANCY_INCLUDE = {
  listing: {
    select: {
      id: true,
      status: true,
      annualRent: true,
      cautionFee: true,
      serviceCharge: true,
      minimumLeaseTerm: true,
      property: {
        select: {
          title: true,
          address: true,
          neighbourhood: true,
          lga: true,
          state: true,
          propertyType: true,
          photos: { where: { isCover: true }, take: 1, select: { url: true } },
        },
      },
    },
  },
  tenant: PERSON,
  landlord: PERSON,
  payments: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      platformFee: true,
      createdAt: true,
      escrowReleasedAt: true,
      releaseError: true,
      refundedAt: true,
      receipt: { select: { receiptNumber: true } },
      disputes: { select: { id: true, status: true, reason: true, outcome: true, resolution: true, createdAt: true } },
    },
  },
} satisfies Prisma.TenancyAgreementInclude;

export function findTenancyById(id: string) {
  return prisma.tenancyAgreement.findUnique({ where: { id }, include: TENANCY_INCLUDE });
}

export function findTenanciesByUser(userId: string, role: UserRole) {
  return prisma.tenancyAgreement.findMany({
    where: role === "TENANT" ? { tenantId: userId } : { landlordId: userId },
    include: TENANCY_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export function signTenancy(id: string, party: "TENANT" | "LANDLORD") {
  return prisma.tenancyAgreement.update({
    where: { id },
    data: party === "TENANT" ? { tenantSignedAt: new Date() } : { landlordSignedAt: new Date() },
  });
}
