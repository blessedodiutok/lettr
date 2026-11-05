import type { Metadata, Viewport } from "next";
import { DM_Sans, Newsreader } from "next/font/google";
import { DemoBar } from "../components/demo/DemoBar";
import { IS_DEMO } from "../lib/demo";
import "./globals.css";
import { Providers } from "./providers";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", display: "swap", weight: ["400", "500", "600"] });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", weight: ["400", "500", "600", "700"] });

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: IS_DEMO ? "Lettr: a rental marketplace concept" : "Lettr — Rent directly from landlords in Nigeria", template: "%s · Lettr" },
  description: IS_DEMO
    ? "A working demo of a rental marketplace for Nigeria, with escrow, e-signing and an admin console. Fictional homes, simulated payments."
    : "Rent directly from ID-checked landlords in Lagos, Abuja and Port Harcourt. No agent fees, and your rent is held in escrow until you have the keys.",
  ...(IS_DEMO ? { robots: { index: false, follow: false } } : {}),
  applicationName: "Lettr",
  openGraph: { type: "website", siteName: "Lettr", locale: "en_NG" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#09141f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" suppressHydrationWarning className={`${newsreader.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:shadow-2">
          Skip to content
        </a>
        <Providers>
          <DemoBar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
