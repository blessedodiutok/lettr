// Tenancy agreements: signing, handover, move-in confirmation and cancellation.
// Agreements are created by the payment processor when rent reaches escrow.

import { addDays, formatAppointment, RENTAL_RULES } from "@lettr/utils";
import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import * as tenancyRepo from "../repositories/tenancy.repository.js";
import { notify } from "./notify.js";
import * as paymentsService from "./payments.service.js";

type Agreement = NonNullable<Awaited<ReturnType<typeof tenancyRepo.findTenancyById>>>;

function partyOf(agreement: { tenantId: string; landlordId: string }, userId: string, role: UserRole) {
  if (agreement.tenantId === userId) return "TENANT" as const;
  if (agreement.landlordId === userId) return "LANDLORD" as const;
  if (role === "ADMIN") return "ADMIN" as const;
  throw createError("You don't have access to this tenancy.", 403);
}

function escrowPayment(agreement: Agreement) {
  return agreement.payments.find((payment) => ["IN_ESCROW", "RELEASED", "PROCESSING"].includes(payment.status)) ?? agreement.payments[0] ?? null;
}

/** What the viewer can do next — clients render actions from this. */
function availableActions(agreement: Agreement, party: "TENANT" | "LANDLORD" | "ADMIN") {
  const payment = escrowPayment(agreement);
  const inEscrow = payment?.status === "IN_ESCROW";
  const bothSigned = Boolean(agreement.tenantSignedAt && agreement.landlordSignedAt);
  const open = !agreement.cancelledAt && !agreement.isHandoverConfirmed;
  const openDispute = payment?.disputes.some((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW") ?? false;
  const actions: string[] = [];
  if (!open || party === "ADMIN") return actions;

  if (party === "TENANT" && !agreement.tenantSignedAt && inEscrow) actions.push("sign");
  if (party === "LANDLORD" && !agreement.landlordSignedAt && inEscrow) actions.push("sign");
  if (party === "LANDLORD" && bothSigned && inEscrow && !agreement.handoverMarkedAt) actions.push("markHandover");
  if (party === "TENANT" && bothSigned && inEscrow && !agreement.moveInConfirmedAt && !openDispute) actions.push("confirmMoveIn");
  if (inEscrow && !openDispute) actions.push("dispute");
  if (party === "TENANT" && inEscrow && canTenantCancel(agreement, payment?.createdAt ?? null)) actions.push("cancel");
  return actions;
}

function landlordSignDeadline(paidAt: Date) {
  return addDays(paidAt, RENTAL_RULES.landlordSignDays);
}

function canTenantCancel(agreement: Agreement, paidAt: Date | null) {
  return Boolean(paidAt && !agreement.landlordSignedAt && landlordSignDeadline(paidAt) < new Date());
}

function serialize(agreement: Agreement, userId: string, role: UserRole) {
  const party = partyOf(agreement, userId, role);
  const payment = escrowPayment(agreement);
  return {
    ...agreement,
    viewerRole: party,
    payment,
    landlordSignDeadline: payment && !agreement.landlordSignedAt ? landlordSignDeadline(payment.createdAt) : null,
    availableActions: availableActions(agreement, party),
  };
}

async function load(id: string) {
  const agreement = await tenancyRepo.findTenancyById(id);
  if (!agreement) throw createError("Tenancy not found.", 404);
  return agreement;
}

export async function getMyTenancies(userId: string, role: UserRole) {
  if (role === "ADMIN") throw createError("Use the admin view.", 403);
  return tenancyRepo.findTenanciesByUser(userId, role);
}

export async function getAgreement(id: string, userId: string, role: UserRole) {
  return serialize(await load(id), userId, role);
}

export async function signAgreement(id: string, userId: string, role: UserRole) {
  const agreement = await load(id);
  const party = partyOf(agreement, userId, role);
  if (party === "ADMIN") throw createError("Admins can't sign tenancy agreements.", 403);
  if (!availableActions(agreement, party).includes("sign")) throw createError("This agreement can't be signed right now.", 409);

  await tenancyRepo.signTenancy(id, party);
  const updated = await load(id);
  const bothSigned = Boolean(updated.tenantSignedAt && updated.landlordSignedAt);
  const title = updated.listing.property.title;

  if (bothSigned) {
    await Promise.all([
      notify({
        userId: updated.landlordId,
        type: "AGREEMENT_SIGNED",
        title: "Agreement signed by both of you",
        body: `Hand over the keys for ${title}, then mark the handover on Lettr.`,
        link: `/tenancies/${id}`,
        email: true,
      }),
      notify({
        userId: updated.tenantId,
        type: "AGREEMENT_SIGNED",
        title: "Agreement signed by both of you",
        body: `Arrange to collect the keys for ${title}. Confirm on Lettr once you have them.`,
        link: `/tenancies/${id}`,
        email: true,
      }),
    ]);
  } else {
    const signer = party === "TENANT" ? updated.tenant : updated.landlord;
    await notify({
      userId: party === "TENANT" ? updated.landlordId : updated.tenantId,
      type: "AGREEMENT_READY",
      title: `${signer.firstName} signed the agreement`,
      body: `Your signature is the last one needed for ${title}.`,
      link: `/tenancies/${id}`,
      email: true,
      actionLabel: "Review and sign",
    });
  }
  return serialize(updated, userId, role);
}

export async function markHandover(id: string, userId: string, role: UserRole) {
  const agreement = await load(id);
  const party = partyOf(agreement, userId, role);
  if (party !== "LANDLORD" || !availableActions(agreement, party).includes("markHandover")) {
    throw createError("Handover can be marked by the landlord once both of you have signed.", 409);
  }
  const now = new Date();
  const start = agreement.tenancyStartDate && agreement.tenancyStartDate > now ? agreement.tenancyStartDate : now;
  const autoReleaseAt = addDays(start, RENTAL_RULES.autoReleaseDays);
  await prisma.tenancyAgreement.update({ where: { id }, data: { handoverMarkedAt: now, autoReleaseAt } });

  await notify({
    userId: agreement.tenantId,
    type: "HANDOVER_CONFIRMED",
    title: "Do you have the keys?",
    body: `${agreement.landlord.firstName} says the keys to ${agreement.listing.property.title} were handed over. Confirm on Lettr, or raise a dispute if something's wrong. Otherwise escrow releases on ${formatAppointment(autoReleaseAt)}.`,
    link: `/tenancies/${id}`,
    email: true,
    actionLabel: "Confirm move-in",
  });
  return serialize(await load(id), userId, role);
}

export async function confirmMoveIn(id: string, userId: string, role: UserRole) {
  const agreement = await load(id);
  const party = partyOf(agreement, userId, role);
  if (party !== "TENANT" || !availableActions(agreement, party).includes("confirmMoveIn")) {
    throw createError("You can confirm move-in once both of you have signed.", 409);
  }
  const now = new Date();
  await prisma.tenancyAgreement.update({
    where: { id },
    data: { moveInConfirmedAt: now, handoverMarkedAt: agreement.handoverMarkedAt ?? now },
  });

  const payment = escrowPayment(agreement);
  if (payment) {
    try {
      await paymentsService.releaseEscrow(payment.id, "TENANT_CONFIRMED");
    } catch (error) {
      // Recorded on the payment; the scheduler retries the payout.
      console.error(`Release after move-in failed for payment ${payment.id}:`, error);
    }
  }
  return serialize(await load(id), userId, role);
}

export async function cancelTenancy(id: string, userId: string, role: UserRole, reason: string) {
  const agreement = await load(id);
  const party = partyOf(agreement, userId, role);
  if (party !== "TENANT" || !availableActions(agreement, party).includes("cancel")) {
    throw createError(
      `You can cancel for a full refund if the landlord hasn't signed within ${RENTAL_RULES.landlordSignDays} days of your payment.`,
      409,
    );
  }
  const payment = escrowPayment(agreement)!;
  await paymentsService.refundPayment(payment.id, { reason: `The landlord didn't sign in time. ${reason}` });
  await notify({
    userId: agreement.landlordId,
    type: "SYSTEM",
    title: "Tenancy cancelled",
    body: `${agreement.tenant.firstName} cancelled because the agreement for ${agreement.listing.property.title} wasn't signed in time. The listing is active again.`,
    link: `/landlord/listings`,
    email: true,
  });
  return serialize(await load(id), userId, role);
}
