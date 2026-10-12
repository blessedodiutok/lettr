// JWT helpers. Access tokens are short-lived and sent as a Bearer header.
// Refresh tokens identify one device session (`sid`) and are rotated on every use.

import type { UserRole } from "@prisma/client";
import crypto from "node:crypto";
import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ISSUER = "lettr-api";
const AUDIENCE = "lettr-client";

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  sid: string; // Session ID — one per signed-in device
  jti: string; // Unique per issued token, used to detect reuse
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: ISSUER, audience: AUDIENCE }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: ISSUER, audience: AUDIENCE }) as RefreshTokenPayload;
}

/** Lifetime of a refresh token in seconds, derived from JWT_REFRESH_EXPIRES_IN. */
export function refreshTtlSeconds(): number {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  if (!match) return 30 * 24 * 60 * 60;
  const unit = { s: 1, m: 60, h: 3600, d: 86400 }[match[2] as "s" | "m" | "h" | "d"];
  return Number(match[1]) * unit;
}

/** Cryptographically random 6-digit OTP */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1_000_000).toString();
}

export function randomId(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}
