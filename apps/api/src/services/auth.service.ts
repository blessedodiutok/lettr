// File: apps/api/src/services/auth.service.ts
// Business logic for authentication: hashing, OTP generation/verification,
// token signing, and token rotation

import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  generateOtp,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { otpEmailHtml, sendEmail, welcomeEmailHtml } from "../lib/mailer.js";
import {
  deleteOtp,
  deleteRefreshToken,
  getOtp,
  getRefreshToken,
  setOtp,
  setRefreshToken,
} from "../lib/redis.js";
import { createError } from "../middleware/errorHandler.js";
import * as authRepo from "../repositories/auth.repository.js";

interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface VerifyOtpInput {
  userId: string;
  otp: string;
}

function buildTokens(user: {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}) {
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: 1 });
  return { accessToken, refreshToken };
}

export async function signup(input: SignupInput) {
  const existing = await authRepo.findUserByEmail(input.email);
  if (existing) {
    throw createError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await authRepo.createUser({
    email: input.email.toLowerCase().trim(),
    phone: input.phone,
    passwordHash,
    role: input.role,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
  });

  // Generate and send OTP
  const otp = generateOtp();
  await setOtp(user.id, otp);
  await sendEmail({
    to: user.email,
    subject: "Your Lettr verification code",
    html: otpEmailHtml(user.firstName, otp),
    text: `Your Lettr verification code is: ${otp}. It expires in 5 minutes.`,
  });

  return {
    userId: user.id,
    message: `Verification code sent to ${user.email}`,
  };
}

export async function login(input: LoginInput) {
  const user = await authRepo.findUserByEmail(input.email.toLowerCase().trim());
  if (!user) {
    throw createError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw createError("Your account has been suspended. Contact support.", 403);
  }

  const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordValid) {
    throw createError("Invalid email or password", 401);
  }

  if (!user.isEmailVerified) {
    // Resend OTP
    const otp = generateOtp();
    await setOtp(user.id, otp);
    await sendEmail({
      to: user.email,
      subject: "Your Lettr verification code",
      html: otpEmailHtml(user.firstName, otp),
      text: `Your Lettr verification code is: ${otp}. It expires in 5 minutes.`,
    });
    throw createError(
      "Email not verified. A new code has been sent to your email.",
      403,
    );
  }

  await authRepo.updateLastLogin(user.id);
  const { accessToken, refreshToken } = buildTokens(user);
  await setRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

export async function verifyOtp(input: VerifyOtpInput) {
  const user = await authRepo.findUserById(input.userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  const storedOtp = await getOtp(user.id);
  if (!storedOtp || storedOtp !== input.otp) {
    throw createError("Invalid or expired verification code", 400);
  }

  await deleteOtp(user.id);
  await authRepo.markEmailVerified(user.id);
  await authRepo.updateLastLogin(user.id);

  // Send welcome email after first verification
  await sendEmail({
    to: user.email,
    subject: `Welcome to Lettr, ${user.firstName}!`,
    html: welcomeEmailHtml(user.firstName, user.role),
  });

  const { accessToken, refreshToken } = buildTokens(user);
  await setRefreshToken(user.id, refreshToken);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(token: string) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw createError("Invalid refresh token", 401);
  }

  const stored = await getRefreshToken(payload.sub);
  if (!stored || stored !== token) {
    throw createError("Refresh token has been revoked", 401);
  }

  const user = await authRepo.findUserById(payload.sub);
  if (!user || !user.isActive) {
    throw createError("User not found or suspended", 401);
  }

  const { accessToken, refreshToken } = buildTokens(user);
  await setRefreshToken(user.id, refreshToken);

  return { accessToken, refreshToken };
}

export async function logout(userId: string) {
  await deleteRefreshToken(userId);
}

export async function getMe(userId: string) {
  const user = await authRepo.findUserWithProfile(userId);
  if (!user) {
    throw createError("User not found", 404);
  }
  return user;
}

export async function resendOtp(userId: string) {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw createError("User not found", 404);
  }

  if (user.isEmailVerified) {
    throw createError("Email is already verified", 400);
  }

  const otp = generateOtp();
  await setOtp(user.id, otp);
  await sendEmail({
    to: user.email,
    subject: "Your Lettr verification code",
    html: otpEmailHtml(user.firstName, otp),
    text: `Your Lettr verification code is: ${otp}. It expires in 5 minutes.`,
  });

  return { message: `Verification code resent to ${user.email}` };
}
