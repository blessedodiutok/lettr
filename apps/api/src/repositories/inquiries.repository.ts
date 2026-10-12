// Prisma queries for inquiries, messages and inspection bookings.

import type { InquiryStatus, Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const PERSON = { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } as const;

const LISTING_SUMMARY = {
  select: {
    id: true,
    status: true,
    annualRent: true,
    cautionFee: true,
    serviceCharge: true,
    legalFee: true,
    availableFrom: true,
    property: {
      select: {
        id: true,
        title: true,
        neighbourhood: true,
        lga: true,
        state: true,
        propertyType: true,
        photos: { where: { isCover: true }, take: 1, select: { url: true } },
      },
    },
  },
} as const;

export const INQUIRY_DETAIL = {
  listing: LISTING_SUMMARY,
  tenant: PERSON,
  landlord: PERSON,
  inspectionBooking: true,
  messages: { orderBy: { createdAt: "asc" as const }, select: { id: true, senderId: true, body: true, createdAt: true, readAt: true } },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { id: true, status: true, totalAmount: true, createdAt: true, refundedAt: true },
  },
} satisfies Prisma.InquiryInclude;

const INQUIRY_SUMMARY = {
  listing: LISTING_SUMMARY,
  tenant: PERSON,
  landlord: PERSON,
  inspectionBooking: { select: { scheduledAt: true, isConfirmed: true, isCompleted: true } },
  messages: { orderBy: { createdAt: "desc" as const }, take: 1, select: { senderId: true, body: true, createdAt: true } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1, select: { id: true, status: true } },
} satisfies Prisma.InquiryInclude;

export type InquiryDetail = Prisma.InquiryGetPayload<{ include: typeof INQUIRY_DETAIL }>;

export function findExistingInquiry(listingId: string, tenantId: string) {
  return prisma.inquiry.findUnique({ where: { listingId_tenantId: { listingId, tenantId } } });
}

export function createInquiry(data: { listingId: string; tenantId: string; landlordId: string; message: string }) {
  return prisma.inquiry.create({
    data: {
      listingId: data.listingId,
      tenantId: data.tenantId,
      landlordId: data.landlordId,
      initialMessage: data.message,
      messages: { create: { senderId: data.tenantId, body: data.message } },
    },
    include: INQUIRY_DETAIL,
  });
}

export function findInquiryById(id: string) {
  return prisma.inquiry.findUnique({ where: { id }, include: INQUIRY_DETAIL });
}

export function findInquiriesByUser(userId: string, role: UserRole, filter: { status?: "active" | "closed"; listingId?: string }) {
  const closed: InquiryStatus[] = ["DECLINED", "EXPIRED"];
  return prisma.inquiry.findMany({
    where: {
      ...(role === "TENANT" ? { tenantId: userId } : { landlordId: userId }),
      ...(filter.listingId && { listingId: filter.listingId }),
      ...(filter.status === "active" && { status: { notIn: closed } }),
      ...(filter.status === "closed" && { status: { in: closed } }),
    },
    include: INQUIRY_SUMMARY,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

/** Unread message counts per inquiry for a reader. */
export async function countUnreadByInquiry(readerId: string, inquiryIds: string[]) {
  if (!inquiryIds.length) return new Map<string, number>();
  const rows = await prisma.message.groupBy({
    by: ["inquiryId"],
    where: { inquiryId: { in: inquiryIds }, senderId: { not: readerId }, readAt: null },
    _count: { _all: true },
  });
  return new Map(rows.map((row) => [row.inquiryId, row._count._all]));
}

export function countUnreadForUser(userId: string) {
  return prisma.message.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      inquiry: { OR: [{ tenantId: userId }, { landlordId: userId }] },
    },
  });
}

export function updateInquiry(id: string, data: Prisma.InquiryUncheckedUpdateInput) {
  return prisma.inquiry.update({ where: { id }, data, include: INQUIRY_DETAIL });
}

export async function createMessage(inquiryId: string, senderId: string, body: string, status?: InquiryStatus) {
  return prisma.$transaction(async (tx) => {
    await tx.message.create({ data: { inquiryId, senderId, body } });
    return tx.inquiry.update({
      where: { id: inquiryId },
      data: { updatedAt: new Date(), ...(status && { status }) },
      include: INQUIRY_DETAIL,
    });
  });
}

export function markMessagesRead(inquiryId: string, readerId: string) {
  return prisma.message.updateMany({
    where: { inquiryId, senderId: { not: readerId }, readAt: null },
    data: { readAt: new Date() },
  });
}

export function upsertInspection(inquiryId: string, data: { scheduledAt: Date; notes?: string; proposedById: string }) {
  const values = { ...data, isConfirmed: false, isCompleted: false, cancellationReason: null };
  return prisma.inspectionBooking.upsert({ where: { inquiryId }, create: { inquiryId, ...values }, update: values });
}

export function updateInspection(inquiryId: string, data: Prisma.InspectionBookingUpdateInput) {
  return prisma.inspectionBooking.update({ where: { inquiryId }, data });
}
