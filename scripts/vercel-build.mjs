// The Vercel build for the portfolio demo: checks the settings, prepares the
// database and builds the web app (which hosts the API). See docs/VERCEL.md.

import { execSync } from "node:child_process";

const env = process.env;

const problems = [];
if (env.DEMO_MODE !== "true") problems.push("DEMO_MODE must be true. This branch is the portfolio demo, and it has no real payment or email setup.");
if (!env.DATABASE_URL) problems.push("DATABASE_URL is missing. Connect a Neon database under the project's Storage tab.");
for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
  if ((env[name] ?? "").length < 32) problems.push(`${name} must be at least 32 characters. Run: node scripts/vercel-env.mjs`);
}
if (!env.CRON_SECRET) problems.push("CRON_SECRET is missing, so the nightly reset can't run. Run: node scripts/vercel-env.mjs");
if (problems.length) {
  console.error(`\nThe demo can't be built yet:\n${problems.map((problem) => `  - ${problem}`).join("\n")}\n\nSee docs/VERCEL.md.\n`);
  process.exit(1);
}

const pnpm = "npx --yes pnpm@11.3.0";
const run = (command, extraEnv = {}) => execSync(command, { stdio: "inherit", env: { ...env, ...extraEnv } });

run(`${pnpm} --filter @lettr/api exec prisma generate`);

// Preview deployments share the production database, so only production changes it.
// Unset VERCEL_ENV counts as production, for running this script by hand.
if (!env.VERCEL_ENV || env.VERCEL_ENV === "production") {
  // Migrations need a direct connection: Neon's pooled one can't hold their lock.
  run(`${pnpm} --filter @lettr/api exec prisma migrate deploy`, { DATABASE_URL: env.DATABASE_URL_UNPOOLED || env.DATABASE_URL });
  run(`${pnpm} --filter @lettr/api run demo:seed-if-empty`);
} else {
  console.info(`Skipping database changes on a ${env.VERCEL_ENV} deployment.`);
}

run(`${pnpm} --filter @lettr/web build`);
