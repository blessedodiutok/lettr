import { defineConfig } from "vitest/config";

// Resolve @lettr/* workspace packages from source so tests never run against a stale build.
const conditions = ["lettr-source"];

export default defineConfig({
  resolve: { conditions },
  ssr: { resolve: { conditions, externalConditions: conditions } },
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    environment: "node",
    testTimeout: 15_000,
  },
});
