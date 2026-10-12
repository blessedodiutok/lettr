// Per-device refresh sessions with rotation and reuse detection.
// Each session stores the jti of the only refresh token currently valid for it.
// Presenting an older token means it was stolen or replayed, so every session
// for that user is revoked — with one exception: the token that was current a
// moment ago. Two tabs refreshing at once, or a page reload that cancels a
// refresh before the new cookie is stored, both present it legitimately. For
// a short grace period that token gets the current one back instead.

import { randomId, refreshTtlSeconds, signRefreshToken, verifyRefreshToken } from "./jwt.js";
import { getStore } from "./redis.js";

const GRACE_MS = 60_000;

interface SessionRecord {
  userId: string;
  jti: string;
  /** The currently valid signed refresh token, re-sent during the grace period. */
  token: string;
  prevJti?: string;
  rotatedAt?: number;
  device: string;
  createdAt: string;
}

const sessionKey = (sid: string) => `session:${sid}`;
const userSessionsKey = (userId: string) => `user-sessions:${userId}`;

async function save(sid: string, record: SessionRecord) {
  await getStore().set(sessionKey(sid), JSON.stringify(record), refreshTtlSeconds());
}

export async function createSession(userId: string, device: string): Promise<string> {
  const sid = randomId();
  const jti = randomId();
  const token = signRefreshToken({ sub: userId, sid, jti });
  await save(sid, { userId, jti, token, device, createdAt: new Date().toISOString() });
  await getStore().sadd(userSessionsKey(userId), sid, refreshTtlSeconds());
  return token;
}

export type RotateResult =
  | { ok: true; userId: string; refreshToken: string }
  | { ok: false; reason: "invalid" | "revoked" | "reused" };

export async function rotateSession(token: string, now = Date.now()): Promise<RotateResult> {
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

  if (record.jti === payload.jti) {
    const jti = randomId();
    const next = signRefreshToken({ sub: record.userId, sid: payload.sid, jti });
    await save(payload.sid, { ...record, jti, token: next, prevJti: record.jti, rotatedAt: now });
    return { ok: true, userId: record.userId, refreshToken: next };
  }

  if (record.prevJti === payload.jti && record.rotatedAt && now - record.rotatedAt < GRACE_MS) {
    return { ok: true, userId: record.userId, refreshToken: record.token };
  }

  await revokeAllSessions(record.userId);
  return { ok: false, reason: "reused" };
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
