// File: apps/web/next.config.ts
// Next.js 16 configuration — Turbopack enabled, shared packages transpiled

import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  // Turbopack is the new default bundler in Next.js 16 (replaces Webpack)
  // turbopack: {
  //   root: path.resolve(process.cwd(), "../.."),
  // },

  // Transpile monorepo workspace packages so Next.js can process their TypeScript
  transpilePackages: [
    "@lettr/types",
    "@lettr/zod-schemas",
    "@lettr/utils",
    "@lettr/config",
  ],

  // Allow images from Cloudinary and common Nigerian property image hosts
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/lettr/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  // Security headers — helmet handles this on the API; Next.js needs its own
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },

  // Redirect /api/* calls to the backend during development
  // In production, set NEXT_PUBLIC_API_URL to your Railway API URL
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
