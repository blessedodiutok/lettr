// File: apps/api/src/app.ts
// Express 5 application factory — assembles middleware stack and all routers

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { Prisma } from "@prisma/client";

import { env } from "./config/env.js";
import * as paymentsController from "./controllers/payments.controller.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import inquiriesRouter from "./routes/inquiries.js";
import listingsRouter from "./routes/listings.js";
import notificationsRouter from "./routes/notifications.js";
import paymentsRouter from "./routes/payments.js";
import reviewsRouter from "./routes/reviews.js";
import tenancyRouter from "./routes/tenancy.js";
import uploadsRouter from "./routes/uploads.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";

export function createApp(): express.Application {
  const app = express();
  app.set("json replacer", (_key: string, value: unknown) =>
    value instanceof Prisma.Decimal ? value.toNumber() : value,
  );

  // ── Security middleware ──────────────────────────────────────────────────

  // helmet sets secure HTTP headers (XSS protection, no-sniff, etc.)
  app.use(helmet());

  // cors allows the web/mobile frontends to make API calls
  app.use(
    cors({
      origin: env.CORS_ORIGINS
        .split(",")
        .map((o) => o.trim()),
      credentials: true, // Required so cookies are sent cross-origin
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // ── Logging ─────────────────────────────────────────────────────────────

  // morgan logs every incoming HTTP request — 'dev' format in development
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    paymentsController.paystackWebhook,
  );

  // ── Body parsing ─────────────────────────────────────────────────────────

  app.use(express.json({ limit: "10kb" })); // Parse JSON request bodies
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));
  app.use(cookieParser()); // Parse httpOnly cookies (refresh tokens, access tokens)

  // ── Auth rate limiting — 5 attempts per 15 minutes per IP ───────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
      success: false,
      error: "Too many attempts from this IP, please try again in 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // General API rate limit — 100 requests per minute per IP
  const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", generalLimiter);
  app.use("/api/auth", authLimiter);

  // ── Health check ─────────────────────────────────────────────────────────

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // ── Routers ──────────────────────────────────────────────────────────────

  app.use("/api/auth", authRouter);
  app.use("/api/listings", listingsRouter);
  app.use("/api/inquiries", inquiriesRouter);
  app.use("/api/tenancy", tenancyRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/admin", adminRouter);

  // ── 404 handler ──────────────────────────────────────────────────────────

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  // ── Global error handler — MUST be last ──────────────────────────────────
  app.use(errorHandler);

  return app;
}
