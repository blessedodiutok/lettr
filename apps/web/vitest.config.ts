import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@lettr/utils": path.resolve(__dirname, "../../packages/utils/src/index.ts"),
      "@lettr/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@lettr/zod-schemas": path.resolve(__dirname, "../../packages/zod-schemas/src/index.ts"),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    environment: "node",
  },
});
