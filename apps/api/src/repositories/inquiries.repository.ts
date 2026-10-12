// File: apps/api/src/repositories/inquiries.repository.ts
// All Prisma queries for the inquiries domain

import type { InquiryStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const INQUIRY_INCLUDE = {
  listing: {
    include: {
      property: { include: { photos: { where: { isCover: true }, take: 1 } } },
    },
  },
  tenant: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
  landlord: {
    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
  },
  inspectionBooking: true,
  messages: {
    orderBy: { createdAt: "asc" as const },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  },
} satisfies Prisma.InquiryInclude;

export async function findExistingInquiry(listingId: string, tenantId: string) {
  return prisma.inquiry.findUnique({
    where: { listingId_tenantId: { listingId, tenantId } },
  });
}

export async function createInquiry(data: {
  listingId: string;
  tenantId: string;
  landlordId: string;
  initialMessage: string;
  message: string;
}) {
  return prisma.inquiry.create({
    data: {
      listingId: data.listingId,
      tenantId: data.tenantId,
      landlordId: data.landlordId,
      initialMessage: data.initialMessage,
      messages: {
        create: { senderId: data.tenantId, body: data.message },
      },
    },
    include: INQUIRY_INCLUDE,
  });
}

export async function findInquiryById(id: string) {
  return prisma.inquiry.findUnique({ where: { id }, include: INQUIRY_INCLUDE });
}

export async function findInquiriesByUser(userId: string, role: UserRole) {
  return prisma.inquiry.findMany({
    where: role === "TENANT" ? { tenantId: userId } : { landlordId: userId },
    include: INQUIRY_INCLUDE,
    orderBy: { updatedAt: "desc" },
  });
}

export async function updateInquiry(
  id: string,
  data: { status?: InquiryStatus },
) {
  return prisma.inquiry.update({
    where: { id },
    data: data as Prisma.InquiryUncheckedUpdateInput,
    include: INQUIRY_INCLUDE,
  });
}

export async function createMessage(
  inquiryId: string,
  senderId: string,
  body: string,
) {
  return prisma.$transaction(async (tx) => {
    await tx.message.create({ data: { inquiryId, senderId, body } });
    await tx.inquiry.update({
      where: { id: inquiryId },
      data: { updatedAt: new Date() },
    });
    return tx.inquiry.findUnique({
      where: { id: inquiryId },
      include: INQUIRY_INCLUDE,
    });
  });
}

export async function markMessagesRead(inquiryId: string, readerId: string) {
  return prisma.message.updateMany({
    where: { inquiryId, senderId: { not: readerId }, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function upsertInspection(
  inquiryId: string,
  data: {
    scheduledAt: Date;
    notes?: string;
    isConfirmed: boolean;
  },
) {
  return prisma.inspectionBooking.upsert({
    where: { inquiryId },
    create: { inquiryId, ...data },
    update: data,
  });
}
