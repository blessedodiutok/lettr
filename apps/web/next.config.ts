// Next.js 16 configuration.
// The browser talks to the API through the /api rewrite, so auth cookies are
// first-party and no CORS is involved. In the portfolio demo (DEMO_MODE=true)
// the API runs inside this app instead: see src/app/api/[...path]/route.ts.

import type { NextConfig } from "next";
import path from "node:path";

const API_URL = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const IS_DEMO = process.env.DEMO_MODE === "true";
const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  // The demo's listings are fictional, so they must not appear in search results for real homes.
  ...(IS_DEMO ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd(), "../..") },
  transpilePackages: ["@lettr/types", "@lettr/zod-schemas", "@lettr/utils", "@lettr/config"],
  env: {
    NEXT_PUBLIC_DEMO_MODE: IS_DEMO ? "true" : "false",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? productionUrl ?? "http://localhost:3000",
  },

  // Photos are resized by Cloudinary/Unsplash themselves (see src/lib/imageLoader.ts),
  // so any host works and Next's optimiser isn't needed.
  images: { loader: "custom", loaderFile: "./src/lib/imageLoader.ts" },

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },

  async rewrites() {
    return IS_DEMO ? [] : [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },

  // Old URLs from before the Phase 2 restructure.
  async redirects() {
    return [
      { source: "/verify-otp", destination: "/auth/verify", permanent: true },
      { source: "/dashboard/messages", destination: "/messages", permanent: true },
      { source: "/dashboard/tenancy", destination: "/tenancies", permanent: true },
      { source: "/landlord/inquiries", destination: "/messages", permanent: true },
      { source: "/landlord/tenancies", destination: "/tenancies", permanent: true },
      { source: "/landlord/tenants", destination: "/tenancies", permanent: true },
      { source: "/landlord/payments", destination: "/landlord/payouts", permanent: true },
      { source: "/landlord/verify", destination: "/landlord/verification", permanent: true },
    ];
  },
};

export default nextConfig;
