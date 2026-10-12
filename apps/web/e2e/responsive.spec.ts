// Public pages must fit a 360px phone without sideways scrolling, in both themes.

import { expect, test } from "@playwright/test";
import path from "node:path";

const SHOTS = process.env.E2E_SHOTS;
const PAGES = ["/", "/listings", "/how-it-works", "/for-landlords", "/help", "/auth/login", "/auth/signup", "/privacy"];

for (const theme of ["light", "dark"] as const) {
  test(`public pages fit a phone screen (${theme})`, async ({ browser, request }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 780 }, colorScheme: theme, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

    const search = await (await request.get("/api/listings?limit=1")).json();
    const listingPath = `/listings/${search.data.listings[0].id}`;

    for (const url of [...PAGES, listingPath]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${url} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
      if (SHOTS) {
        const name = url === "/" ? "home" : url.replace(/^\//, "").replace(/\//g, "-").replace(/-[a-z0-9]{20,}$/, "-detail");
        await page.screenshot({ path: path.join(SHOTS, `phone-${theme}-${name}.png`), fullPage: true });
      }
    }
    expect(errors, errors.join("\n")).toEqual([]);
    await context.close();
  });
}

test("desktop screenshots of public pages", async ({ page, request }) => {
  test.skip(!SHOTS, "Only needed when collecting screenshots");
  await page.setViewportSize({ width: 1366, height: 860 });
  const search = await (await request.get("/api/listings?limit=1")).json();
  for (const [url, name] of [
    ["/", "home"],
    ["/listings?state=Lagos", "listings"],
    [`/listings/${search.data.listings[0].id}`, "listing-detail"],
    ["/how-it-works", "how-it-works"],
  ] as const) {
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: path.join(SHOTS!, `desktop-${name}.png`), fullPage: true });
  }
});
