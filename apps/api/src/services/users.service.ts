// File: apps/api/src/services/users.service.ts
// Business logic for user profiles
// Uses users.repository for all Prisma queries

import { uploadToCloudinary } from "../lib/cloudinary.js";
import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import * as usersRepo from "../repositories/users.repository.js";

export async function getProfile(userId: string) {
  const user = await usersRepo.findUserById(userId);
  if (!user) throw createError("User not found", 404);
  return user;
}

export async function updateProfile(
  userId: string,
  data: Record<string, unknown>,
) {
  const { firstName, lastName, phone, tenantProfile, landlordProfile } =
    data as {
      firstName?: string;
      lastName?: string;
      phone?: string;
      tenantProfile?: Record<string, unknown>;
      landlordProfile?: Record<string, unknown>;
    };

  // Update nested profiles separately to keep queries clean
  if (tenantProfile) {
    await usersRepo.updateTenantProfile(userId, tenantProfile);
  }
  if (landlordProfile) {
    await usersRepo.updateLandlordProfile(userId, landlordProfile);
  }

  return usersRepo.updateUser(userId, {
    ...(firstName && { firstName }),
    ...(lastName && { lastName }),
    ...(phone && { phone }),
  });
}

export async function uploadAvatar(userId: string, file: Express.Multer.File) {
  const { url } = await uploadToCloudinary(file.buffer, "avatars");
  await usersRepo.updateUserAvatar(userId, url);
  return { avatarUrl: url };
}

export async function getScreeningProfile(
  userId: string,
  requesterId: string,
  requesterRole: UserRole,
) {
  if (requesterId !== userId && requesterRole !== "ADMIN") {
    if (requesterRole !== "LANDLORD") throw createError("Not authorised", 403);
    const relationship = await prisma.inquiry.findFirst({
      where: { tenantId: userId, landlordId: requesterId },
      select: { id: true },
    });
    if (!relationship) throw createError("Not authorised", 403);
  }
  const user = await usersRepo.getScreeningProfile(userId);
  if (!user) throw createError("User not found", 404);
  return user;
}
