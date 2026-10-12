// Time-based workflow rules, run every few minutes under a distributed lock so
// only one API instance does the work.

import { addDays, formatAppointment, RENTAL_RULES } from "@lettr/utils";
import { env } from "../config/env.js";
import { statusAfterOfferEnds } from "../domain/inquiryRules.js";
import { prisma } from "../lib/prisma.js";
import { getStore, withLock } from "../lib/redis.js";
import { notify } from "../services/notify.js";
import { releaseEscrow } from "../services/payments.service.js";

const INTERVAL_MS = 5 * 60 * 1000;
const MAX_RELEASE_ATTEMPTS = 5;

/** Offers nobody accepted in time go back to an open conversation. */
export async function lapseExpiredOffers(now = new Date()) {
  const lapsed = await prisma.inquiry.findMany({
    where: { status: "OFFER_MADE", offerExpiresAt: { lt: now } },
    include: { inspectionBooking: true, listing: { include: { property: true } } },
  });
  for (const inquiry of lapsed) {
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: {
        status: statusAfterOfferEnds(Boolean(inquiry.inspectionBooking?.isCompleted)),
        offerMadeAt: null,
        offerExpiresAt: null,
        offerNote: null,
      },
    });
    await Promise.all(
      [inquiry.tenantId, inquiry.landlordId].map((userId) =>
        notify({
          userId,
          type: "SYSTEM",
          title: "Offer lapsed",
          body: `The offer for ${inquiry.listing.property.title} wasn't accepted in time. The landlord can make a new one.`,
          link: `/messages/${inquiry.id}`,
        }),
      ),
    );
  }
  return lapsed.length;
}

/** Accepted offers that weren't paid for in time release the home to others. */
export async function lapseUnpaidAcceptances(now = new Date()) {
  const unpaid = await prisma.inquiry.findMany({
    where: { status: "ACCEPTED", paymentDueAt: { lt: now }, payments: { none: { status: { in: ["PROCESSING", "IN_ESCROW", "RELEASED"] } } } },
    include: { listing: { include: { property: true } } },
  });
  for (const inquiry of unpaid) {
    await prisma.$transaction([
      prisma.inquiry.update({
        where: { id: inquiry.id },
        data: { status: "EXPIRED", closedAt: now, closedReason: "Payment wasn't made in time" },
      }),
      prisma.payment.updateMany({ where: { inquiryId: inquiry.id, status: "PENDING" }, data: { status: "FAILED" } }),
      prisma.listing.updateMany({ where: { id: inquiry.listingId, status: "UNDER_OFFER" }, data: { status: "ACTIVE" } }),
    ]);
    await Promise.all([
      notify({
        userId: inquiry.tenantId,
        type: "PAYMENT_FAILED",
        title: "Your hold on this home has ended",
        body: `${inquiry.listing.property.title} was held for ${RENTAL_RULES.paymentWindowHours} hours but no payment arrived. It's listed again.`,
        link: `/listings/${inquiry.listingId}`,
        email: true,
      }),
      notify({
        userId: inquiry.landlordId,
        type: "SYSTEM",
        title: `${inquiry.listing.property.title} is live again`,
        body: "The tenant who accepted your offer didn't pay in time, so the home is back on the market.",
        link: "/landlord/listings",
        email: true,
      }),
    ]);
  }
  return unpaid.length;
}

/**
 * Release escrow when the handover period has passed without a dispute, and
 * retry payouts that failed after the tenant confirmed move-in.
 */
export async function releaseDueEscrow(now = new Date()) {
  const due = await prisma.payment.findMany({
    where: {
      status: "IN_ESCROW",
      releaseAttempts: { lt: MAX_RELEASE_ATTEMPTS },
      disputes: { none: { status: { in: ["OPEN", "UNDER_REVIEW"] } } },
      tenancyAgreement: {
        cancelledAt: null,
        tenantSignedAt: { not: null },
        landlordSignedAt: { not: null },
        OR: [{ autoReleaseAt: { lt: now } }, { moveInConfirmedAt: { not: null } }],
      },
    },
    select: { id: true, tenancyAgreement: { select: { moveInConfirmedAt: true } } },
  });
  let released = 0;
  for (const payment of due) {
    try {
      await releaseEscrow(payment.id, payment.tenancyAgreement?.moveInConfirmedAt ? "TENANT_CONFIRMED" : "AUTO");
      released += 1;
    } catch (error) {
      console.error(`Scheduled release failed for payment ${payment.id}:`, error instanceof Error ? error.message : error);
    }
  }
  return released;
}

/** Remind both parties a day before a confirmed inspection. Sent once per booking. */
export async function sendInspectionReminders(now = new Date()) {
  const bookings = await prisma.inspectionBooking.findMany({
    where: { isConfirmed: true, isCompleted: false, scheduledAt: { gt: now, lt: addDays(now, 1) } },
    include: { inquiry: { include: { listing: { include: { property: true } } } } },
  });
  let sent = 0;
  for (const booking of bookings) {
    const key = `reminder:inspection:${booking.id}:${booking.scheduledAt.toISOString()}`;
    if (!(await getStore().setIfAbsent(key, "1", 2 * 24 * 60 * 60))) continue;
    await Promise.all(
      [booking.inquiry.tenantId, booking.inquiry.landlordId].map((userId) =>
        notify({
          userId,
          type: "INSPECTION_REMINDER",
          title: "Inspection tomorrow",
          body: `${formatAppointment(booking.scheduledAt)} at ${booking.inquiry.listing.property.title}.`,
          link: `/messages/${booking.inquiryId}`,
          email: true,
        }),
      ),
    );
    sent += 1;
  }
  return sent;
}

/** Conversations with no activity for a month are closed. */
export async function expireStaleInquiries(now = new Date()) {
  const cutoff = addDays(now, -RENTAL_RULES.staleInquiryDays);
  const result = await prisma.inquiry.updateMany({
    where: { status: { in: ["OPEN", "RESPONDED", "INSPECTION_COMPLETED"] }, updatedAt: { lt: cutoff } },
    data: { status: "EXPIRED", closedAt: now, closedReason: `No activity for ${RENTAL_RULES.staleInquiryDays} days` },
  });
  return result.count;
}

export async function runScheduledTasks() {
  await withLock("scheduler", 4 * 60, async () => {
    const tasks = { lapseExpiredOffers, lapseUnpaidAcceptances, releaseDueEscrow, sendInspectionReminders, expireStaleInquiries };
    for (const [name, task] of Object.entries(tasks)) {
      try {
        const count = await task();
        if (count) console.info(`⏱  ${name}: ${count}`);
      } catch (error) {
        console.error(`Scheduled task ${name} failed:`, error);
      }
    }
  });
}

export function startScheduler(): () => void {
  if (!env.SCHEDULER_ENABLED || env.NODE_ENV === "test") return () => undefined;
  const timer = setInterval(() => void runScheduledTasks(), INTERVAL_MS);
  setTimeout(() => void runScheduledTasks(), 10_000);
  console.info("⏱  Scheduler running every 5 minutes");
  return () => clearInterval(timer);
}
