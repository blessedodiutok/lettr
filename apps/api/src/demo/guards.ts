// What the public demo refuses. Everyone shares the same fictional accounts, so
// nothing here may let one visitor lock out the next or collect personal data.

import type { NextFunction, Request, Response } from "express";
import { rateLimit } from "../middleware/rateLimits.js";
import { flushNotifications } from "../services/notify.js";

const SIGNUP_OFF = "Sign-up is off in this demo, so nobody's personal details are stored. Use a demo account instead.";
const SHARED_ACCOUNT = "Demo accounts are shared with other visitors, so this can't be changed here.";

const BLOCKED: Array<{ method: string; path: RegExp; message: string }> = [
  { method: "POST", path: /^\/api\/auth\/(signup|verify-otp|resend-otp)$/, message: SIGNUP_OFF },
  { method: "POST", path: /^\/api\/auth\/(change-password|forgot-password|reset-password)$/, message: SHARED_ACCOUNT },
  { method: "PUT", path: /^\/api\/users\/me(\/bank-account)?$/, message: SHARED_ACCOUNT },
  { method: "POST", path: /^\/api\/users\/me\/avatar$/, message: SHARED_ACCOUNT },
  { method: "PATCH", path: /^\/api\/admin\/users\/[^/]+$/, message: "Suspending accounts is off in this demo, because other visitors are using them." },
  { method: "POST", path: /^\/api\/notifications\/fcm-token$/, message: "Push notifications are off in this demo." },
  // Real payment providers can't reach the demo: every charge is simulated.
  { method: "POST", path: /^\/api\/payments\/webhook$/, message: "Not found" },
];

export function findBlocked(method: string, path: string) {
  return BLOCKED.find((rule) => rule.method === method && rule.path.test(path));
}

export function demoGuard(req: Request, res: Response, next: NextFunction) {
  const blocked = findBlocked(req.method, req.path);
  if (!blocked) return next();
  res.status(403).json({ success: false, error: blocked.message, code: "DEMO_RESTRICTED" });
}

/**
 * A serverless function can freeze as soon as it responds, which would lose
 * notifications still being saved. So the demo finishes them first.
 */
export function finishWorkBeforeResponding(_req: Request, res: Response, next: NextFunction) {
  const end = res.end.bind(res) as (...args: unknown[]) => Response;
  res.end = ((...args: unknown[]) => {
    void flushNotifications().finally(() => end(...args));
    return res;
  }) as typeof res.end;
  next();
}

/** Keeps one visitor from using up the free hosting allowance. */
export const demoWriteLimit = rateLimit({
  name: "demo-write",
  windowSeconds: 60 * 60,
  max: 300,
  message: "That's a lot of activity for a demo. Try again in an hour.",
  key: (req) => (req.method === "GET" || req.method === "HEAD" ? null : undefined),
});
