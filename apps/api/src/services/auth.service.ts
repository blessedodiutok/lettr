// Authentication: sign-up with email OTP, login, per-device sessions,
// password reset and change.

import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { invalidateAccountCache } from "../middleware/auth.js";
import { generateOtp, randomId, signAccessToken } from "../lib/jwt.js";
import { otpEmail, passwordResetEmail, sendEmail, sendEmailSafely, webUrl, welcomeEmail } from "../lib/mailer.js";
import { checkOtp, getStore, setOtp } from "../lib/redis.js";
import { createSession, revokeAllSessions, revokeSessionByToken, rotateSession } from "../lib/sessions.js";
import { createError } from "../middleware/errorHandler.js";
import * as authRepo from "../repositories/auth.repository.js";

const PASSWORD_RESET_TTL_SECONDS = 30 * 60;

interface SignupInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

type TokenUser = { id: string; email: string; role: UserRole; firstName: string; lastName: string };

function accessTokenFor(user: TokenUser) {
  return signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}

async function issueTokens(user: TokenUser, device: string) {
  return { accessToken: accessTokenFor(user), refreshToken: await createSession(user.id, device) };
}

async function sendOtp(user: { id: string; email: string; firstName: string }) {
  const otp = generateOtp();
  await setOtp(user.id, otp);
  await sendEmail({ to: user.email, ...otpEmail(user.firstName, otp) });
}

export async function signup(input: SignupInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await authRepo.findUserByEmail(email);

  if (existing?.isEmailVerified) {
    throw createError("An account with this email already exists. Try logging in.", 409, { code: "EMAIL_TAKEN" });
  }

  // An unverified account with this email gets a fresh code instead of a
  // duplicate account; its password is only replaced once the email is proven.
  const user =
    existing ??
    (await authRepo.createUser({
      email,
      phone: input.phone,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
    }));

  let emailSent = true;
  try {
    await sendOtp(user);
  } catch (error) {
    emailSent = false;
    console.error("Signup OTP email failed:", error);
  }

  return {
    userId: user.id,
    email: user.email,
    message: emailSent
      ? `We sent a 6-digit code to ${user.email}.`
      : "Your account is ready, but we couldn't send the code. Tap resend to try again.",
  };
}

export async function login(input: { email: string; password: string }, device: string) {
  const user = await authRepo.findUserByEmail(input.email.toLowerCase().trim());
  // Compare against a dummy hash when the user doesn't exist so timing doesn't reveal accounts.
  const hash = user?.passwordHash ?? "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.ZhO3F7QoLMHRUuBmSaUCTqFIa3iy";
  const passwordValid = await bcrypt.compare(input.password, hash);
  if (!user || !passwordValid) throw createError("That email and password don't match.", 401, { code: "INVALID_CREDENTIALS" });
  if (!user.isActive) throw createError("Your account has been suspended. Contact support.", 403, { code: "ACCOUNT_SUSPENDED" });

  if (!user.isEmailVerified) {
    await sendOtp(user).catch((error) => console.error("Login OTP email failed:", error));
    throw createError("Verify your email to continue. We've sent you a new code.", 403, {
      code: "EMAIL_NOT_VERIFIED",
      data: { userId: user.id, email: user.email },
    });
  }

  await authRepo.updateLastLogin(user.id);
  const tokens = await issueTokens(user, device);
  return { user: await getMe(user.id), ...tokens };
}

export async function verifyOtp(input: { userId: string; otp: string }, device: string) {
  const user = await authRepo.findUserById(input.userId);
  if (!user) throw createError("That code is invalid or has expired.", 400, { code: "OTP_INVALID" });

  const result = await checkOtp(user.id, input.otp);
  if (result === "locked") {
    throw createError("Too many wrong codes. Request a new one.", 429, { code: "OTP_LOCKED" });
  }
  if (result === "invalid") throw createError("That code is invalid or has expired.", 400, { code: "OTP_INVALID" });

  const firstVerification = !user.isEmailVerified;
  if (firstVerification) await authRepo.markEmailVerified(user.id);
  await authRepo.updateLastLogin(user.id);
  if (firstVerification) await sendEmailSafely({ to: user.email, ...welcomeEmail(user.firstName, user.role) });

  const tokens = await issueTokens(user, device);
  return { user: await getMe(user.id), ...tokens };
}

export async function resendOtp(userId: string) {
  const user = await authRepo.findUserById(userId);
  // Same response whether or not the account exists, to avoid account probing.
  if (!user || user.isEmailVerified) return { message: "If that account needs verifying, a new code is on its way." };
  await sendOtp(user);
  return { message: `A new code is on its way to ${user.email}.` };
}

export async function refreshTokens(token: string) {
  const result = await rotateSession(token);
  if (!result.ok) {
    const message = result.reason === "reused" ? "For your security, please log in again." : "Your session has expired. Please log in again.";
    throw createError(message, 401, { code: "SESSION_EXPIRED" });
  }
  const user = await authRepo.findUserById(result.userId);
  if (!user || !user.isActive) {
    await revokeAllSessions(result.userId);
    throw createError("Your session has expired. Please log in again.", 401, { code: "SESSION_EXPIRED" });
  }
  return { accessToken: accessTokenFor(user), refreshToken: result.refreshToken, role: user.role };
}

export async function logout(refreshToken: string | undefined) {
  if (refreshToken) await revokeSessionByToken(refreshToken);
}

export async function getMe(userId: string) {
  const user = await authRepo.findUserWithProfile(userId);
  if (!user) throw createError("Account not found", 404);
  return user;
}

export async function forgotPassword(email: string) {
  const user = await authRepo.findUserByEmail(email.toLowerCase().trim());
  if (user?.isActive) {
    const token = randomId(32);
    await getStore().set(`password-reset:${token}`, user.id, PASSWORD_RESET_TTL_SECONDS);
    const url = webUrl(`/auth/reset-password?token=${token}`);
    await sendEmail({ to: user.email, ...passwordResetEmail(user.firstName, url) });
  }
  return { message: "If an account uses that email, we've sent a link to reset the password." };
}

export async function resetPassword(token: string, password: string) {
  const key = `password-reset:${token}`;
  const userId = await getStore().get(key);
  if (!userId) throw createError("This reset link has expired. Request a new one.", 400, { code: "RESET_TOKEN_INVALID" });
  await getStore().del(key);
  await authRepo.updatePassword(userId, await bcrypt.hash(password, 12));
  // Proving control of the inbox also verifies the email.
  await authRepo.markEmailVerified(userId);
  await revokeAllSessions(userId);
  invalidateAccountCache(userId);
  return { message: "Your password has been changed. Log in with the new one." };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string, device: string) {
  const user = await authRepo.findUserById(userId);
  if (!user) throw createError("Account not found", 404);
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw createError("Your current password is incorrect.", 400, { code: "INVALID_CREDENTIALS" });
  }
  await authRepo.updatePassword(userId, await bcrypt.hash(newPassword, 12));
  // Sign out every other device, then give this one a fresh session.
  await revokeAllSessions(userId);
  return issueTokens(user, device);
}
