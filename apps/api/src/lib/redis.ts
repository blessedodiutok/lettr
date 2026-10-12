// File: apps/api/src/lib/redis.ts
// ioredis client singleton — used for OTP storage, rate limiting, and caching

import { Redis } from "ioredis";
import { env } from "../config/env.js";

type RedisClient = Redis;

let redis: RedisClient;

function createRedisClient(): RedisClient {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Reconnect with exponential backoff — waits longer between each retry
    retryStrategy(times: number) {
      if (times > 10) {
        console.error("Redis: too many reconnection attempts — giving up");
        return null;
      }
      return Math.min(times * 200, 3000);
    },
  });

  client.on("connect", () => {
    console.info(`Redis connected at ${env.REDIS_URL}`);
  });

  client.on("error", (err: Error) => {
    console.error("Redis error:", err.message);
  });

  return client;
}

// Export a getter so the singleton is created lazily on first use
export function getRedis(): RedisClient {
  if (!redis) {
    redis = createRedisClient();
  }
  return redis;
}

// Convenience helpers used throughout the app

/** Store an OTP (one-time password) in Redis with an expiry */
export async function setOtp(
  userId: string,
  otp: string,
  expirySeconds = env.OTP_EXPIRY_SECONDS,
): Promise<void> {
  await getRedis().set(`otp:${userId}`, otp, "EX", expirySeconds);
}

/** Retrieve an OTP from Redis — returns null if expired or not found */
export async function getOtp(userId: string): Promise<string | null> {
  return getRedis().get(`otp:${userId}`);
}

/** Delete an OTP after it has been verified */
export async function deleteOtp(userId: string): Promise<void> {
  await getRedis().del(`otp:${userId}`);
}

/** Store a refresh token in Redis (used to invalidate on logout) */
export async function setRefreshToken(
  userId: string,
  token: string,
  expirySeconds = 7 * 24 * 60 * 60,
): Promise<void> {
  await getRedis().set(`refresh:${userId}`, token, "EX", expirySeconds);
}

/** Retrieve the stored refresh token for a user */
export async function getRefreshToken(userId: string): Promise<string | null> {
  return getRedis().get(`refresh:${userId}`);
}

/** Invalidate a refresh token on logout */
export async function deleteRefreshToken(userId: string): Promise<void> {
  await getRedis().del(`refresh:${userId}`);
}
