// File: apps/api/src/index.ts
// Server entry point — loads env, connects Prisma and Redis, starts HTTP server

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { getFirebaseApp } from "./lib/firebase.js";
import { prisma } from "./lib/prisma.js";
import { getRedis } from "./lib/redis.js";

const PORT = env.PORT;

async function bootstrap(): Promise<void> {
  // Connect to PostgreSQL via Prisma
  await prisma.$connect();
  console.info("✅ Prisma connected to PostgreSQL");

  // Connect to Redis
  const redis = getRedis();
  await redis.connect();

  // Initialise Firebase (non-fatal if credentials missing)
  getFirebaseApp();

  // Create and start the Express app
  const app = createApp();

  const server = app.listen(PORT, () => {
    console.info(`🚀 Lettr API running on http://localhost:${PORT}`);
    console.info(`   Environment: ${env.NODE_ENV}`);
    console.info(`   Health:      http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown — close connections cleanly on CTRL+C or process kill
  const shutdown = async (signal: string): Promise<void> => {
    console.info(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      await getRedis().quit();
      console.info("✅ Shutdown complete");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
