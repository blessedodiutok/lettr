# LETTR

Rent directly from verified landlords in Nigeria — no agent fees. Tenants pay into escrow; the money is released to the landlord only after both parties sign the tenancy agreement and the tenant confirms move-in.

This monorepo contains the API, the web app, the mobile app and the code they share.

```
apps/
  api/      Express 5 + Prisma 7 (PostgreSQL) — auth, listings, offers, escrow, admin
  web/      Next.js 16 — public site, tenant, landlord and admin dashboards
  mobile/   Expo SDK 55 (expo-router, NativeWind) — tenant and landlord app
packages/
  types/        Shared TypeScript types and reference data (states, amenities, labels)
  utils/        Pricing, rental rules, status labels, formatting — used by all three apps
  zod-schemas/  Request validation shared by the API and the forms
  config/       ESLint and TypeScript presets
```

## Requirements

- Node.js 22 or newer (`.nvmrc`), pnpm 11 (`corepack enable`)
- PostgreSQL 15+ — `docker compose up -d` starts PostgreSQL and Redis for you
- Optional: Redis. Without it the API keeps sessions, codes and rate limits in memory (development only).

## Getting started

```bash
pnpm install
docker compose up -d                       # PostgreSQL + Redis (or use your own)

cp apps/api/.env.example apps/api/.env      # then set the JWT secrets (see below)
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

pnpm db:migrate                            # apply migrations
pnpm db:seed                               # sample landlords, tenants, listings and an admin
pnpm dev                                   # API :4000, web :3000, Expo dev server
```

Generate the two JWT secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Open http://localhost:3000. Every seeded account uses the password `Lettr@2024!`:

| Role     | Email                                         |
| -------- | --------------------------------------------- |
| Admin    | admin@lettr-test.com                          |
| Landlord | emeka@lettr-test.com, amaka@lettr-test.com     |
| Tenant   | tunde@lettr-test.com, ngozi@lettr-test.com, chidi@lettr-test.com |

`pnpm db:seed` resets the sample data. To add only an admin to an existing database, run `pnpm db:seed-admin` (set `ADMIN_EMAIL` and `ADMIN_PASSWORD` to choose the credentials).

### Running without third-party keys

Outside production, the API runs fully offline. Leave a key empty or as its placeholder and the API falls back:

| Service    | Without keys                                                                     |
| ---------- | -------------------------------------------------------------------------------- |
| Paystack   | Payments are simulated: checkout opens a LETTR test page where you confirm the payment |
| Cloudinary | Uploads are saved to `apps/api/.uploads` and served from `/api/media`           |
| Email      | Emails, including sign-up codes, are printed to the API console                 |
| Redis      | An in-memory store (sessions are lost when the API restarts)                    |
| Firebase   | Push to Expo push tokens still works; native FCM tokens are skipped             |

None of these fallbacks run when `NODE_ENV=production`: the API refuses to start without Redis, Paystack, Cloudinary and an email provider.

### Mobile

Set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WEB_URL` in `apps/mobile/.env` to your computer's LAN address (for example `http://192.168.1.42:4000`), then scan the QR code from `pnpm --filter @lettr/mobile dev` with Expo Go. Listing creation, ID verification and bank details open the website; everything else runs in the app.

## How a rental works

1. A landlord verifies their ID, adds photos and publishes a listing. An admin reviews the ID.
2. A tenant messages the landlord, may book an inspection, and the landlord makes an offer (open for **5 days**).
3. The tenant accepts and pays within **72 hours**. The money is held in escrow.
4. Both parties sign the generated agreement. If the landlord hasn't signed within **7 days**, the tenant can cancel for a full refund.
5. The landlord marks the keys handed over. The tenant confirms move-in, or the escrow releases automatically **7 days** after handover.
6. A dispute pauses the release until an admin resolves it (release or refund).

The rules live in `RENTAL_RULES` (`packages/utils`) and the state machines in `apps/api/src/domain` and `apps/api/src/services`. A scheduler in the API (`src/jobs/scheduler.ts`, every 5 minutes) lapses expired offers and unpaid acceptances, releases due escrow and sends reminders. Set `SCHEDULER_ENABLED=false` on all but one instance if you run several without Redis; with Redis it uses a lock.

Pricing: a 3% platform fee is shown on every listing. The savings figure compares against a typical 15% agent fee and is always net of the platform fee.

## Scripts

