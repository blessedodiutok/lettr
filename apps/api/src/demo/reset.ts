// Fills the demo database and resets it. Journeys are staged through the real
// services, so every seeded state is one the rental workflow can actually reach.

import { addDays } from "@lettr/utils";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import type { PostgresStore } from "../lib/postgresStore.js";
import { getStore, withLock } from "../lib/redis.js";
import { createDispute, initiatePayment, simulateSuccess } from "../services/payments.service.js";
import { acceptOffer, createInquiry, makeOffer, scheduleInspection, sendMessage } from "../services/inquiries.service.js";
import { flushNotifications } from "../services/notify.js";
import { confirmMoveIn, markHandover, signAgreement } from "../services/tenancy.service.js";
import { sampleListingId, SAMPLE_IDS, seedSampleData } from "./sampleData.js";
import { DEMO_DOCUMENT_ID } from "./samplePhotos.js";

const { admin: ADMIN_ID, emeka, amaka, tunde, ngozi, chidi } = SAMPLE_IDS;

/** Marks a database as the demo's own. Reset refuses to wipe one without it. */
const DEMO_MARKER = "demo:database";
const RESET_THROTTLE = "demo:reset-throttle";
const RESET_LOCK = "demo-reset";
const RESET_COOLDOWN_SECONDS = 10 * 60;

export const DEMO_ACCOUNTS = {
  tenant: "tunde@lettr-test.com",
  landlord: "emeka@lettr-test.com",
  admin: "admin@lettr-test.com",
} as const;

async function startConversation(listingIndex: number, tenantId: string, landlordId: string, opening: string, reply?: string) {
  const inquiry = await createInquiry({ listingId: sampleListingId(listingIndex), message: opening }, tenantId);
  if (reply) await sendMessage(inquiry.id, reply, landlordId);
  return inquiry.id;
}

/** From conversation to money in escrow. Returns the payment and its agreement. */
async function payForListing(listingIndex: number, tenantId: string, landlordId: string, opening: string) {
  const inquiryId = await startConversation(listingIndex, tenantId, landlordId, opening, "Thanks for reaching out. The home is available, and I'm happy to make you an offer.");
  await makeOffer(inquiryId, landlordId, "The rent and fees are as listed.");
  await acceptOffer(inquiryId, tenantId);
  const { paymentId } = await initiatePayment({ listingId: sampleListingId(listingIndex) }, tenantId);
  await simulateSuccess(paymentId, tenantId);
  const agreement = await prisma.tenancyAgreement.findFirstOrThrow({ where: { payments: { some: { id: paymentId } } } });
  return { paymentId, agreementId: agreement.id };
}

/**
 * One rental waiting at each stage, so every demo account has something to do
 * straight away. Listing numbers refer to the order in sampleData.ts.
 */
