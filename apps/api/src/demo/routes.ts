// Base: /api/demo. Only mounted when DEMO_MODE is on.
//   POST /login   one-click sign-in to a shared demo account
//   POST /reset   a visitor restores the starting data (once per 10 minutes)
//   GET  /reset   the nightly Vercel Cron job (needs CRON_SECRET)

import { Router, type Request, type Response } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "../config/env.js";
import { demoLogin } from "../controllers/auth.controller.js";
import { rateLimit } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { DEMO_ACCOUNTS, resetDemo, resetDemoThrottled } from "./reset.js";

const router: Router = Router();

const LoginSchema = z.object({ persona: z.enum(["tenant", "landlord", "admin"]) });

const loginLimit = rateLimit({ name: "demo-login", windowSeconds: 60, max: 20, message: "Too many sign-ins. Wait a moment and try again." });

router.post("/login", loginLimit, validate({ body: LoginSchema }), async (req: Request, res: Response) => {
  await demoLogin(req, res, DEMO_ACCOUNTS[(req.body as z.infer<typeof LoginSchema>).persona]);
});

router.post("/reset", async (_req: Request, res: Response) => {
  if (!(await resetDemoThrottled())) {
    res.status(429).json({ success: false, error: "The demo was reset a few minutes ago. Try again in a little while.", code: "DEMO_RESET_THROTTLED" });
    return;
  }
  res.json({ success: true, data: { message: "The demo is back to its starting point." } });
});

function isAuthorisedCron(req: Request): boolean {
  if (!env.CRON_SECRET) return false;
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`);
  const actual = Buffer.from(req.get("authorization") ?? "");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

router.get("/reset", async (req: Request, res: Response) => {
  if (!isAuthorisedCron(req)) {
    res.status(401).json({ success: false, error: "Unauthorised" });
    return;
  }
  await resetDemo();
  res.json({ success: true, data: { resetAt: new Date().toISOString() } });
});

export default router;
