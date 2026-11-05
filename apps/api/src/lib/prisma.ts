// File: apps/api/src/lib/prisma.ts
// Prisma 7 requires the pg adapter when using the "client" engine type.
// The connection URL comes from the DATABASE_URL environment variable
// via the adapter — not passed directly to PrismaClient.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Make sure apps/api/.env exists and contains DATABASE_URL.",
    );
  }

  // Each serverless instance keeps its own pool, so the demo keeps them small.
  const adapter = new PrismaPg({ connectionString, ...(process.env.DEMO_MODE === "true" ? { max: 3 } : {}) });

  return new PrismaClient({
    adapter,
    // Set PRISMA_LOG_QUERIES=true to print every SQL query while debugging.
    log: process.env.PRISMA_LOG_QUERIES === "true" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
