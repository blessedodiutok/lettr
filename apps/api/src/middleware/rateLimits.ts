// Rate limits backed by the shared key-value store, so they hold across
// several API instances when Redis is configured.

import type { NextFunction, Request, Response } from "express";
import { getStore } from "../lib/redis.js";

interface LimitOptions {
  name: string;
  windowSeconds: number;
  max: number;
  message: string;
  /** Key requests by something other than IP, e.g. the email being targeted. */
  key?: (req: Request) => string | undefined;
}

export function rateLimit({ name, windowSeconds, max, message, key }: LimitOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const subject = key?.(req) ?? req.ip ?? "unknown";
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

/** Token refresh happens on every app load, so it gets a generous allowance. */
export const refreshLimit = rateLimit({ name: "refresh", windowSeconds: 60, max: 30, message: "Too many requests. Slow down and try again." });

export const generalLimit = rateLimit({ name: "general", windowSeconds: 60, max: 300, message: "Too many requests. Slow down and try again." });
