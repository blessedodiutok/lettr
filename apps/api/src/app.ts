// Express 5 application factory — middleware stack and routers.

import { Prisma } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "node:crypto";

import { env, isProduction } from "./config/env.js";
import * as paymentsController from "./controllers/payments.controller.js";
import { prisma } from "./lib/prisma.js";
import { getStore } from "./lib/redis.js";
import { LOCAL_PUBLIC_DIR, useCloudinary } from "./lib/storage.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimit } from "./middleware/rateLimits.js";
import adminRouter from "./routes/admin.js";
import authRouter from "./routes/auth.js";
import inquiriesRouter from "./routes/inquiries.js";
import listingsRouter from "./routes/listings.js";
import notificationsRouter from "./routes/notifications.js";
import paymentsRouter from "./routes/payments.js";
import reviewsRouter from "./routes/reviews.js";
import tenancyRouter from "./routes/tenancy.js";
import uploadsRouter from "./routes/uploads.js";
import usersRouter from "./routes/users.js";

export function createApp(): express.Application {
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY);
  app.set("json replacer", (_key: string, value: unknown) => (value instanceof Prisma.Decimal ? value.toNumber() : value));

  app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Client-Platform", "X-Request-Id"],
    }),
  );

  // Every request gets an ID, echoed back and printed in logs, to trace problems.
  app.use((req, res, next) => {
    const requestId = req.get("x-request-id") ?? crypto.randomUUID();
    res.setHeader("X-Request-Id", requestId);
    (req as express.Request & { id?: string }).id = requestId;
    next();
  });
  morgan.token("id", (req) => (req as express.Request & { id?: string }).id ?? "-");
  app.use(morgan(isProduction ? ":id :remote-addr :method :url :status :res[content-length] - :response-time ms" : "dev"));

  // Paystack webhook needs the raw body for signature verification.
  app.post("/api/payments/webhook", express.raw({ type: "application/json", limit: "1mb" }), paymentsController.paystackWebhook);

  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: true, limit: "100kb" }));
  app.use(cookieParser());

  // Locally stored uploads (development without Cloudinary).
  if (!useCloudinary) app.use("/api/media", express.static(LOCAL_PUBLIC_DIR, { maxAge: "7d", fallthrough: false }));

  app.get("/api/health", async (_req, res) => {
    const checks = { database: false, store: false };
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      // reported below
    }
    try {
      await getStore().set("health", new Date().toISOString(), 60);
      checks.store = true;
    } catch {
      // reported below
    }
    const healthy = checks.database && checks.store;
    res.status(healthy ? 200 : 503).json({ success: healthy, status: healthy ? "ok" : "degraded", checks, timestamp: new Date().toISOString() });
  });

  app.use("/api", ...generalLimit);
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

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found", code: "NOT_FOUND" });
  });
  app.use(errorHandler);
  return app;
}
