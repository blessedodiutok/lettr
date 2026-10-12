// File: apps/api/src/repositories/users.repository.ts
// All Prisma queries for the users/profile domain

import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  role: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isActive: true,
  createdAt: true,
  landlordProfile: true,
  tenantProfile: true,
} satisfies Prisma.UserSelect;

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT,
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: PUBLIC_USER_SELECT,
  });
}

export async function updateUser(id: string, data: Prisma.UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
    select: PUBLIC_USER_SELECT,
  });
}

export async function updateUserAvatar(id: string, avatarUrl: string) {
  return prisma.user.update({
    where: { id },
    data: { avatarUrl },
    select: { id: true, avatarUrl: true },
  });
}

export async function updateLandlordProfile(
  userId: string,
  data: Prisma.LandlordProfileUpdateInput,
) {
  return prisma.landlordProfile.update({
    where: { userId },
    data,
  });
}

export async function updateTenantProfile(
  userId: string,
  data: Prisma.TenantProfileUpdateInput,
) {
  return prisma.tenantProfile.update({
    where: { userId },
    data,
  });
}

export async function getScreeningProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      createdAt: true,
      role: true,
      tenantProfile: true,
      reviewsReceived: {
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

export async function addFcmToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmTokens: true },
  });
  const tokens = new Set(user?.fcmTokens ?? []);
  tokens.add(token);
  return prisma.user.update({
    where: { id: userId },
    data: { fcmTokens: Array.from(tokens) },
    select: { id: true, fcmTokens: true },
  });
}

export async function removeFcmToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fcmTokens: true },
  });
  const tokens = new Set(user?.fcmTokens ?? []);
  tokens.delete(token);
  return prisma.user.update({
    where: { id: userId },
    data: { fcmTokens: Array.from(tokens) },
    select: { id: true, fcmTokens: true },
  });
}
