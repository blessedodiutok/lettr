// Admin console: verification, moderation, disputes, payments and the audit log.
// Every change an admin makes is written to admin_actions.

import type { DisputeStatus, ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { revokeAllSessions } from "../lib/sessions.js";
import { privateFileAccess } from "../lib/storage.js";
import { invalidateAccountCache } from "../middleware/auth.js";
import { createError } from "../middleware/errorHandler.js";
import { notify } from "./notify.js";
import * as paymentsService from "./payments.service.js";

interface ListQuery {
  q?: string;
  status?: string;
  page: number;
  limit: number;
}

const page = (query: ListQuery) => ({ skip: (query.page - 1) * query.limit, take: query.limit });
const paginated = <T>(items: T[], total: number, query: ListQuery) => ({
  items,
  pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
});
const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });

function audit(
  tx: Prisma.TransactionClient,
  adminId: string,
  action: string,
  target: { type: string; id: string },
  reason?: string,
  metadata?: Prisma.InputJsonValue,
) {
  return tx.adminAction.create({ data: { adminId, action, targetType: target.type, targetId: target.id, reason, metadata } });
}

// ── Overview ──────────────────────────────────────────────────────────────

export async function getOverview() {
  const [users, listings, verifications, disputes, escrow, payoutIssues, released] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.listing.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.verificationDocument.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.paymentDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.payment.aggregate({ where: { status: "IN_ESCROW" }, _sum: { totalAmount: true }, _count: { _all: true } }),
    prisma.payment.count({ where: { releaseError: { not: null } } }),
    prisma.payment.aggregate({ where: { status: "RELEASED" }, _sum: { totalAmount: true, platformFee: true }, _count: { _all: true } }),
  ]);
  return {
    users: Object.fromEntries(users.map((row) => [row.role, row._count._all])),
    listings: Object.fromEntries(listings.map((row) => [row.status, row._count._all])),
    pendingVerifications: verifications,
    openDisputes: disputes,
    escrow: { count: escrow._count._all, total: escrow._sum.totalAmount?.toNumber() ?? 0 },
    payoutIssues,
    released: {
      count: released._count._all,
      total: released._sum.totalAmount?.toNumber() ?? 0,
      platformFees: released._sum.platformFee?.toNumber() ?? 0,
    },
  };
}

// ── Verification ──────────────────────────────────────────────────────────

