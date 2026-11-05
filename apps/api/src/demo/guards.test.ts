import { describe, expect, it, vi } from "vitest";

vi.mock("../middleware/rateLimits.js", () => ({ rateLimit: () => vi.fn() }));
vi.mock("../services/notify.js", () => ({ flushNotifications: vi.fn() }));

const { findBlocked } = await import("./guards.js");

describe("demo guard", () => {
  it.each([
    ["POST", "/api/auth/signup"],
    ["POST", "/api/auth/verify-otp"],
    ["POST", "/api/auth/resend-otp"],
    ["POST", "/api/auth/change-password"],
    ["POST", "/api/auth/forgot-password"],
    ["POST", "/api/auth/reset-password"],
    ["PUT", "/api/users/me"],
    ["PUT", "/api/users/me/bank-account"],
    ["POST", "/api/users/me/avatar"],
    ["PATCH", "/api/admin/users/demo-tenant-tunde"],
    ["POST", "/api/notifications/fcm-token"],
    ["POST", "/api/payments/webhook"],
  ])("refuses %s %s", (method, path) => {
    expect(findBlocked(method, path)).toBeDefined();
  });

  it.each([
    ["POST", "/api/auth/login"],
    ["POST", "/api/auth/refresh"],
    ["POST", "/api/auth/logout"],
    ["GET", "/api/users/me"],
    ["POST", "/api/inquiries"],
    ["POST", "/api/inquiries/abc/offer/accept"],
    ["POST", "/api/payments/abc/simulate-success"],
    ["POST", "/api/tenancy/abc/sign"],
    ["PATCH", "/api/admin/listings/abc"],
    ["PATCH", "/api/admin/disputes/abc"],
    ["PATCH", "/api/admin/verifications/abc"],
    ["POST", "/api/demo/login"],
  ])("allows the journey: %s %s", (method, path) => {
    expect(findBlocked(method, path)).toBeUndefined();
  });
});
