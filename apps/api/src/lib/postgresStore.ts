// The KeyValueStore interface on top of PostgreSQL, for the demo. Serverless
// instances share no memory, so sessions and rate limits have to live somewhere
// shared. Sets are stored as one row per member under a common key prefix.
// Prisma is imported on first use so importing this file needs no database.
// Times are always passed in: expiresAt has no time zone, so comparing it with
// NOW() would depend on the database session's zone.

import type { Prisma } from "@prisma/client";
import type { KeyValueStore } from "./redis.js";

const db = async () => (await import("./prisma.js")).prisma;
const expiry = (ttlSeconds?: number) => (ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null);
const memberPrefix = (key: string) => `set:${key}:`;

export class PostgresStore implements KeyValueStore {
  readonly kind = "postgres" as const;

  async connect() {}
  async quit() {}

  async get(key: string) {
    const prisma = await db();
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      SELECT "value" FROM "KeyValueEntry"
      WHERE "key" = ${key} AND ("expiresAt" IS NULL OR "expiresAt" > ${new Date()})`;
    return rows[0]?.value ?? null;
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    const prisma = await db();
    const expiresAt = expiry(ttlSeconds);
    await prisma.keyValueEntry.upsert({ where: { key }, create: { key, value, expiresAt }, update: { value, expiresAt } });
  }

  async setIfAbsent(key: string, value: string, ttlSeconds: number) {
    const prisma = await db();
    const written = await prisma.$executeRaw`
      INSERT INTO "KeyValueEntry" ("key", "value", "expiresAt")
      VALUES (${key}, ${value}, ${expiry(ttlSeconds)})
      ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "expiresAt" = EXCLUDED."expiresAt"
      WHERE "KeyValueEntry"."expiresAt" IS NOT NULL AND "KeyValueEntry"."expiresAt" <= ${new Date()}`;
    return written > 0;
  }

  async del(...keys: string[]) {
    if (!keys.length) return;
    const prisma = await db();
    await prisma.keyValueEntry.deleteMany({
      where: { OR: [{ key: { in: keys } }, ...keys.map((key) => ({ key: { startsWith: memberPrefix(key) } }))] },
    });
  }

  async incr(key: string, ttlSeconds: number) {
    const prisma = await db();
    const now = new Date();
    const rows = await prisma.$queryRaw<{ value: string }[]>`
      INSERT INTO "KeyValueEntry" ("key", "value", "expiresAt")
      VALUES (${key}, '1', ${expiry(ttlSeconds)})
      ON CONFLICT ("key") DO UPDATE SET
        "value" = CASE WHEN "KeyValueEntry"."expiresAt" <= ${now} THEN '1' ELSE ("KeyValueEntry"."value"::int + 1)::text END,
        "expiresAt" = CASE WHEN "KeyValueEntry"."expiresAt" <= ${now} THEN EXCLUDED."expiresAt" ELSE "KeyValueEntry"."expiresAt" END
      RETURNING "value"`;
    return Number(rows[0].value);
  }

  async sadd(key: string, member: string, ttlSeconds?: number) {
    await this.set(`${memberPrefix(key)}${member}`, member, ttlSeconds);
  }

  async srem(key: string, member: string) {
    await this.del(`${memberPrefix(key)}${member}`);
  }

  async smembers(key: string) {
    const prisma = await db();
    const rows = await prisma.keyValueEntry.findMany({
      where: { key: { startsWith: memberPrefix(key) }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      select: { value: true },
    });
    return rows.map((row) => row.value);
  }

  /** Remove everything, optionally keeping some keys. Used by the demo reset. */
  async clear(keep: string[] = []) {
    const prisma = await db();
    const where: Prisma.KeyValueEntryWhereInput = { key: { notIn: keep } };
    await prisma.keyValueEntry.deleteMany({ where });
  }
}
