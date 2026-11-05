// Key-value store used for OTPs, sessions, rate limits and locks.
// Uses Redis when REDIS_URL is set (always in production) and an in-memory
// store otherwise, so the API runs locally without Redis installed. The demo
// keeps it in PostgreSQL: serverless instances share no memory, and this leaves
// the database as its only outside service.

import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { PostgresStore } from "./postgresStore.js";

export interface KeyValueStore {
  readonly kind: "redis" | "memory" | "postgres";
  connect(): Promise<void>;
  quit(): Promise<void>;
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Set only if the key does not exist. Returns true when the value was written. */
  setIfAbsent(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  del(...keys: string[]): Promise<void>;
  /** Increment a counter, starting its TTL on first increment. */
  incr(key: string, ttlSeconds: number): Promise<number>;
  sadd(key: string, member: string, ttlSeconds?: number): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
}

class RedisStore implements KeyValueStore {
  readonly kind = "redis" as const;
  private client: Redis;

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 10) {
          console.error("Redis: too many reconnection attempts — giving up");
          return null;
        }
        return Math.min(times * 200, 3000);
      },
    });
    this.client.on("error", (err: Error) => console.error("Redis error:", err.message));
  }

  async connect() {
    await this.client.connect();
    console.info("✅ Redis connected");
  }
  async quit() {
    await this.client.quit();
  }
  get(key: string) {
    return this.client.get(key);
  }
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) await this.client.set(key, value, "EX", ttlSeconds);
    else await this.client.set(key, value);
  }
  async setIfAbsent(key: string, value: string, ttlSeconds: number) {
    return (await this.client.set(key, value, "EX", ttlSeconds, "NX")) === "OK";
  }
  async del(...keys: string[]) {
    if (keys.length) await this.client.del(...keys);
  }
  async incr(key: string, ttlSeconds: number) {
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, ttlSeconds);
    return count;
  }
  async sadd(key: string, member: string, ttlSeconds?: number) {
    await this.client.sadd(key, member);
    if (ttlSeconds) await this.client.expire(key, ttlSeconds);
  }
  async srem(key: string, member: string) {
    await this.client.srem(key, member);
  }
  smembers(key: string) {
    return this.client.smembers(key);
  }
}

class MemoryStore implements KeyValueStore {
  readonly kind = "memory" as const;
  private values = new Map<string, { value: string; expiresAt?: number }>();
  private sets = new Map<string, { members: Set<string>; expiresAt?: number }>();

  private alive<T extends { expiresAt?: number }>(map: Map<string, T>, key: string) {
    const entry = map.get(key);
    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
      map.delete(key);
      return undefined;
    }
    return entry;
  }
  private expiry(ttlSeconds?: number) {
    return ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
  }

  async connect() {
    console.warn("⚠️  REDIS_URL not set — using an in-memory store (development only)");
  }
  async quit() {}
  async get(key: string) {
    return this.alive(this.values, key)?.value ?? null;
  }
  async set(key: string, value: string, ttlSeconds?: number) {
    this.values.set(key, { value, expiresAt: this.expiry(ttlSeconds) });
  }
  async setIfAbsent(key: string, value: string, ttlSeconds: number) {
    if (this.alive(this.values, key)) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }
  async del(...keys: string[]) {
    for (const key of keys) {
      this.values.delete(key);
      this.sets.delete(key);
    }
  }
  async incr(key: string, ttlSeconds: number) {
    const entry = this.alive(this.values, key);
    const count = Number(entry?.value ?? 0) + 1;
    this.values.set(key, { value: String(count), expiresAt: entry?.expiresAt ?? this.expiry(ttlSeconds) });
    return count;
  }
  async sadd(key: string, member: string, ttlSeconds?: number) {
    const entry = this.alive(this.sets, key) ?? { members: new Set<string>() };
    entry.members.add(member);
    if (ttlSeconds) entry.expiresAt = this.expiry(ttlSeconds);
    this.sets.set(key, entry);
  }
  async srem(key: string, member: string) {
    this.alive(this.sets, key)?.members.delete(member);
  }
  async smembers(key: string) {
    return [...(this.alive(this.sets, key)?.members ?? [])];
  }
}

let store: KeyValueStore | undefined;

export function getStore(): KeyValueStore {
  if (!store) store = env.DEMO_MODE ? new PostgresStore() : env.REDIS_URL ? new RedisStore(env.REDIS_URL) : new MemoryStore();
  return store;
}

// ── OTPs ──────────────────────────────────────────────────────────────────

const OTP_MAX_ATTEMPTS = 5;

export async function setOtp(userId: string, otp: string, expirySeconds = env.OTP_EXPIRY_SECONDS) {
  await getStore().set(`otp:${userId}`, otp, expirySeconds);
  await getStore().del(`otp-attempts:${userId}`);
}

/**
 * Check an OTP. Each wrong guess counts; after five the code is discarded
 * and the user has to request a new one.
 */
export async function checkOtp(userId: string, otp: string): Promise<"valid" | "invalid" | "locked"> {
  const stored = await getStore().get(`otp:${userId}`);
  if (!stored) return "invalid";
  if (stored === otp) {
    await getStore().del(`otp:${userId}`, `otp-attempts:${userId}`);
    return "valid";
  }
  const attempts = await getStore().incr(`otp-attempts:${userId}`, env.OTP_EXPIRY_SECONDS);
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await getStore().del(`otp:${userId}`, `otp-attempts:${userId}`);
    return "locked";
  }
  return "invalid";
}

// ── Locks ─────────────────────────────────────────────────────────────────

/** Run `task` only if no other process holds `name`. Returns false when skipped. */
export async function withLock(name: string, ttlSeconds: number, task: () => Promise<void>) {
  const key = `lock:${name}`;
  if (!(await getStore().setIfAbsent(key, String(process.pid), ttlSeconds))) return false;
  try {
    await task();
  } finally {
    await getStore().del(key);
  }
  return true;
}
