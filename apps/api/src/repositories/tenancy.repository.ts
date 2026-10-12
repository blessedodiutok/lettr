// File: apps/api/src/repositories/tenancy.repository.ts
// All Prisma queries for the tenancy agreements domain

import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const TENANCY_INCLUDE = {
  listing: {
    include: {
      property: {
        include: {
          photos: { where: { isCover: true }, take: 1 },
        },
      },
    },
  },
  tenant: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
  landlord: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
} satisfies Prisma.TenancyAgreementInclude;

export async function createTenancyAgreement(
  data: Prisma.TenancyAgreementUncheckedCreateInput,
) {
  return prisma.tenancyAgreement.create({
    data,
    include: TENANCY_INCLUDE,
  });
}

export async function findTenancyById(id: string) {
  return prisma.tenancyAgreement.findUnique({
    where: { id },
    include: {
      ...TENANCY_INCLUDE,
      listing: {
        include: {
          property: true,
        },
      },
    },
  });
}

export async function findTenanciesByUser(userId: string, role: UserRole) {
  return prisma.tenancyAgreement.findMany({
    where: role === "TENANT" ? { tenantId: userId } : { landlordId: userId },
    include: TENANCY_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function signTenancy(id: string, role: UserRole) {
  const data =
    role === "TENANT"
      ? { tenantSignedAt: new Date() }
      : { landlordSignedAt: new Date() };

  return prisma.tenancyAgreement.update({
    where: { id },
    data,
    include: TENANCY_INCLUDE,
  });
}

export async function confirmTenancyHandover(id: string) {
  return prisma.tenancyAgreement.update({
    where: { id },
    data: {
      isHandoverConfirmed: true,
      handoverConfirmedAt: new Date(),
    },
    include: TENANCY_INCLUDE,
  });
}

export async function findActiveTenancyForListing(listingId: string) {
  return prisma.tenancyAgreement.findFirst({
    where: {
      listingId,
      isHandoverConfirmed: false,
    },
    include: TENANCY_INCLUDE,
  });
}
