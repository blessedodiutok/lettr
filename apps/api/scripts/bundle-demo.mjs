// Bundles the API into one file for the web app to host in the portfolio demo.
// The file is built before `next build`, so Next.js only has to import plain JavaScript.

import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const unused = path.join(root, "scripts/empty-module.mjs");

await build({
  entryPoints: [path.join(root, "src/app.ts")],
  outfile: path.join(root, "dist-demo/app.cjs"),
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  conditions: ["lettr-source"],
  // The database client ships a generated engine, so it stays a normal dependency.
  external: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  // The demo never calls these. Leaving them out makes its serverless function smaller and quicker to start.
  alias: { "firebase-admin": unused, cloudinary: unused, ioredis: unused, resend: unused, nodemailer: unused },
  plugins: [
    {
      // Express's view engine loads packages by name at runtime, and this API renders no views.
      name: "no-express-views",
      setup(context) {
        context.onResolve({ filter: /^\.\/view$/ }, ({ importer }) => (importer.includes("express") ? { path: unused } : undefined));
      },
    },
  ],
  logLevel: "warning",
});