| Command                  | What it does                                                    |
| ------------------------ | --------------------------------------------------------------- |
| `pnpm dev`               | Run API, web and mobile in watch mode                            |
| `pnpm check`             | Typecheck, lint and unit-test every package (what CI runs)       |
| `pnpm test`              | Unit tests only                                                  |
| `pnpm test:e2e`          | Playwright browser tests against a running web + API (see below) |
| `pnpm build`             | Production builds                                                |
| `pnpm db:migrate`        | Create/apply migrations in development                           |
| `pnpm db:seed`           | Reset sample data (refuses to run in production)                 |
| `pnpm db:seed-admin`     | Create or update the admin account only                          |
| `pnpm db:studio`         | Browse the database                                              |
| `pnpm --filter @lettr/api db:cleanup-smoke` | Delete accounts whose email starts with `smoke-` and everything they created |

## Testing

- **Unit tests** (`pnpm test`): pricing, rental rules, agreement text, session rotation, workflow guards, and the web route guard.
- **End-to-end** (`pnpm test:e2e`): the full rental journey in a real browser — landlord sign-up, listing, photos, ID upload, admin approval, tenant search, messaging, offer, simulated payment, signing, handover, move-in and payout — plus a 360px-wide layout check in light and dark mode.

The end-to-end tests need the API and web running, with simulated Paystack. Sign-up codes are read from the API log, so redirect the API output to a file:

```bash
pnpm --filter @lettr/api dev > api.log 2>&1 &
pnpm --filter @lettr/web build && pnpm --filter @lettr/web start &
E2E_API_LOG=$PWD/api.log pnpm test:e2e
pnpm --filter @lettr/api db:cleanup-smoke     # remove the test accounts afterwards
```

| Variable             | Purpose                                                           |
| -------------------- | ----------------------------------------------------------------- |
| `E2E_BASE_URL`       | Web app URL (default `http://localhost:3000`)                     |
| `E2E_API_LOG`        | File the API writes to — required for sign-up codes               |
| `E2E_FIXTURES`       | Folder with `flat.jpg`, `room.jpg` and `id.pdf` (default `apps/web/e2e/fixtures`) |
| `E2E_SHOTS`          | Save screenshots to this folder (optional)                        |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | Admin login (defaults to the seeded admin)       |

CI (`.github/workflows/ci.yml`) runs `pnpm check`, the web build and a mobile bundle on every pull request, then the end-to-end suite against a fresh database.

## Environment variables

Each app has a commented example file: `apps/api/.env.example`, `apps/web/.env.example`, `apps/mobile/.env.example`. The essentials:

**API** — `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (required everywhere); `REDIS_URL`, `PAYSTACK_SECRET_KEY`, `CLOUDINARY_*`, `RESEND_API_KEY` or `SMTP_*`, `EMAIL_FROM`, `WEB_URL`, `CORS_ORIGINS`, `COOKIE_DOMAIN` (required in production); `PAYSTACK_TRANSFER_ENABLED` (send automatic payouts), `FIREBASE_SERVICE_ACCOUNT_JSON`, `TRUST_PROXY`, `SCHEDULER_ENABLED`.

**Web** — `API_INTERNAL_URL` (the browser calls `/api` on the web origin and Next.js forwards it, so the refresh cookie stays first-party), `NEXT_PUBLIC_APP_URL`.

**Mobile** — `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_WEB_URL`, `EXPO_PUBLIC_PROJECT_ID` (from `eas init`, for push notifications).

## Before going live

The app currently runs on **placeholder content**: anything marked "Sample" in development must be replaced.

- [ ] Replace the marketing content in `apps/web/src/content/sample.ts` (testimonials, statistics, team) and set `IS_SAMPLE_CONTENT` to `false`
- [ ] Confirm the company name, email addresses, phone number and address on the contact, about and privacy pages and in the footer (the phone number is a placeholder)
- [ ] Have a lawyer review the privacy policy, terms and the tenancy agreement template (`apps/api/src/domain/agreement.ts`)
- [ ] Live Paystack keys and webhook secret; register `https://<api>/api/payments/webhook` in the Paystack dashboard
- [ ] Decide on payouts: set `PAYSTACK_TRANSFER_ENABLED=true` for automatic transfers. Until then, released escrow is recorded with a `MANUAL-` reference and must be paid out by hand
- [ ] Cloudinary, Redis (Upstash or similar), Resend with a verified sending domain, Firebase service account
- [ ] `eas init` for the mobile project ID, app store listings, and testing on real Android and iOS devices
- [ ] Generate new JWT secrets for production; never reuse development values
- [ ] Create the production admin with `ADMIN_PASSWORD` set, and remove the seeded test accounts if the seed was ever run against that database
- [ ] Database backups and error monitoring
