import type { DisputeStatus, ListingStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

export function getVerificationQueue() {
  return prisma.verificationDocument.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function reviewVerification(
  documentId: string,
  adminId: string,
  status: "VERIFIED" | "REJECTED",
  rejectionReason?: string,
) {
  const document = await prisma.verificationDocument.findUnique({ where: { id: documentId }, include: { user: true } });
  if (!document) throw createError("Verification document not found", 404);
  return prisma.$transaction(async (tx) => {
    const updated = await tx.verificationDocument.update({
      where: { id: documentId },
      data: { status, reviewedBy: adminId, reviewedAt: new Date(), rejectionReason: status === "REJECTED" ? rejectionReason : null },
    });
    if (document.user.role === "LANDLORD") {
      await tx.landlordProfile.update({
        where: { userId: document.userId },
        data: { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : null, rejectionReason: status === "REJECTED" ? rejectionReason : null },
      });
    }
    await tx.notification.create({
      data: {
        userId: document.userId,
        type: status === "VERIFIED" ? "VERIFICATION_APPROVED" : "VERIFICATION_REJECTED",
        title: status === "VERIFIED" ? "Verification approved" : "Verification rejected",
        body: status === "VERIFIED" ? "Your profile is now verified." : rejectionReason ?? "Your verification was rejected.",
      },
    });
    return updated;
  });
}

export function getDisputes() {
  return prisma.paymentDispute.findMany({ include: { payment: true, openedBy: true }, orderBy: { createdAt: "desc" } });
}

export function resolveDispute(id: string, adminId: string, status: Extract<DisputeStatus, "RESOLVED" | "REJECTED">, resolution: string) {
  return prisma.paymentDispute.update({ where: { id }, data: { status, resolution, resolvedById: adminId, resolvedAt: new Date() } });
}

export function moderateListing(id: string, status: Extract<ListingStatus, "ACTIVE" | "SUSPENDED" | "ARCHIVED">) {
  return prisma.listing.update({ where: { id }, data: { status } });
}

export function moderateUser(id: string, isActive: boolean) {
  return prisma.user.update({ where: { id }, data: { isActive } });
}
