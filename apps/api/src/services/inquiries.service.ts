import type { InquiryStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import * as inquiriesRepo from "../repositories/inquiries.repository.js";
import * as notificationsRepo from "../repositories/notifications.repository.js";

function serializeInquiry<T extends {
  messages: Array<{ senderId: string; body: string; createdAt: Date; readAt: Date | null }>;
}>(inquiry: T) {
  return {
    ...inquiry,
    messages: inquiry.messages.map((item) => ({
      senderId: item.senderId,
      message: item.body,
      sentAt: item.createdAt,
      isRead: Boolean(item.readAt),
    })),
  };
}

export async function createInquiry(body: { listingId: string; message: string }, tenantId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: body.listingId },
    select: { id: true, landlordId: true, status: true, property: { select: { title: true } } },
  });
  if (!listing) throw createError("Listing not found", 404);
  if (listing.status !== "ACTIVE") throw createError("Listing is no longer available", 400);
  if (listing.landlordId === tenantId) throw createError("You cannot inquire about your own listing", 400);
  if (await inquiriesRepo.findExistingInquiry(body.listingId, tenantId)) {
    throw createError("You already have an inquiry for this listing", 409);
  }
  const inquiry = await inquiriesRepo.createInquiry({
    listingId: body.listingId,
    tenantId,
    landlordId: listing.landlordId,
    initialMessage: body.message,
    message: body.message,
  });
  await notificationsRepo.createNotification({
    userId: listing.landlordId,
    type: "INQUIRY_RECEIVED",
    title: "New inquiry received",
    body: `Someone is interested in ${listing.property.title}`,
    data: { inquiryId: inquiry.id, listingId: body.listingId },
  });
  return serializeInquiry(inquiry);
}

export async function getMyInquiries(userId: string, role: UserRole) {
  if (role === "ADMIN") throw createError("Administrators do not have personal inquiries", 403);
  const inquiries = await inquiriesRepo.findInquiriesByUser(userId, role);
  return inquiries.map(serializeInquiry);
}

export async function getInquiry(id: string, userId: string) {
  const inquiry = await inquiriesRepo.findInquiryById(id);
  if (!inquiry) throw createError("Inquiry not found", 404);
  if (inquiry.tenantId !== userId && inquiry.landlordId !== userId) throw createError("Not authorised to view this inquiry", 403);
  await inquiriesRepo.markMessagesRead(id, userId);
  return serializeInquiry(inquiry);
}

export async function sendMessage(id: string, message: string, senderId: string) {
  const inquiry = await inquiriesRepo.findInquiryById(id);
  if (!inquiry) throw createError("Inquiry not found", 404);
  if (inquiry.tenantId !== senderId && inquiry.landlordId !== senderId) throw createError("Not authorised", 403);
  if (["DECLINED", "EXPIRED"].includes(inquiry.status)) throw createError("This inquiry is closed", 409);
  const updated = await inquiriesRepo.createMessage(id, senderId, message);
  if (!updated) throw createError("Inquiry not found", 404);
  if (inquiry.status === "OPEN") await inquiriesRepo.updateInquiry(id, { status: "RESPONDED" });
  const recipientId = senderId === inquiry.tenantId ? inquiry.landlordId : inquiry.tenantId;
  await notificationsRepo.createNotification({ userId: recipientId, type: "INQUIRY_RESPONDED", title: "New message", body: message.substring(0, 100), data: { inquiryId: id } });
  return serializeInquiry(updated);
}

export async function scheduleInspection(id: string, body: { scheduledAt: string; notes?: string }, userId: string) {
  const inquiry = await inquiriesRepo.findInquiryById(id);
  if (!inquiry) throw createError("Inquiry not found", 404);
  if (inquiry.tenantId !== userId && inquiry.landlordId !== userId) throw createError("Not authorised", 403);
  const updated = await inquiriesRepo.upsertInspection(id, { scheduledAt: new Date(body.scheduledAt), notes: body.notes, isConfirmed: false });
  await inquiriesRepo.updateInquiry(id, { status: "INSPECTION_SCHEDULED" });
  const recipientId = userId === inquiry.tenantId ? inquiry.landlordId : inquiry.tenantId;
  await notificationsRepo.createNotification({ userId: recipientId, type: "INSPECTION_SCHEDULED", title: "Inspection scheduled", body: `Inspection booked for ${new Date(body.scheduledAt).toLocaleDateString("en-NG")}`, data: { inquiryId: id } });
  return updated;
}

export async function updateStatus(id: string, status: InquiryStatus, userId: string) {
  const inquiry = await inquiriesRepo.findInquiryById(id);
  if (!inquiry) throw createError("Inquiry not found", 404);
  if (inquiry.tenantId !== userId && inquiry.landlordId !== userId) throw createError("Not authorised", 403);
  const isLandlord = inquiry.landlordId === userId;
  if (["INSPECTION_COMPLETED", "OFFER_MADE"].includes(status) && !isLandlord) throw createError("Only the landlord can set this status", 403);
  if (status === "ACCEPTED" && isLandlord) throw createError("Only the tenant can accept an offer", 403);
  return inquiriesRepo.updateInquiry(id, { status });
}
