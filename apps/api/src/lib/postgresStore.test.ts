// Runs against a real database, because the behaviour here is in the SQL:
//   TEST_DATABASE_URL=postgresql://... pnpm --filter @lettr/api test
// Skipped when it isn't set. Only touches keys starting with "store-test:".

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresStore } from "./postgresStore.js";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("PostgresStore", () => {
  const store = new PostgresStore();
  const key = (name: string) => `store-test:${name}`;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const clean = async () => {
    const { prisma } = await import("./prisma.js");
    await prisma.keyValueEntry.deleteMany({ where: { OR: [{ key: { startsWith: "store-test:" } }, { key: { startsWith: "set:store-test:" } }] } });
  };

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    await clean();
  });

  afterAll(async () => {
    await clean();
    const { prisma } = await import("./prisma.js");
    await prisma.$disconnect();
  });

  it("stores, overwrites and deletes values", async () => {
    await store.set(key("a"), "one");
    await store.set(key("a"), "two");
    expect(await store.get(key("a"))).toBe("two");
    await store.del(key("a"));
    expect(await store.get(key("a"))).toBeNull();
  });

  it("expires values", async () => {
    await store.set(key("short"), "x", 1);
    expect(await store.get(key("short"))).toBe("x");
    await wait(1100);
    expect(await store.get(key("short"))).toBeNull();
  });

  it("setIfAbsent lets one caller win, and again once the value has expired", async () => {
    expect(await store.setIfAbsent(key("lock"), "first", 1)).toBe(true);
    expect(await store.setIfAbsent(key("lock"), "second", 1)).toBe(false);
    expect(await store.get(key("lock"))).toBe("first");
    await wait(1100);
    expect(await store.setIfAbsent(key("lock"), "third", 60)).toBe(true);
    expect(await store.get(key("lock"))).toBe("third");
  });

  it("gives exactly one winner when callers race", async () => {
    const results = await Promise.all(Array.from({ length: 8 }, (_, i) => store.setIfAbsent(key("race"), String(i), 60)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("incr counts without losing concurrent updates", async () => {
    const counts = await Promise.all(Array.from({ length: 10 }, () => store.incr(key("count"), 60)));
    expect([...counts].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("incr starts again after its window ends", async () => {
    await store.incr(key("window"), 1);
    expect(await store.incr(key("window"), 1)).toBe(2);
    await wait(1100);
    expect(await store.incr(key("window"), 60)).toBe(1);
  });

  it("keeps sets, and deleting the set removes its members", async () => {
    await store.sadd(key("set"), "a", 60);
    await store.sadd(key("set"), "b", 60);
    await store.sadd(key("set"), "a", 60);
    expect((await store.smembers(key("set"))).sort()).toEqual(["a", "b"]);
    await store.srem(key("set"), "a");
    expect(await store.smembers(key("set"))).toEqual(["b"]);
    await store.del(key("set"));
    expect(await store.smembers(key("set"))).toEqual([]);
  });
});
