// File: apps/api/prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrations: {
    seed: "tsx --env-file=.env --tsconfig prisma/tsconfig.seed.json prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
