// File: apps/api/src/repositories/auth.repository.ts
// All Prisma database queries related to authentication

import type { UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

interface CreateUserInput {
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserWithProfile(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      createdAt: true,
      landlordProfile: true,
      tenantProfile: true,
    },
  });
}

export async function createUser(input: CreateUserInput) {
  return prisma.user.create({
    data: {
      ...input,
      // Create the appropriate profile based on role
      landlordProfile: input.role === "LANDLORD" ? { create: {} } : undefined,
      tenantProfile: input.role === "TENANT" ? { create: {} } : undefined,
    },
  });
}

export async function markEmailVerified(id: string) {
  return prisma.user.update({
    where: { id },
    data: { isEmailVerified: true },
  });
}

export async function updateLastLogin(id: string) {
  return prisma.user.update({
    where: { id },
    data: { lastLoginAt: new Date() },
  });
}
