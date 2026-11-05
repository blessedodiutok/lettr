// Portfolio demo settings. See docs/VERCEL.md.

export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/** Optional credit and links shown on the demo's tour page. */
export const PORTFOLIO = {
  author: process.env.NEXT_PUBLIC_PORTFOLIO_AUTHOR,
  url: process.env.NEXT_PUBLIC_PORTFOLIO_URL,
  repo: process.env.NEXT_PUBLIC_PORTFOLIO_REPO,
};

/**
 * Sent instead of the visitor's file: it passes the upload checks, and the
 * visitor's photos and documents never leave their browser.
 */
export function demoPlaceholderFile(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "demo.jpg", { type: "image/jpeg" });
}
