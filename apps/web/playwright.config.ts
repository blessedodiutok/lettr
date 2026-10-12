import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run against an already running stack (API + web).
//   E2E_BASE_URL   web app URL            (default http://localhost:3000)
//   E2E_API_LOG    file the API logs to   (OTP codes are read from dev emails)
//   E2E_SHOTS      folder for screenshots (optional)
export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
});
