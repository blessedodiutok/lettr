// Inquiries: conversation, inspection booking, offers.
// Every transition is checked against domain/inquiryRules.ts.

import { addDays, addHours, formatAppointment, RENTAL_RULES } from "@lettr/utils";
import type { UserRole } from "@prisma/client";
import { canPerform, type InquiryAction, type Party, statusAfterMessage, statusAfterOfferEnds } from "../domain/inquiryRules.js";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import * as inquiriesRepo from "../repositories/inquiries.repository.js";
import type { InquiryDetail } from "../repositories/inquiries.repository.js";
import { notify } from "./notify.js";

const ALL_ACTIONS: InquiryAction[] = [
  "message",
  "scheduleInspection",
  "confirmInspection",
  "completeInspection",
  "makeOffer",
  "withdrawOffer",
  "acceptOffer",
  "declineOffer",
  "close",
];

const threadLink = (id: string) => `/messages/${id}`;
const fullName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`;

function partyOf(inquiry: { tenantId: string; landlordId: string }, userId: string): Party {
  if (inquiry.tenantId === userId) return "TENANT";
  if (inquiry.landlordId === userId) return "LANDLORD";
  throw createError("You don't have access to this conversation.", 403);
}

async function loadForAction(id: string, userId: string, action: InquiryAction) {
  const inquiry = await inquiriesRepo.findInquiryById(id);
  if (!inquiry) throw createError("Conversation not found.", 404);
  const party = partyOf(inquiry, userId);
  const check = canPerform(action, party, inquiry.status);
  if (!check.allowed) throw createError(check.reason, 409, { code: "ACTION_NOT_ALLOWED" });
  return { inquiry, party };
}

/** Actions this user can take now — clients show buttons from this list. */
function availableActions(inquiry: InquiryDetail, party: Party, userId: string): InquiryAction[] {
  const paid = inquiry.payments[0] && ["PROCESSING", "IN_ESCROW", "RELEASED"].includes(inquiry.payments[0].status);
  return ALL_ACTIONS.filter((action) => {
    if (!canPerform(action, party, inquiry.status).allowed) return false;
    if (action === "confirmInspection") {
      const booking = inquiry.inspectionBooking;
      return Boolean(booking && !booking.isConfirmed && booking.proposedById !== userId);
    }
    if (action === "close") return !paid;
    if (action === "makeOffer" || action === "acceptOffer") return inquiry.listing.status === "ACTIVE";
    return true;
  });
}

async function serialize(inquiry: InquiryDetail, userId: string) {
  const party = partyOf(inquiry, userId);
  const tenancy = await prisma.tenancyAgreement.findUnique({
    where: { listingId_tenantId: { listingId: inquiry.listingId, tenantId: inquiry.tenantId } },
    select: {
      id: true,
      tenantSignedAt: true,
      landlordSignedAt: true,
      handoverMarkedAt: true,
      moveInConfirmedAt: true,
      isHandoverConfirmed: true,
      cancelledAt: true,
      tenancyStartDate: true,
    },
  });
  const { payments, ...rest } = inquiry;
  return {
    ...rest,
    viewerRole: party,
    payment: payments[0] ?? null,
    tenancy,
    availableActions: availableActions(inquiry, party, userId),
  };
}

// ── Reads ──────────────────────────────────────────────────────────────────

export async function getMyInquiries(userId: string, role: UserRole, filter: { status?: "active" | "closed"; listingId?: string }) {
  if (role === "ADMIN") throw createError("Admins don't have personal conversations.", 403);
  const inquiries = await inquiriesRepo.findInquiriesByUser(userId, role, filter);
  const unread = await inquiriesRepo.countUnreadByInquiry(userId, inquiries.map((i) => i.id));
  return inquiries.map(({ messages, payments, ...inquiry }) => ({
    ...inquiry,
    lastMessage: messages[0] ?? null,
    payment: payments[0] ?? null,
    unreadCount: unread.get(inquiry.id) ?? 0,
  }));
}

export async function getUnreadCount(userId: string) {
  return { unreadCount: await inquiriesRepo.countUnreadForUser(userId) };
}

export async function getInquiry(id: string, userId: string) {
  const inquiry = await inquiriesRepo.findInquiryById(id);
  if (!inquiry) throw createError("Conversation not found.", 404);
  partyOf(inquiry, userId);
  await inquiriesRepo.markMessagesRead(id, userId);
  return serialize(inquiry, userId);
}

/** The tenant's conversation for a listing, if any — used by the listing page. */
export async function getInquiryForListing(listingId: string, tenantId: string) {
  const existing = await inquiriesRepo.findExistingInquiry(listingId, tenantId);
  if (!existing) return null;
  const inquiry = await inquiriesRepo.findInquiryById(existing.id);
  return inquiry ? serialize(inquiry, tenantId) : null;
}

// ── Conversation ───────────────────────────────────────────────────────────

export async function createInquiry(body: { listingId: string; message: string }, tenantId: string) {
  const listing = await prisma.listing.findUnique({
    where: { id: body.listingId },
    select: { id: true, landlordId: true, status: true, property: { select: { title: true } } },
  });
  if (!listing) throw createError("This home no longer exists.", 404);
  if (listing.status !== "ACTIVE") throw createError("This home is no longer taking inquiries.", 409);
  if (listing.landlordId === tenantId) throw createError("You can't inquire about your own listing.", 400);

  const existing = await inquiriesRepo.findExistingInquiry(body.listingId, tenantId);
  if (existing && !["DECLINED", "EXPIRED"].includes(existing.status)) {
    throw createError("You already have a conversation about this home.", 409, {
      code: "INQUIRY_EXISTS",
      data: { inquiryId: existing.id },
    });
  }

  // A closed conversation is reopened rather than duplicated.
  const inquiry = existing
    ? await prisma.$transaction(async (tx) => {
        await tx.message.create({ data: { inquiryId: existing.id, senderId: tenantId, body: body.message } });
        return tx.inquiry.update({
          where: { id: existing.id },
          data: {
            status: "OPEN",
            closedAt: null,
            closedReason: null,
            offerMadeAt: null,
            offerExpiresAt: null,
            offerNote: null,
            acceptedAt: null,
            paymentDueAt: null,
          },
          include: inquiriesRepo.INQUIRY_DETAIL,
        });
      })
    : await inquiriesRepo.createInquiry({ listingId: body.listingId, tenantId, landlordId: listing.landlordId, message: body.message });

  await notify({
    userId: listing.landlordId,
    type: "INQUIRY_RECEIVED",
    title: `New inquiry about ${listing.property.title}`,
    body: `${fullName(inquiry.tenant)}: ${body.message.slice(0, 140)}`,
    link: threadLink(inquiry.id),
    email: true,
    actionLabel: "Reply",
  });
  return serialize(inquiry, tenantId);
}

export async function sendMessage(id: string, message: string, senderId: string) {
  const { inquiry, party } = await loadForAction(id, senderId, "message");
  const updated = await inquiriesRepo.createMessage(id, senderId, message, statusAfterMessage(inquiry.status, party));
  const sender = party === "TENANT" ? inquiry.tenant : inquiry.landlord;
  await notify({
    userId: party === "TENANT" ? inquiry.landlordId : inquiry.tenantId,
    type: "INQUIRY_RESPONDED",
    title: `New message from ${sender.firstName}`,
    body: message.slice(0, 140),
    link: threadLink(id),
  });
  return serialize(updated, senderId);
}

export async function closeInquiry(id: string, userId: string, reason?: string) {
  const { inquiry, party } = await loadForAction(id, userId, "close");
  const paid = inquiry.payments[0] && ["PROCESSING", "IN_ESCROW", "RELEASED"].includes(inquiry.payments[0].status);
  if (paid) throw createError("This rental is already paid for. Raise a dispute from the payment instead.", 409);

  const updated = await prisma.$transaction(async (tx) => {
    // Closing an accepted offer frees the listing for other tenants.
    if (inquiry.status === "ACCEPTED") {
      await tx.listing.updateMany({ where: { id: inquiry.listingId, status: "UNDER_OFFER" }, data: { status: "ACTIVE" } });
      await tx.payment.updateMany({ where: { inquiryId: id, status: "PENDING" }, data: { status: "FAILED" } });
    }
    return tx.inquiry.update({
      where: { id },
      data: { status: "DECLINED", closedAt: new Date(), closedReason: reason ?? (party === "TENANT" ? "Closed by tenant" : "Closed by landlord") },
      include: inquiriesRepo.INQUIRY_DETAIL,
    });
  });

  const other = party === "TENANT" ? inquiry.landlord : inquiry.tenant;
  await notify({
    userId: other.id,
    type: "SYSTEM",
    title: `Conversation about ${inquiry.listing.property.title} closed`,
    body: reason ? `${fullName(party === "TENANT" ? inquiry.tenant : inquiry.landlord)} closed it: ${reason}` : "The other party closed this conversation.",
    link: threadLink(id),
  });
  return serialize(updated, userId);
}

// ── Inspections ────────────────────────────────────────────────────────────

export async function scheduleInspection(id: string, body: { scheduledAt: string; notes?: string }, userId: string) {
  const { inquiry, party } = await loadForAction(id, userId, "scheduleInspection");
  const scheduledAt = new Date(body.scheduledAt);
  await inquiriesRepo.upsertInspection(id, { scheduledAt, notes: body.notes, proposedById: userId });
  const updated = await inquiriesRepo.updateInquiry(id, { status: "INSPECTION_SCHEDULED" });
  const proposer = party === "TENANT" ? inquiry.tenant : inquiry.landlord;
  await notify({
    userId: party === "TENANT" ? inquiry.landlordId : inquiry.tenantId,
    type: "INSPECTION_SCHEDULED",
    title: `${proposer.firstName} proposed an inspection`,
    body: `${formatAppointment(scheduledAt)} at ${inquiry.listing.property.title}. Confirm it or suggest another time.`,
    link: threadLink(id),
    email: true,
    actionLabel: "Respond",
  });
  return serialize(updated, userId);
}

export async function confirmInspection(id: string, userId: string) {
  const { inquiry, party } = await loadForAction(id, userId, "confirmInspection");
  const booking = inquiry.inspectionBooking;
  if (!booking) throw createError("There's no inspection to confirm.", 409);
  if (booking.proposedById === userId) throw createError("The other party needs to confirm the time you proposed.", 409);
  await inquiriesRepo.updateInspection(id, { isConfirmed: true });
  const updated = await inquiriesRepo.updateInquiry(id, { updatedAt: new Date() });
  await notify({
    userId: party === "TENANT" ? inquiry.landlordId : inquiry.tenantId,
    type: "INSPECTION_SCHEDULED",
    title: "Inspection confirmed",
    body: `${formatAppointment(booking.scheduledAt)} at ${inquiry.listing.property.title}.`,
    link: threadLink(id),
  });
  return serialize(updated, userId);
}

export async function completeInspection(id: string, userId: string) {
  const { inquiry } = await loadForAction(id, userId, "completeInspection");
  await inquiriesRepo.updateInspection(id, { isCompleted: true, isConfirmed: true });
  const updated = await inquiriesRepo.updateInquiry(id, { status: "INSPECTION_COMPLETED" });
  await notify({
    userId: inquiry.tenantId,
    type: "SYSTEM",
    title: "Inspection marked as done",
    body: `${inquiry.landlord.firstName} can now make you an offer for ${inquiry.listing.property.title}.`,
    link: threadLink(id),
  });
  return serialize(updated, userId);
}

// ── Offers ─────────────────────────────────────────────────────────────────

export async function makeOffer(id: string, userId: string, note?: string) {
  const { inquiry } = await loadForAction(id, userId, "makeOffer");
  if (inquiry.listing.status !== "ACTIVE") throw createError("This listing isn't available to offer right now.", 409);
  const now = new Date();
  const offerExpiresAt = addDays(now, RENTAL_RULES.offerValidDays);
  const updated = await inquiriesRepo.updateInquiry(id, {
    status: "OFFER_MADE",
    offerMadeAt: now,
    offerExpiresAt,
    offerNote: note ?? null,
  });
  await notify({
    userId: inquiry.tenantId,
    type: "OFFER_MADE",
    title: `${inquiry.landlord.firstName} offered you ${inquiry.listing.property.title}`,
    body: `The offer is open until ${formatAppointment(offerExpiresAt)}. Accepting it lets you pay into escrow.`,
    link: threadLink(id),
    email: true,
    actionLabel: "Review the offer",
  });
  return serialize(updated, userId);
}

export async function withdrawOffer(id: string, userId: string) {
  const { inquiry } = await loadForAction(id, userId, "withdrawOffer");
  const updated = await inquiriesRepo.updateInquiry(id, {
    status: statusAfterOfferEnds(Boolean(inquiry.inspectionBooking?.isCompleted)),
    offerMadeAt: null,
    offerExpiresAt: null,
    offerNote: null,
  });
  await notify({
    userId: inquiry.tenantId,
    type: "SYSTEM",
    title: "Offer withdrawn",
    body: `${inquiry.landlord.firstName} withdrew the offer for ${inquiry.listing.property.title}.`,
    link: threadLink(id),
  });
  return serialize(updated, userId);
}

export async function acceptOffer(id: string, userId: string) {
  const { inquiry } = await loadForAction(id, userId, "acceptOffer");
  const now = new Date();
  if (inquiry.offerExpiresAt && inquiry.offerExpiresAt < now) throw createError("This offer has lapsed. Ask the landlord to make a new one.", 409);

  const paymentDueAt = addHours(now, RENTAL_RULES.paymentWindowHours);
  const updated = await prisma.$transaction(async (tx) => {
    // Reserve the home atomically: only one tenant can hold it at a time.
    const reserved = await tx.listing.updateMany({ where: { id: inquiry.listingId, status: "ACTIVE" }, data: { status: "UNDER_OFFER" } });
    if (reserved.count === 0) throw createError("Another tenant has just accepted an offer for this home.", 409, { code: "LISTING_HELD" });
    return tx.inquiry.update({
      where: { id },
      data: { status: "ACCEPTED", acceptedAt: now, paymentDueAt },
      include: inquiriesRepo.INQUIRY_DETAIL,
    });
  });

  await notify({
    userId: inquiry.landlordId,
    type: "SYSTEM",
    title: `${inquiry.tenant.firstName} accepted your offer`,
    body: `${inquiry.listing.property.title} is held for them until ${formatAppointment(paymentDueAt)} while they pay into escrow.`,
    link: threadLink(id),
    email: true,
  });
  return serialize(updated, userId);
}

export async function declineOffer(id: string, userId: string, reason?: string) {
  const { inquiry } = await loadForAction(id, userId, "declineOffer");
  const updated = await inquiriesRepo.updateInquiry(id, {
    status: "DECLINED",
    closedAt: new Date(),
    closedReason: reason ?? "Tenant declined the offer",
  });
  await notify({
    userId: inquiry.landlordId,
    type: "SYSTEM",
    title: `${inquiry.tenant.firstName} declined your offer`,
    body: reason ?? `${inquiry.listing.property.title} is still listed for other tenants.`,
    link: threadLink(id),
  });
  return serialize(updated, userId);
}
