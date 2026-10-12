// File: apps/api/src/repositories/payments.repository.ts
// All Prisma queries for the payments domain

import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function createPayment(data: {
  listingId: string;
  tenantId: string;
  annualRent: number;
  cautionFee: number;
  platformFee: number;
  agentFeeSaved: number;
  totalAmount: number;
}) {
  return prisma.payment.create({ data });
}

export async function findPaymentById(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: { receipt: true, tenancyAgreement: true },
  });
}

export async function findPaymentsByUser(userId: string) {
  return prisma.payment.findMany({
    where: { tenantId: userId },
    include: {
      listing: {
        include: {
          property: {
            include: { photos: { where: { isCover: true }, take: 1 } },
          },
        },
      },
      receipt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePayment(
  id: string,
  data: Prisma.PaymentUpdateInput,
) {
  return prisma.payment.update({ where: { id }, data });
}

export async function createReceipt(data: {
  paymentId: string;
  receiptNumber: string;
}) {
  return prisma.receipt.create({ data: { ...data, issuedAt: new Date() } });
}

export async function countPayments(): Promise<number> {
  return prisma.payment.count({ where: { status: { not: "PENDING" } } });
}
