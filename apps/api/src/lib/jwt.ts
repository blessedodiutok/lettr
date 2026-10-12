// File: apps/api/src/lib/jwt.ts
// JWT (JSON Web Token) helpers — sign and verify access and refresh tokens
// Access tokens: short-lived (15 min), sent in Authorization header
// Refresh tokens: long-lived (7 days), stored in httpOnly cookie

import type { UserRole } from "@prisma/client";
import crypto from "node:crypto";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  tokenVersion: number; // Incremented on password change to invalidate old tokens
}

/** Sign a short-lived access token (15 minutes by default) */
export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "lettr-api",
    audience: "lettr-client",
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

/** Sign a long-lived refresh token (7 days by default) */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "lettr-api",
    audience: "lettr-client",
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/** Verify and decode an access token — throws if expired or tampered */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "lettr-api",
    audience: "lettr-client",
  }) as AccessTokenPayload;
}

/** Verify and decode a refresh token — throws if expired or tampered */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "lettr-api",
    audience: "lettr-client",
  }) as RefreshTokenPayload;
}

/** Generate a cryptographically random 6-digit OTP */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1_000_000).toString();
}
