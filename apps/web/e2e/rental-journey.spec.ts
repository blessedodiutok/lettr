// The whole rental journey through the real UI, with two fresh accounts:
// a landlord lists a home (details, photos, ID, publish) and a tenant finds it,
// messages, accepts an offer, pays into escrow, signs and confirms move-in.
// Needs the API running without Paystack keys (simulated checkout) and with
// emails printed to its log, which is where OTP codes are read from.

import { expect, type Browser, type Page, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const API_LOG = process.env.E2E_API_LOG ?? "";
const SHOTS = process.env.E2E_SHOTS;
const FIXTURES = process.env.E2E_FIXTURES ?? path.join(__dirname, "fixtures");
const PASSWORD = "Journey1234";
const RUN = Date.now().toString(36);
const consoleErrors: string[] = [];

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
}

function latestOtp(email: string): string {
  const log = fs.readFileSync(API_LOG, "utf8");
  const escaped = email.replace(/[.+]/g, "\\$&");
  const matches = [...log.matchAll(new RegExp(`To: ${escaped}[\\s\\S]*?code is (\\d{6})`, "g"))];
  if (!matches.length) throw new Error(`No OTP in API log for ${email}`);
  return matches[matches.length - 1][1];
}

async function newUser(browser: Browser, role: "TENANT" | "LANDLORD", firstName: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("console", (msg) => msg.type() === "error" && consoleErrors.push(`[${role}] ${msg.text()}`));
  const email = `smoke-e2e-${role.toLowerCase()}-${RUN}@example.com`;

  await page.goto(`/auth/signup?role=${role}`);
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Last name").fill("Journey");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/auth\/verify/);
  await page.waitForTimeout(500);
  await page.getByLabel("Digit 1").fill(latestOtp(email));
  await expect(page).toHaveURL(role === "LANDLORD" ? /\/landlord\/dashboard/ : /\/dashboard/);
  return { page, email };
}

