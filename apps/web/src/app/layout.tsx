// File: apps/web/src/app/layout.tsx
// Root layout — Server Component
// Wraps every page with fonts, theme provider, and global query client

import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/* ── Google Fonts ──────────────────────────────────────────────────────────── */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

/* ── Metadata ──────────────────────────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "Lettr — Find Your Home, Cut the Agent",
    template: "%s | Lettr",
  },
  description:
    "Rent directly from verified landlords across Lagos, Abuja, and Port Harcourt. No agent fees. Save up to 15% on every rental.",
  keywords: [
    "rent house Lagos",
    "rent flat Abuja",
    "Nigeria property no agent fee",
    "landlord direct rental",
    "Lettr",
  ],
  authors: [{ name: "Lettr" }],
  creator: "Lettr",
  openGraph: {
    type: "website",
    siteName: "Lettr",
    title: "Lettr — Find Your Home, Cut the Agent",
    description: "Rent directly from verified landlords. No agent fees.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lettr — Find Your Home, Cut the Agent",
    description: "Rent directly from verified landlords. No agent fees.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* ── Root Layout ───────────────────────────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${dmSans.variable}`}
    >
      {/*
        suppressHydrationWarning on body: next-themes injects data-theme
        before React hydrates, causing a mismatch without this.
      */}
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
