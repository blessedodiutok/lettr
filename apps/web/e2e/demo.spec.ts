// The portfolio demo, as a visitor uses it. Runs against a production build with
// DEMO_MODE=true and a demo database (see docs/VERCEL.md). Skipped everywhere else.
//   E2E_DEMO=1 E2E_BASE_URL=http://localhost:3200 pnpm exec playwright test e2e/demo.spec.ts

import { expect, test, type Page } from "@playwright/test";

const SHOTS = process.env.E2E_SHOTS;

test.skip(!process.env.E2E_DEMO, "Set E2E_DEMO=1 to run against a demo build");
test.describe.configure({ mode: "serial" });

const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

async function viewAs(page: Page, label: "Tenant" | "Landlord" | "Admin", home: RegExp) {
  await page.getByRole("group", { name: "View the demo as" }).getByRole("button", { name: label }).click();
  await expect(page).toHaveURL(home);
  await expect(page.getByRole("group", { name: "View the demo as" }).getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
}

/** Confirm the open dialog. Its main action is always the last button. */
async function confirm(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button").last().click();
  await expect(dialog).toBeHidden();
}

function watchForProblems(page: Page) {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(`page error: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 500) problems.push(`${response.status()} ${response.url()}`);
  });
  return problems;
}

test("a stranger sees it's a demo, on every kind of page, and can't sign up", async ({ page }) => {
  const problems = watchForProblems(page);
  for (const path of ["/", "/listings", "/how-it-works", "/contact", "/auth/login", "/demo"]) {
    await page.goto(path);
    await expect(page.getByRole("complementary", { name: "Portfolio demo" })).toContainText("No real money moves");
  }

  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByText("Sample content").first()).toBeVisible();

  await page.goto("/contact");
  await expect(page.getByText("these contact details aren't real")).toBeVisible();

  await page.goto("/auth/signup");
  await expect(page.getByRole("heading", { name: "Sign-up is off in this demo" })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);

  const signup = await page.request.post("/api/auth/signup", { data: { email: "someone@example.com" } });
  expect(signup.status()).toBe(403);

  // Listing links survive a reset, because IDs are fixed.
  await page.goto("/listings/demo-listing-06");
  await expect(page.getByRole("heading", { name: "1-Bedroom Flat in Ajah" })).toBeVisible();

  const listing = await (await page.request.get("/api/listings/demo-listing-06")).json();
  expect(typeof listing.data.annualRent).toBe("number");

  expect(problems).toEqual([]);
});

test("a complete rental, from offer to payout", async ({ page }) => {
  const problems = watchForProblems(page);

  // Tenant: accept the waiting offer.
  await page.goto("/demo");
  await shot(page, "demo-tour");
  await page.getByRole("button", { name: /Continue as tenant/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await shot(page, "demo-tenant-home");

  await page.goto("/messages");
  await page.getByRole("link", { name: /Lekki Phase 1/ }).first().click();
  await expect(page.getByText(/offered you this home/)).toBeVisible();
  await shot(page, "demo-tenant-offer");
  await page.getByRole("button", { name: "Accept offer" }).click();
  await confirm(page);

  // Pay on the simulated checkout. No card details are ever asked for.
  await page.getByRole("link", { name: "Pay into escrow" }).click();
  await expect(page).toHaveURL(/\/pay\/demo-listing-01/);
  await expect(page.getByText("no money moves")).toBeVisible();
  await page.getByRole("button", { name: "Continue to simulated payment" }).click();
  await expect(page).toHaveURL(/\/simulate/);
  await expect(page.locator('input[autocomplete*="cc-"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Simulate a successful payment" }).click();
  await expect(page).toHaveURL(/\/result/);

  // Tenant signs.
  await page.goto("/tenancies");
  await page.getByRole("link", { name: /Lekki Phase 1/ }).first().click();
  await page.getByRole("button", { name: "Sign agreement" }).click();
  await confirm(page);
  await expect(page.getByText(/Signed/).first()).toBeVisible();
  const tenancyUrl = page.url();

  // Landlord signs and hands over.
  await viewAs(page, "Landlord", /\/landlord\/dashboard$/);
  await shot(page, "demo-landlord-home");
  await page.goto(tenancyUrl);
  await page.getByRole("button", { name: "Sign agreement" }).click();
  await confirm(page);
  await page.getByRole("button", { name: "Mark keys handed over" }).click();
  await confirm(page);
  await expect(page.getByRole("button", { name: "Mark keys handed over" })).toBeHidden();

  // Tenant confirms move-in, which pays the landlord.
  await viewAs(page, "Tenant", /\/dashboard$/);
  await page.goto(tenancyUrl);
  await page.getByRole("button", { name: /have the keys|Confirm/ }).first().click();
  await confirm(page);
  await expect(page.getByText("Tenancy started")).toBeVisible();
  await expect(page.getByText("Paid out").first()).toBeVisible();
  await shot(page, "demo-tenancy-complete");

  expect(problems).toEqual([]);
});

test("a landlord adds a photo, and the file never leaves the browser", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/auth/login");
  await page.getByRole("button", { name: /Continue as landlord/ }).click();
  await expect(page).toHaveURL(/\/landlord\/dashboard$/);

  await page.goto("/landlord/listings");
  await page.locator('a[href$="/edit"]').first().click();
  await expect(page).toHaveURL(/\/landlord\/listings\/.+\/edit/);
  await expect(page.locator("ul img").first()).toBeVisible();
  const before = await page.locator("ul img").count();

  // A real file is chosen. Only a four-byte placeholder should be sent.
  const uploads: number[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/uploads/photos/") && request.method() === "POST") uploads.push(request.postDataBuffer()?.length ?? 0);
  });
  await expect(page.getByText("your photos stay on your device")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: "my-house.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(200_000, 7) });
  await expect(page.locator("ul img")).toHaveCount(before + 1);
  expect(uploads).toHaveLength(1);
  expect(uploads[0]).toBeLessThan(2_000);

  expect(problems).toEqual([]);
});

test("an admin settles a dispute, checks an ID, and can't lock anyone out", async ({ page }) => {
  const problems = watchForProblems(page);
  await page.goto("/demo");
  await page.getByRole("button", { name: /Continue as admin/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await shot(page, "demo-admin-home");

  await page.goto("/admin/verifications");
  await expect(page.getByText("Bola Adeyemi")).toBeVisible();
  await shot(page, "demo-admin-verifications");

  await page.goto("/admin/disputes");
  await expect(page.getByText(/water heater/)).toBeVisible();

  // Sample document, audit-logged like the real thing.
  const token = await page.evaluate(async () => {
    const response = await fetch("/api/auth/refresh", { method: "POST" });
    return (await response.json()).data.accessToken as string;
  });
  const headers = { Authorization: `Bearer ${token}` };
  const queue = await (await page.request.get("/api/admin/verifications", { headers })).json();
  const documentId = queue.data[0]?.id ?? queue.data.items?.[0]?.id;
  const document = await page.request.get(`/api/admin/verifications/${documentId}/document`, { headers });
  expect(document.status()).toBe(200);
  expect(document.headers()["content-type"]).toContain("image/svg+xml");

  const suspend = await page.request.patch("/api/admin/users/demo-tenant-tunde", { headers, data: { isActive: false, reason: "Trying to break the demo" } });
  expect(suspend.status()).toBe(403);

  expect(problems).toEqual([]);
});

test("the nightly job needs its secret, and restores the starting data", async ({ page }) => {
  expect((await page.request.get("/api/demo/reset")).status()).toBe(401);
  expect((await page.request.get("/api/demo/reset", { headers: { Authorization: "Bearer wrong" } })).status()).toBe(401);

  const secret = process.env.CRON_SECRET;
  test.skip(!secret, "Set CRON_SECRET to the server's value to run the reset");
  const reset = await page.request.get("/api/demo/reset", { headers: { Authorization: `Bearer ${secret}` }, timeout: 120_000 });
  expect(reset.status()).toBe(200);

  await page.goto("/demo");
  await page.getByRole("button", { name: /Continue as tenant/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto("/messages");
  await page.getByRole("link", { name: /Lekki Phase 1/ }).first().click();
  await expect(page.getByText(/offered you this home/)).toBeVisible();
});

test("a visitor can reset once, and is then told to wait", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Reset the demo" }).click();
  await expect(page).toHaveURL(/\/demo\?reset=1/, { timeout: 120_000 });
  const again = await page.request.post("/api/demo/reset");
  expect(again.status()).toBe(429);
});

test("no page scrolls sideways at phone width, in light or dark", async ({ browser }) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({ viewport: { width: 360, height: 740 }, colorScheme });
    const page = await context.newPage();
    for (const path of ["/", "/demo", "/auth/login", "/auth/signup", "/listings", "/listings/demo-listing-06", "/contact"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle").catch(() => undefined);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} in ${colorScheme}`).toBeLessThanOrEqual(0);
    }
    if (SHOTS) {
      await page.goto("/demo");
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.screenshot({ path: `${SHOTS}/demo-phone-${colorScheme}.png` });
    }
    await context.close();
  }
});
