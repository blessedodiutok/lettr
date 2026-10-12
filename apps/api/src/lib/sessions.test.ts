import { describe, expect, it, vi } from "vitest";

vi.mock("../config/env.js", () => ({
  env: {
    JWT_ACCESS_SECRET: "a".repeat(40),
    JWT_REFRESH_SECRET: "r".repeat(40),
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "30d",
    OTP_EXPIRY_SECONDS: 600,
  },
}));

const { createSession, rotateSession } = await import("./sessions.js");

describe("refresh sessions", () => {
  it("rotates a valid refresh token", async () => {
    const first = await createSession("user-1", "web");
    const result = await rotateSession(first);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.refreshToken).not.toBe(first);
  });

  it("returns the current token when the previous one arrives within the grace period", async () => {
    const first = await createSession("user-2", "web");
    const rotated = await rotateSession(first);
    const again = await rotateSession(first);
    expect(again).toEqual({ ok: true, userId: "user-2", refreshToken: rotated.ok ? rotated.refreshToken : "" });
  });

  it("revokes every session when an old token is replayed after the grace period", async () => {
    const first = await createSession("user-3", "web");
    const other = await createSession("user-3", "phone");
    await rotateSession(first, Date.now());
    const replay = await rotateSession(first, Date.now() + 120_000);
    expect(replay).toEqual({ ok: false, reason: "reused" });
    expect(await rotateSession(other)).toEqual({ ok: false, reason: "revoked" });
  });

  it("revokes when a token two rotations old is replayed", async () => {
    const first = await createSession("user-4", "web");
    const second = await rotateSession(first);
    if (second.ok) await rotateSession(second.refreshToken);
    expect(await rotateSession(first)).toEqual({ ok: false, reason: "reused" });
  });
});
