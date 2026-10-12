// Server entry point — connects the database and key-value store, starts HTTP and the scheduler.

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { getFirebaseApp } from "./lib/firebase.js";
import { prisma } from "./lib/prisma.js";
import { getStore } from "./lib/redis.js";
import { startScheduler } from "./jobs/scheduler.js";

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  console.info("✅ Prisma connected to PostgreSQL");
  await getStore().connect();
  getFirebaseApp();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.info(`🚀 Lettr API running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
  const stopScheduler = startScheduler();

  const shutdown = (signal: string) => {
    console.info(`\n${signal} received — shutting down gracefully...`);
    stopScheduler();
    server.close(async () => {
      await prisma.$disconnect();
      await getStore().quit();
      process.exit(0);
    });
    // Don't hang forever on open keep-alive connections.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
