// Profiles, avatars, bank accounts and public landlord pages.

import { calculateMoveInCost } from "@lettr/utils";
import type { Prisma, UserRole } from "@prisma/client";
import { listBanks, resolveAccount } from "../lib/paystack.js";
import { prisma } from "../lib/prisma.js";
import { deleteStoredFile, storePublicImage } from "../lib/storage.js";
import { createError } from "../middleware/errorHandler.js";
import { LISTING_INCLUDE } from "../repositories/listings.repository.js";
import * as usersRepo from "../repositories/users.repository.js";

/** Show only the last four digits of an account number. */
function maskAccount<T extends { landlordProfile: { bankAccountNumber: string | null } | null }>(user: T): T {
  if (!user.landlordProfile?.bankAccountNumber) return user;
  return {
    ...user,
    landlordProfile: { ...user.landlordProfile, bankAccountNumber: `••••••${user.landlordProfile.bankAccountNumber.slice(-4)}` },
  };
}

export async function getProfile(userId: string) {
  const user = await usersRepo.findUserById(userId);
  if (!user) throw createError("Account not found.", 404);
  return maskAccount(user);
}

export async function updateProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    tenantProfile?: Prisma.TenantProfileUpdateInput;
    landlordProfile?: Prisma.LandlordProfileUpdateInput;
  },
) {
  const { firstName, lastName, phone, tenantProfile, landlordProfile } = data;
  if (phone) {
    const taken = await prisma.user.findFirst({ where: { phone, id: { not: userId } }, select: { id: true } });
    if (taken) throw createError("That phone number is used by another account.", 409);
  }
  if (tenantProfile) await prisma.tenantProfile.upsert({ where: { userId }, create: { userId, ...(tenantProfile as object) }, update: tenantProfile });
  if (landlordProfile) await usersRepo.updateLandlordProfile(userId, landlordProfile);
  const user = await usersRepo.updateUser(userId, {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone !== undefined && { phone: phone || null }),
  });
  return maskAccount(user);
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  const previous = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });
  const { url } = await storePublicImage(file.buffer, "avatars", file.mimetype);
  await usersRepo.updateUserAvatar(userId, url);
  if (previous?.avatarUrl?.startsWith("/api/media/")) {
    await deleteStoredFile(`local:public/${previous.avatarUrl.slice("/api/media/".length)}`);
  }
  return { avatarUrl: url };
}

export function getBanks() {
  return listBanks();
}

/** Save a landlord's payout account after Paystack confirms the account name. */
export async function setBankAccount(userId: string, input: { bankCode: string; accountNumber: string }) {
  const banks = await listBanks();
  const bank = banks.find((b) => b.code === input.bankCode);
  if (!bank) throw createError("Choose a bank from the list.", 400);
  const { accountName } = await resolveAccount(input.accountNumber, input.bankCode);
  const profile = await prisma.landlordProfile.update({
    where: { userId },
    data: {
      bankCode: bank.code,
      bankName: bank.name,
      bankAccountNumber: input.accountNumber,
      bankAccountName: accountName,
      bankAccountVerifiedAt: new Date(),
    },
    select: { bankName: true, bankAccountName: true, bankAccountNumber: true, bankAccountVerifiedAt: true },
  });
  return { ...profile, bankAccountNumber: `••••••${input.accountNumber.slice(-4)}` };
}

/** Tenant details a landlord sees once the tenant has contacted them. */
export async function getScreeningProfile(userId: string, requesterId: string, requesterRole: UserRole) {
  if (requesterId !== userId && requesterRole !== "ADMIN") {
    if (requesterRole !== "LANDLORD") throw createError("You don't have access to this profile.", 403);
    const relationship = await prisma.inquiry.findFirst({ where: { tenantId: userId, landlordId: requesterId }, select: { id: true } });
    if (!relationship) throw createError("You can see a tenant's profile once they contact you.", 403);
  }
  const user = await usersRepo.getScreeningProfile(userId);
  if (!user) throw createError("Account not found.", 404);
  return user;
}

/** Public page for a landlord: verification, track record, reviews and live homes. */
export async function getPublicLandlord(landlordId: string) {
  const landlord = await prisma.user.findFirst({
    where: { id: landlordId, role: "LANDLORD", isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      createdAt: true,
      landlordProfile: {
        select: { businessName: true, bio: true, verificationStatus: true, averageRating: true, totalReviews: true, totalRentalsCompleted: true },
      },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          createdAt: true,
          isVerified: true,
          reviewer: { select: { firstName: true, lastName: true, avatarUrl: true } },
        },
      },
      listings: { where: { status: "ACTIVE" }, include: LISTING_INCLUDE, orderBy: { publishedAt: "desc" }, take: 12 },
    },
  });
  if (!landlord) throw createError("Landlord not found.", 404);
  return {
    ...landlord,
    listings: landlord.listings.map((listing) => ({
      ...listing,
      property: { ...listing.property, address: "" },
      moveInCost: calculateMoveInCost({
        annualRent: listing.annualRent.toNumber(),
        cautionFee: listing.cautionFee.toNumber(),
        serviceCharge: listing.serviceCharge.toNumber(),
        legalFee: listing.legalFee.toNumber(),
      }),
    })),
  };
}
