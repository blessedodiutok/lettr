// The Vercel build for the portfolio demo: checks the settings, prepares the
// database and builds the web app (which hosts the API). See docs/VERCEL.md.

import { execSync } from "node:child_process";

const env = process.env;

// Unset VERCEL_ENV counts as production, for running this script by hand.
const target = env.VERCEL_ENV || "production";
const isProduction = target === "production";

// Only production builds touch the database. A Preview builds without one, which also means
// a new branch can get the first build Vercel wants before it can become the production branch.
const noDatabase = !env.DATABASE_URL;

/** Names only, never values: spots a database connected under a custom prefix. */
const similarNames = Object.keys(env).filter((name) => /(DATABASE|POSTGRES).*URL/.test(name) && name !== "DATABASE_URL");
const databaseHelp = similarNames.length
  ? `Found ${similarNames.join(", ")}, so the database looks connected under a different name. Reconnect it with no Custom Prefix.`
  : `Under the project's Storage tab, connect the Neon database with ${target} ticked.`;

const problems = [];
if (env.DEMO_MODE !== "true") problems.push("DEMO_MODE must be true. This branch is the portfolio demo, and it has no real payment or email setup.");
if (noDatabase && isProduction) problems.push(`DATABASE_URL is missing from this ${target} build. ${databaseHelp}`);
for (const name of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
  if ((env[name] ?? "").length < 32) problems.push(`${name} must be at least 32 characters. Run: node scripts/vercel-env.mjs`);
}
if (!env.CRON_SECRET) problems.push("CRON_SECRET is missing, so the nightly reset can't run. Run: node scripts/vercel-env.mjs");
if (problems.length) {
  console.error(`\nThe demo can't be built yet:\n${problems.map((problem) => `  - ${problem}`).join("\n")}\n\nSee docs/VERCEL.md.\n`);
  process.exit(1);
}
if (noDatabase) console.warn(`\nThis ${target} build has no DATABASE_URL. Its pages will build, but its API won't work. ${databaseHelp}\n`);
console.info(`Building for ${target} on Node ${process.version}.`);

const pnpm = "npx --yes pnpm@11.3.0";
const run = (command, extraEnv = {}) => execSync(command, { stdio: "inherit", env: { ...env, ...extraEnv } });

// Generating the client never connects, but Prisma's config needs a value to read.
run(`${pnpm} --filter @lettr/api exec prisma generate`, noDatabase ? { DATABASE_URL: "postgresql://unused:unused@localhost:5432/unused" } : {});

if (isProduction) {
  // Migrations need a direct connection: Neon's pooled one can't hold their lock.
  run(`${pnpm} --filter @lettr/api exec prisma migrate deploy`, { DATABASE_URL: env.DATABASE_URL_UNPOOLED || env.DATABASE_URL });
  run(`${pnpm} --filter @lettr/api run demo:seed-if-empty`);
} else {
  // Preview deployments share the production database, so only production changes it.
  console.info(`Skipping database changes on a ${target} deployment.`);
}

run(`${pnpm} --filter @lettr/web build`);
