import "dotenv/config";
import { z } from "zod";

/** Parses "true"/"false"/"1"/"0" strictly — z.coerce.boolean() treats "false" as true. */
const booleanFlag = z
  .enum(["true", "false", "1", "0", ""])
  .default("false")
  .transform((value) => value === "true" || value === "1");

/** Optional secret; empty values and template placeholders ("your_…", "replace…") count as unset. */
const secret = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    if (!trimmed || /your[_-]|replace[_-]|^re_your|\.\.\./i.test(trimmed)) return undefined;
    return trimmed;
  });

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),
    API_URL: z.string().url().default("http://localhost:4000"),
    WEB_URL: z.string().url().default("http://localhost:3000"),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    // Number of reverse proxies in front of the API (Next.js rewrites, a load balancer).
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    // Optional outside production: an in-memory store is used when unset.
    REDIS_URL: secret,
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
    OTP_EXPIRY_SECONDS: z.coerce.number().int().positive().default(600),
    COOKIE_DOMAIN: secret,
    CLOUDINARY_CLOUD_NAME: secret,
    CLOUDINARY_API_KEY: secret,
    CLOUDINARY_API_SECRET: secret,
    CLOUDINARY_UPLOAD_FOLDER: z.string().default("lettr"),
    FIREBASE_SERVICE_ACCOUNT_JSON: secret,
    RESEND_API_KEY: secret,
    EMAIL_FROM: z.string().email().default("hello@lettr.ng"),
    SMTP_HOST: secret,
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: secret,
    SMTP_PASS: secret,
    PAYSTACK_SECRET_KEY: secret,
    PAYSTACK_PUBLIC_KEY: secret,
    PAYSTACK_WEBHOOK_SECRET: secret,
    PAYSTACK_TRANSFER_ENABLED: booleanFlag,
    // Background sweeps (offer expiry, auto-release). Disable to run them elsewhere.
    SCHEDULER_ENABLED: booleanFlag.default(true),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== "production") return;
    if (!value.REDIS_URL) {
      ctx.addIssue({ code: "custom", path: ["REDIS_URL"], message: "REDIS_URL is required in production" });
    }
    if (!value.PAYSTACK_SECRET_KEY) {
      ctx.addIssue({ code: "custom", path: ["PAYSTACK_SECRET_KEY"], message: "PAYSTACK_SECRET_KEY is required in production" });
    }
    if (!value.CLOUDINARY_CLOUD_NAME || !value.CLOUDINARY_API_KEY || !value.CLOUDINARY_API_SECRET) {
      ctx.addIssue({ code: "custom", path: ["CLOUDINARY_CLOUD_NAME"], message: "Cloudinary credentials are required in production" });
    }
    if (!value.RESEND_API_KEY && !value.SMTP_HOST) {
      ctx.addIssue({ code: "custom", path: ["RESEND_API_KEY"], message: "An email provider (RESEND_API_KEY or SMTP_HOST) is required in production" });
    }
  });

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === "production";

/** Paystack is "simulated" locally when no secret key is configured. */
export const isPaystackSimulated = !env.PAYSTACK_SECRET_KEY && !isProduction;
