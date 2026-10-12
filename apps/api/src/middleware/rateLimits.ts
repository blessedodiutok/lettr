// Rate limits backed by the shared key-value store, so they hold across
// several API instances when Redis is configured.

import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";
import { verifyAccessToken } from "../lib/jwt.js";
import { getStore } from "../lib/redis.js";

interface LimitOptions {
  name: string;
  windowSeconds: number;
  max: number;
  message: string;
  /**
   * Key requests by something other than IP, e.g. the email being targeted.
   * Return null to skip the limit for this request.
   */
  key?: (req: Request) => string | null | undefined;
}

export function rateLimit({ name, windowSeconds, max, message, key }: LimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const keyed = key?.(req);
    if (keyed === null) return next();
    const subject = keyed ?? req.ip ?? "unknown";
    try {
      const count = await getStore().incr(`rate:${name}:${subject}`, windowSeconds);
      res.setHeader("RateLimit-Limit", String(max));
      res.setHeader("RateLimit-Remaining", String(Math.max(0, max - count)));
      if (count > max) {
        res.setHeader("Retry-After", String(windowSeconds));
        res.status(429).json({ success: false, error: message });
        return;
      }
    } catch (error) {
      // Never block traffic because the limiter's store is unavailable.
      console.error(`Rate limiter "${name}" failed open:`, error);
    }
    next();
  };
}

const emailKey = (req: Request) => {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  return typeof email === "string" ? email.trim().toLowerCase() : undefined;
};

/** Login attempts: per IP, and separately per targeted email. */
export const loginLimit = [
  rateLimit({ name: "login-ip", windowSeconds: 15 * 60, max: 20, message: "Too many login attempts. Try again in 15 minutes." }),
  rateLimit({ name: "login-email", windowSeconds: 15 * 60, max: 8, message: "Too many attempts for this account. Try again in 15 minutes.", key: emailKey }),
];

export const signupLimit = rateLimit({ name: "signup", windowSeconds: 60 * 60, max: 10, message: "Too many sign-ups from this network. Try again later." });

/** Sending codes and reset emails costs money and can be abused for spam. */
export const emailSendLimit = rateLimit({ name: "email-send", windowSeconds: 60 * 60, max: 6, message: "Too many emails requested. Try again in an hour." });

export const otpVerifyLimit = rateLimit({ name: "otp-verify", windowSeconds: 15 * 60, max: 30, message: "Too many attempts. Try again in 15 minutes." });

const fingerprint = (value: string) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);

/**
 * Token refresh happens on every page load. It's limited per session, not per
 * IP: Nigerian mobile networks put many customers behind one address (CGNAT).
 * Requests without a refresh token are free — they just return "signed out".
 */
export const refreshLimit = rateLimit({
  name: "refresh",
  windowSeconds: 60,
  max: 60,
  message: "Too many requests. Slow down and try again.",
  key: (req) => {
    const token = (req.cookies?.refreshToken as string | undefined) ?? (req.body as { refreshToken?: string } | undefined)?.refreshToken;
    return token ? `session:${fingerprint(token)}` : null;
  },
});

function verifiedUserId(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return verifyAccessToken(header.slice(7)).sub;
  } catch {
    return null;
  }
}

/**
 * General limit: per signed-in user when the access token is valid, otherwise
 * per IP with a higher ceiling to allow for shared carrier addresses.
 */
export const generalLimit = [
  rateLimit({
    name: "general-user",
    windowSeconds: 60,
    max: 600,
    message: "Too many requests. Slow down and try again.",
    key: (req) => {
      const userId = verifiedUserId(req);
      return userId ? `user:${userId}` : null;
    },
  }),
  rateLimit({
    name: "general-ip",
    windowSeconds: 60,
    max: 1200,
    message: "Too many requests from your network. Slow down and try again.",
    // Anything without a valid token — including forged headers — counts against the IP.
    key: (req) => (verifiedUserId(req) ? null : undefined),
  }),
];