async function confirmDialog(page: Page, button: string | RegExp) {
  await page.getByRole("dialog").getByRole("button", { name: button }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("tenant rents a home from a landlord, end to end", async ({ browser }) => {
  // ── Landlord lists a home ───────────────────────────────────────────────
  const landlord = await newUser(browser, "LANDLORD", "Emeka");
  const L = landlord.page;
  await shot(L, "10-landlord-overview-new");
  const title = `Journey test flat ${RUN} Admiralty`;

  await L.goto("/landlord/listings/new");
  await L.getByLabel("Listing title").fill(title);
  await L.getByLabel("Home type").selectOption("TWO_BEDROOM");
  await L.getByLabel("Street address").fill("12 Admiralty Way");
  await L.getByLabel("Neighbourhood").fill("Lekki Phase 1");
  await L.getByLabel("Local government area").fill("Eti-Osa");
  await L.getByLabel("Description").fill("Bright two-bedroom flat with a fitted kitchen, prepaid meter, borehole water and 24-hour estate security near Admiralty Way.");
  await L.getByRole("button", { name: "Borehole" }).click();
  await L.getByLabel("Annual rent").fill("4500000");
  await L.getByLabel("Caution fee").fill("450000");
  await L.getByLabel("Service charge").fill("300000");
  await shot(L, "11-listing-editor");
  await L.getByRole("button", { name: "Save and add photos" }).click();
  await expect(L).toHaveURL(/\/landlord\/listings\/.+\/edit/);

  await L.locator('input[type="file"][accept*="image/jpeg"]').setInputFiles([path.join(FIXTURES, "flat.jpg"), path.join(FIXTURES, "room.jpg")]);
  await expect(L.getByText("2 photos added")).toBeVisible();
  await expect(L.getByRole("button", { name: "Publish listing" })).toBeDisabled();
  await shot(L, "12-listing-photos");

  await L.goto("/landlord/verification");
  await L.locator('input[type="file"][accept*="application/pdf"]').setInputFiles(path.join(FIXTURES, "id.pdf"));
  await L.getByRole("button", { name: "Submit for review" }).click();
  await expect(L.getByText(/Document submitted/)).toBeVisible();
  await L.goBack();
  await L.reload();
  await L.getByRole("button", { name: "Publish listing" }).click();
  await expect(L.getByText("Your listing is live")).toBeVisible();

  // ── Tenant finds it and messages the landlord ───────────────────────────
  const tenant = await newUser(browser, "TENANT", "Ngozi");
  const T = tenant.page;
  await T.goto(`/listings?q=${encodeURIComponent(`Journey test flat ${RUN}`)}`);
  await T.getByRole("link", { name: title }).click();
  await expect(T.getByRole("heading", { name: title })).toBeVisible();
  await expect(T.getByText("Total to move in")).toBeVisible();
  await shot(T, "20-listing-detail-tenant");
  await T.getByRole("button", { name: /Message Emeka/ }).click();
  await T.getByRole("dialog").getByRole("button", { name: "Send message" }).click();
  await expect(T).toHaveURL(/\/messages\/.+/);
  const threadUrl = T.url();

  // ── Landlord offers the home ────────────────────────────────────────────
  await L.goto(threadUrl);
  await L.getByRole("button", { name: "Offer the home" }).click();
  await confirmDialog(L, "Send offer");
  await expect(L.getByRole("status").getByText("Offer sent")).toBeVisible();

  // ── Tenant accepts and pays into escrow ─────────────────────────────────
  await T.reload();
  await expect(T.getByRole("button", { name: "Accept offer" })).toBeVisible();
  await shot(T, "21-thread-offer");
  await T.getByRole("button", { name: "Accept offer" }).click();
  await confirmDialog(T, "Accept offer");
  await T.getByRole("link", { name: "Pay into escrow" }).first().click();
  await expect(T.getByRole("heading", { name: "Pay into escrow" })).toBeVisible();
  await shot(T, "22-checkout");
  await T.getByRole("button", { name: /securely/ }).click();
  await T.getByRole("button", { name: "Simulate a successful payment" }).click();
  await expect(T.getByRole("heading", { name: "Payment received" })).toBeVisible();
  await expect(T.getByText(/LTR-\d{4}-\d{6}/)).toBeVisible();
  await T.getByRole("link", { name: "Review and sign the agreement" }).click();

  // ── Both sign, landlord hands over, tenant confirms ─────────────────────
  await T.getByRole("button", { name: "Sign agreement" }).click();
  await confirmDialog(T, "Sign agreement");
  const tenancyUrl = T.url();

  await L.goto(tenancyUrl);
  await L.getByRole("button", { name: "Sign agreement" }).click();
  await confirmDialog(L, "Sign agreement");
  await L.getByRole("button", { name: "Mark keys handed over" }).click();
  await confirmDialog(L, "Yes, keys handed over");

  await T.reload();
  await expect(T.getByRole("button", { name: "I have the keys" })).toBeVisible();
  await shot(T, "23-tenancy-confirm");
  await T.getByRole("button", { name: "I have the keys" }).click();
  await confirmDialog(T, "Yes, release payment");
  await expect(T.getByText("Tenancy started").first()).toBeVisible();
  await expect(T.getByRole("heading", { name: /Review Emeka/ })).toBeVisible();
  await shot(T, "24-tenancy-started");

  await L.goto("/landlord/payouts");
  await expect(L.getByText("Paid out").first()).toBeVisible();
  await shot(L, "13-landlord-payouts");
  await L.goto("/landlord/dashboard");
  await expect(L.getByText("Your listings")).toBeVisible();
  await shot(L, "14-landlord-overview");
  await T.goto("/dashboard");
  await expect(T.getByText("Conversations")).toBeVisible();
  await shot(T, "25-tenant-home");

  // ── Admin sees the money and the audit trail ────────────────────────────
  const adminContext = await browser.newContext();
  const A = await adminContext.newPage();
  await A.goto("/auth/login");
  await A.getByLabel("Email address").fill(process.env.E2E_ADMIN_EMAIL ?? "admin@lettr-test.com");
  await A.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "Lettr@2024!");
  await A.getByRole("button", { name: "Log in" }).click();
  await expect(A.getByRole("heading", { name: "Admin overview" })).toBeVisible();
  await shot(A, "30-admin-overview");
  await A.goto("/admin/verifications");
  await expect(A.getByText("Emeka Journey").first()).toBeVisible();
  await A.getByRole("button", { name: "Approve" }).first().click();
  await expect(A.getByRole("status").getByText("Verification decision recorded")).toBeVisible();

  expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
});
