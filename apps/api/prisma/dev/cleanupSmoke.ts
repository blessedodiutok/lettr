// Development only: remove the data created by an end-to-end smoke run.
//   tsx --env-file=.env prisma/dev/cleanupSmoke.ts <ids.json>
// The JSON lists the user, listing and property IDs the run created.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to run in production");

const { users, listings, properties } = JSON.parse(fs.readFileSync(process.argv[2], "utf8")) as {
  users: string[];
  listings: string[];
  properties: string[];
};
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// Only touch accounts the smoke run created.
const smokeUsers = await prisma.user.findMany({ where: { id: { in: users }, email: { startsWith: "smoke-" } }, select: { id: true } });
const userIds = smokeUsers.map((u) => u.id);
const payments = await prisma.payment.findMany({ where: { OR: [{ listingId: { in: listings } }, { tenantId: { in: userIds } }] }, select: { id: true } });
const paymentIds = payments.map((p) => p.id);
const disputes = await prisma.paymentDispute.findMany({ where: { paymentId: { in: paymentIds } }, select: { id: true } });
const documents = await prisma.verificationDocument.findMany({ where: { userId: { in: userIds } }, select: { id: true } });

await prisma.$transaction([
  prisma.adminAction.deleteMany({ where: { targetId: { in: [...userIds, ...listings, ...disputes.map((d) => d.id), ...documents.map((d) => d.id)] } } }),
  prisma.review.deleteMany({ where: { OR: [{ reviewerId: { in: userIds } }, { revieweeId: { in: userIds } }] } }),
  prisma.paymentDispute.deleteMany({ where: { paymentId: { in: paymentIds } } }),
  prisma.receipt.deleteMany({ where: { paymentId: { in: paymentIds } } }),
  prisma.payment.deleteMany({ where: { id: { in: paymentIds } } }),
  prisma.tenancyAgreement.deleteMany({ where: { OR: [{ listingId: { in: listings } }, { tenantId: { in: userIds } }] } }),
  prisma.inquiry.deleteMany({ where: { OR: [{ listingId: { in: listings } }, { tenantId: { in: userIds } }] } }),
  prisma.savedListing.deleteMany({ where: { OR: [{ listingId: { in: listings } }, { userId: { in: userIds } }] } }),
  prisma.listing.deleteMany({ where: { id: { in: listings } } }),
  prisma.property.deleteMany({ where: { id: { in: properties } } }),
  prisma.user.deleteMany({ where: { id: { in: userIds } } }),
]);
console.info(`Removed ${userIds.length} smoke users, ${listings.length} listings and ${paymentIds.length} payments`);
await prisma.$disconnect();