async function stageJourneys() {
  // Tunde (tenant): an offer to accept, which leads on to paying and signing.
  const offerId = await startConversation(
    0,
    tunde,
    emeka,
    "Good afternoon. I'm relocating to Lekki for work in January and this flat looks right for my family. Is it still available?",
    "Good afternoon Tunde. Yes, it's available. Lekki Phase 1 is quiet and the estate has 24-hour security.",
  );
  await sendMessage(offerId, "That's great. I've seen the photos and the breakdown, and I'm ready to go ahead.", tunde);
  await makeOffer(offerId, emeka, "Happy to rent to you. The rent and fees are exactly as listed.");

  // Tunde: keys handed over, waiting for Tunde to confirm move-in. Confirming pays the landlord.
  const handover = await payForListing(1, tunde, emeka, "Hello, I'd like to rent this flat in Ikeja GRA. It's close to my office and the price works for me.");
  await signAgreement(handover.agreementId, tunde, "TENANT");
  await signAgreement(handover.agreementId, emeka, "LANDLORD");
  await markHandover(handover.agreementId, emeka, "LANDLORD");

  // Tunde: the landlord has proposed an inspection for Tunde to confirm.
  const inspectionId = await startConversation(6, tunde, amaka, "Hello Amaka, I'd like to view this flat in Maitama when I'm next in Abuja. Which days suit you?", "Hello Tunde. Saturday morning works well for me.");
  const saturdayish = addDays(new Date(), 4);
  saturdayish.setUTCHours(9, 0, 0, 0);
  await scheduleInspection(inspectionId, { scheduledAt: saturdayish.toISOString(), notes: "Please call when you reach the estate gate." }, amaka);

  // Emeka (landlord): a tenant has paid and signed, waiting for Emeka's signature and then handover.
  const toSign = await payForListing(2, ngozi, emeka, "Good morning. I'm a postgraduate student at UNILAG and this studio in Yaba is ideal. May I rent it?");
  await signAgreement(toSign.agreementId, ngozi, "TENANT");

  // Emeka: a new enquiry to answer, with the option to book an inspection and make an offer.
  await startConversation(3, chidi, emeka, "Good evening Mr Okonkwo. My family is moving back from Houston and we're looking at Banana Island. Could we arrange a viewing next week?");

  // Emeka: a completed rental, so payouts, receipts and reviews have history.
  const completed = await payForListing(4, ngozi, emeka, "Hello, my sister is starting work in Surulere and this mini flat suits her well. May we go ahead?");
  await signAgreement(completed.agreementId, ngozi, "TENANT");
  await signAgreement(completed.agreementId, emeka, "LANDLORD");
  await markHandover(completed.agreementId, emeka, "LANDLORD");
  await confirmMoveIn(completed.agreementId, ngozi, "TENANT");
  await prisma.review.create({
    data: {
      listingId: sampleListingId(4),
      reviewerId: ngozi,
      revieweeId: emeka,
      rating: 5,
      title: "Smooth from first message to move-in",
      body: "Emeka replied within the hour and the flat matched the photos. Knowing the rent stayed in escrow until we had the keys made the whole process easy.",
      isVerified: true,
    },
  });

  // Admin: a dispute to resolve while the money stays in escrow.
  const disputed = await payForListing(9, ngozi, amaka, "Hello, I start at UNIPORT next month and need somewhere nearby. Is this still available?");
  await signAgreement(disputed.agreementId, ngozi, "TENANT");
  await signAgreement(disputed.agreementId, amaka, "LANDLORD");
  await markHandover(disputed.agreementId, amaka, "LANDLORD");
  await createDispute(disputed.paymentId, ngozi, "The water heater shown in the listing isn't installed, and the landlord hasn't replied to my messages about it.");

  // Admin: a landlord waiting for ID verification.
  await prisma.user.create({
    data: {
      id: "demo-landlord-bola",
      email: "bola@lettr-test.com",
      phone: "+2348039876543",
      passwordHash: (await prisma.user.findUniqueOrThrow({ where: { id: ADMIN_ID }, select: { passwordHash: true } })).passwordHash,
      role: "LANDLORD",
      firstName: "Bola",
      lastName: "Adeyemi",
      isEmailVerified: true,
      landlordProfile: { create: { bio: "New to Lettr, with two flats in Surulere.", verificationStatus: "PENDING_REVIEW" } },
      verificationDocs: {
        create: { documentType: "NIN", documentNumber: "00000000000", documentUrl: DEMO_DOCUMENT_ID, publicId: DEMO_DOCUMENT_ID },
      },
    },
  });
}

async function fill() {
  await seedSampleData(prisma);
  await prisma.$executeRaw`ALTER SEQUENCE receipt_number_seq RESTART WITH 1`;
  await stageJourneys();
  await flushNotifications();
  await getStore().set(DEMO_MARKER, new Date().toISOString());
}

function assertDemo() {
  if (!env.DEMO_MODE) throw new Error("Demo data can only be written when DEMO_MODE is on");
}

/** First deploy: fill an empty database. Leaves a database that has anything in it alone. */
export async function seedIfEmpty(): Promise<"seeded" | "already-seeded"> {
  assertDemo();
  if ((await prisma.user.count()) > 0) return "already-seeded";
  await fill();
  return "seeded";
}

/**
 * Put the demo back to its starting state. Everyone is signed out. The marker
 * survives, so a reset that fails halfway can simply be run again.
 * Returns false if another reset is already running.
 */
export async function resetDemo(): Promise<boolean> {
  assertDemo();
  const store = getStore() as PostgresStore;
  const isDemoDatabase = Boolean(await store.get(DEMO_MARKER));
  if (!isDemoDatabase && (await prisma.user.count()) > 0) {
    throw new Error("Refusing to reset: this database has data and wasn't created by the demo. Point DATABASE_URL at the demo's own database.");
  }
  return withLock(RESET_LOCK, 120, async () => {
    await store.clear([DEMO_MARKER, `lock:${RESET_LOCK}`]);
    await fill();
  });
}

/** Reset on a visitor's request, at most once per cooldown. Returns false when throttled. */
export async function resetDemoThrottled(): Promise<boolean> {
  if (!(await getStore().setIfAbsent(RESET_THROTTLE, "1", RESET_COOLDOWN_SECONDS))) return false;
  const finished = await resetDemo();
  // The reset emptied the store, so the cooldown starts again from here.
  await getStore().set(RESET_THROTTLE, "1", RESET_COOLDOWN_SECONDS);
  return finished;
}

