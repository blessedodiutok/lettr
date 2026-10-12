// Per-device refresh sessions with rotation and reuse detection.
// Each session stores the jti of the only refresh token currently valid for it.
// Presenting an older token for the session means it was stolen or replayed,
// so every session for that user is revoked.

import { randomId, refreshTtlSeconds, signRefreshToken, verifyRefreshToken } from "./jwt.js";
import { getStore } from "./redis.js";

interface SessionRecord {
  userId: string;
  jti: string;
  device: string;
  createdAt: string;
}

const sessionKey = (sid: string) => `session:${sid}`;
const userSessionsKey = (userId: string) => `user-sessions:${userId}`;

export async function createSession(userId: string, device: string): Promise<string> {
  const sid = randomId();
  const jti = randomId();
  const ttl = refreshTtlSeconds();
  const record: SessionRecord = { userId, jti, device, createdAt: new Date().toISOString() };
  await getStore().set(sessionKey(sid), JSON.stringify(record), ttl);
  await getStore().sadd(userSessionsKey(userId), sid, ttl);
  return signRefreshToken({ sub: userId, sid, jti });
}

export type RotateResult =
  | { ok: true; userId: string; refreshToken: string }
  | { ok: false; reason: "invalid" | "revoked" | "reused" };

export async function rotateSession(token: string): Promise<RotateResult> {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (!payload.sid || !payload.jti) return { ok: false, reason: "invalid" };

  const raw = await getStore().get(sessionKey(payload.sid));
  if (!raw) return { ok: false, reason: "revoked" };
  const record = JSON.parse(raw) as SessionRecord;
  if (record.userId !== payload.sub) return { ok: false, reason: "invalid" };
  if (record.jti !== payload.jti) {
    await revokeAllSessions(record.userId);
    return { ok: false, reason: "reused" };
  }

  const jti = randomId();
  const ttl = refreshTtlSeconds();
  await getStore().set(sessionKey(payload.sid), JSON.stringify({ ...record, jti }), ttl);
  return { ok: true, userId: record.userId, refreshToken: signRefreshToken({ sub: record.userId, sid: payload.sid, jti }) };
}

/** Revoke the session a refresh token belongs to (logout on one device). */
export async function revokeSessionByToken(token: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(token);
    await getStore().del(sessionKey(payload.sid));
    await getStore().srem(userSessionsKey(payload.sub), payload.sid);
  } catch {
    // An invalid token has no session to revoke.
  }
}

/** Revoke every session for a user — password change, reset, suspension, reuse. */
export async function revokeAllSessions(userId: string): Promise<void> {
  const sids = await getStore().smembers(userSessionsKey(userId));
  await getStore().del(...sids.map(sessionKey), userSessionsKey(userId));
}