export function getVerificationQueue() {
  return prisma.verificationDocument.findMany({
    where: { status: "PENDING_REVIEW" },
    select: {
      id: true,
      documentType: true,
      documentNumber: true,
      createdAt: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Access to a private identity document, logged in the audit trail. */
export async function getVerificationDocumentAccess(documentId: string, adminId: string) {
  const document = await prisma.verificationDocument.findUnique({ where: { id: documentId } });
  if (!document) throw createError("Document not found.", 404);
  await audit(prisma, adminId, "VERIFICATION_DOCUMENT_VIEWED", { type: "VERIFICATION", id: documentId });
  return privateFileAccess(document.publicId);
}

export async function reviewVerification(documentId: string, adminId: string, status: "VERIFIED" | "REJECTED", rejectionReason?: string) {
  const document = await prisma.verificationDocument.findUnique({ where: { id: documentId }, include: { user: true } });
  if (!document) throw createError("Document not found.", 404);
  if (document.status !== "PENDING_REVIEW") throw createError("This document has already been reviewed.", 409);

  const updated = await prisma.$transaction(async (tx) => {
    const reviewed = await tx.verificationDocument.update({
      where: { id: documentId },
      data: { status, reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: status === "REJECTED" ? rejectionReason : null },
      select: { id: true, status: true, reviewedAt: true },
    });
    if (document.user.role === "LANDLORD") {
      await tx.landlordProfile.update({
        where: { userId: document.userId },
        data: {
          verificationStatus: status,
          verifiedAt: status === "VERIFIED" ? new Date() : null,
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
        },
      });
    }
    await audit(tx, adminId, status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED", { type: "VERIFICATION", id: documentId }, rejectionReason);
    return reviewed;
  });

  await notify({
    userId: document.userId,
    type: status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
    title: status === "VERIFIED" ? "You're verified" : "We couldn't verify your document",
    body:
      status === "VERIFIED"
        ? "Your listings now show the ID-verified badge."
        : `${rejectionReason ?? "Please upload a clearer document."} You can upload another document from your verification page.`,
    link: "/landlord/verification",
    email: true,
  });
  return updated;
}

// ── Users ─────────────────────────────────────────────────────────────────

export async function listUsers(query: ListQuery) {
  const where: Prisma.UserWhereInput = {
    ...(query.status && ["LANDLORD", "TENANT", "ADMIN"].includes(query.status) && { role: query.status as "LANDLORD" | "TENANT" | "ADMIN" }),
    ...(query.status === "SUSPENDED" && { isActive: false }),
    ...(query.q && { OR: [{ email: contains(query.q) }, { firstName: contains(query.q) }, { lastName: contains(query.q) }, { phone: contains(query.q) }] }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        landlordProfile: { select: { verificationStatus: true, totalRentalsCompleted: true } },
      },
      orderBy: { createdAt: "desc" },
      ...page(query),
    }),
    prisma.user.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function moderateUser(id: string, adminId: string, isActive: boolean, reason: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw createError("User not found.", 404);
  if (user.role === "ADMIN") throw createError("Admin accounts can't be suspended here.", 409);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({ where: { id }, data: { isActive }, select: { id: true, isActive: true } });
    if (!isActive) await tx.listing.updateMany({ where: { landlordId: id, status: "ACTIVE" }, data: { status: "SUSPENDED" } });
    await audit(tx, adminId, isActive ? "USER_REINSTATED" : "USER_SUSPENDED", { type: "USER", id }, reason);
    return result;
  });
  invalidateAccountCache(id);
  if (!isActive) await revokeAllSessions(id);
  return updated;
}

// ── Listings ──────────────────────────────────────────────────────────────

export async function listListings(query: ListQuery) {
  const where: Prisma.ListingWhereInput = {
    ...(query.status && { status: query.status as ListingStatus }),
    ...(query.q && {
      OR: [
        { property: { title: contains(query.q) } },
        { property: { neighbourhood: contains(query.q) } },
        { landlord: { email: contains(query.q) } },
      ],
    }),
  };
  const [items, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      select: {
        id: true,
        status: true,
        annualRent: true,
        viewCount: true,
        publishedAt: true,
        createdAt: true,
        property: { select: { title: true, neighbourhood: true, state: true, photos: { where: { isCover: true }, take: 1, select: { url: true } } } },
        landlord: { select: { id: true, firstName: true, lastName: true, email: true, landlordProfile: { select: { verificationStatus: true } } } },
        _count: { select: { inquiries: true } },
      },
      orderBy: { createdAt: "desc" },
      ...page(query),
    }),
    prisma.listing.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function moderateListing(id: string, adminId: string, status: Extract<ListingStatus, "ACTIVE" | "SUSPENDED" | "ARCHIVED">, reason: string) {
  const listing = await prisma.listing.findUnique({ where: { id }, include: { property: true } });
  if (!listing) throw createError("Listing not found.", 404);
  if (listing.status === "UNDER_OFFER" || listing.status === "TAKEN") {
    throw createError("A tenant is committed to this home. Resolve the payment first.", 409);
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.listing.update({ where: { id }, data: { status }, select: { id: true, status: true } });
    await audit(tx, adminId, `LISTING_${status}`, { type: "LISTING", id }, reason);
    return result;
  });
  await notify({
    userId: listing.landlordId,
    type: "SYSTEM",
    title: status === "SUSPENDED" ? `${listing.property.title} was suspended` : `${listing.property.title} was updated by Lettr`,
    body: reason,
    link: "/landlord/listings",
    email: true,
  });
  return updated;
}

// ── Disputes ──────────────────────────────────────────────────────────────

export function getDisputes(status?: string) {
  return prisma.paymentDispute.findMany({
    where: status ? { status: status as DisputeStatus } : undefined,
    include: {
      openedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      payment: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          tenancyAgreementId: true,
          tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
          listing: { select: { id: true, property: { select: { title: true } }, landlord: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function resolveDispute(
  id: string,
  adminId: string,
  input: { status: "RESOLVED" | "REJECTED"; outcome: "REFUND_TENANT" | "RELEASE_TO_LANDLORD" | "NO_ACTION"; resolution: string },
) {
  const dispute = await prisma.paymentDispute.findUnique({ where: { id }, include: { payment: { include: { listing: true } } } });
  if (!dispute) throw createError("Dispute not found.", 404);
  if (dispute.status === "RESOLVED" || dispute.status === "REJECTED") throw createError("This dispute is already closed.", 409);

  // Move the money first, so a failure leaves the dispute open to retry.
  if (input.outcome === "REFUND_TENANT") {
    await paymentsService.refundPayment(dispute.paymentId, { reason: `Dispute resolved: ${input.resolution}`, actorId: adminId });
  } else if (input.outcome === "RELEASE_TO_LANDLORD") {
    await paymentsService.releaseEscrow(dispute.paymentId, "ADMIN", { ignoreDisputeId: id });
  }

  const resolved = await prisma.$transaction(async (tx) => {
    const result = await tx.paymentDispute.update({
      where: { id },
      data: { status: input.status, outcome: input.outcome, resolution: input.resolution, resolvedById: adminId, resolvedAt: new Date() },
    });
    await audit(tx, adminId, "DISPUTE_RESOLVED", { type: "DISPUTE", id }, input.resolution, { outcome: input.outcome });
    return result;
  });

  const outcomeText = {
    REFUND_TENANT: "The tenant is being refunded.",
    RELEASE_TO_LANDLORD: "The payout to the landlord has been released.",
    NO_ACTION: "No money has moved.",
  }[input.outcome];
  await Promise.all(
    [dispute.payment.tenantId, dispute.payment.listing.landlordId].map((userId) =>
      notify({ userId, type: "SYSTEM", title: "Dispute resolved", body: `${input.resolution} ${outcomeText}`, link: "/notifications", email: true }),
    ),
  );
  return resolved;
}

// ── Payments and audit log ────────────────────────────────────────────────

export async function listPayments(query: ListQuery) {
  const where: Prisma.PaymentWhereInput =
    query.status === "ISSUES"
      ? { releaseError: { not: null } }
      : query.status
        ? { status: query.status as Prisma.EnumPaymentStatusFilter["equals"] }
        : {};
  const [items, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        platformFee: true,
        createdAt: true,
        escrowReleasedAt: true,
        refundedAt: true,
        releaseError: true,
        releaseAttempts: true,
        transferReference: true,
        receipt: { select: { receiptNumber: true } },
        tenant: { select: { firstName: true, lastName: true, email: true } },
        listing: { select: { id: true, property: { select: { title: true } }, landlord: { select: { firstName: true, lastName: true } } } },
        tenancyAgreement: { select: { id: true, autoReleaseAt: true, isHandoverConfirmed: true } },
      },
      orderBy: { createdAt: "desc" },
      ...page(query),
    }),
    prisma.payment.count({ where }),
  ]);
  return paginated(items, total, query);
}

export async function listAuditLog(query: ListQuery) {
  const [items, total] = await prisma.$transaction([
    prisma.adminAction.findMany({
      include: { admin: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      ...page(query),
    }),
    prisma.adminAction.count(),
  ]);
  return paginated(items, total, query);
}
