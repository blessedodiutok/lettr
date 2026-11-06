# Development checkpoint: end of Phase 2

| | |
| --- | --- |
| **Date** | 5 November 2026 |
| **Tag** | `checkpoint-phase-2` |
| **Branch** | `phase-2` (`main` still holds the Phase 1 baseline, tag `phase-1-baseline`) |
| **Checks at this point** | `pnpm check`: 19 of 19 tasks pass (typecheck, lint, 39 unit tests) |

To return to this exact state: `git checkout checkpoint-phase-2`.

## Current milestone

**Phase 2, core features and backlog: complete and awaiting the owner's review.** The full rental journey works end to end on the web against simulated external services. The mobile app is built to the agreed scope but has not been run on a device. The product is not ready for real customers or real money. See [Remaining tasks](#remaining-tasks).

Phase 3 (launch readiness) has been proposed and not started. It starts only on the owner's explicit request.

## Last completed task

Commit `da1674e`: readable listing status labels on the admin overview. It followed `9baf564`, which added the README, CI workflow, docker-compose, the production email-provider check and the test-data cleanup script. The Phase 2 report was then published for review.

| Commit | Scope |
| --- | --- |
| `ffd5403` | API: blockers, enforced rental workflow, money and auth hardening |
| `3bb52ff` | Web: rebuild on the approved design system, every journey wired up |
| `8fd2d89` | Mobile: login and styling fixes, tenant journeys, landlord actions |
| `9baf564` | Foundation: README, CI, local services, production checks |
| `da1674e` | Web: admin overview status labels |

## Work in progress

No code was in progress at this checkpoint, and the working tree was clean apart from this document.

The next piece of work, a free-tier Vercel deployment for portfolio use, branches from this tag.

## Remaining tasks

### Needed before real customers

- [ ] Run the mobile app on Android and iOS devices, including push notifications. Never tested on a device.
- [ ] Test with live keys in staging: Paystack, Cloudinary, Resend, Redis, Firebase. All were simulated so far.
- [ ] Run the CI workflow on GitHub. It was written before the repository had a remote, so it has never run.
- [ ] Legal review of the privacy policy, terms and tenancy agreement template.
- [ ] Replace sample marketing content and the placeholder phone number, then set `IS_SAMPLE_CONTENT` to `false`.
- [ ] Add error tracking and structured logs. Errors go to the console only.
- [ ] Decide on automatic payouts. With `PAYSTACK_TRANSFER_ENABLED` off, releases are recorded with a `MANUAL-` reference and paid by hand.
- [ ] Rotate any real keys that were ever in this OneDrive-synced folder.

The README's "Before going live" section has the full checklist.

### Planned features and debt

- [ ] Receipt and signed-agreement PDFs
- [ ] Job queue with retries for email, push and payouts (a failed notification is not retried today)
- [ ] Map search, maintenance requests, lease-end reminders and renewals
- [ ] Live messaging (an open thread polls every 8 seconds)
- [ ] Listing creation and dark mode on mobile
- [ ] Generated shared types and a typed API client
- [ ] Accessibility audit with a screen reader
- [ ] Settle on one data-access style: workflow services use Prisma directly, simpler services use repositories

## Relevant files and components

| Area | Where |
| --- | --- |
| Rental rules and pricing | `packages/utils/src/index.ts` (`RENTAL_RULES`, `calculateMoveInCost`) |
| Inquiry state machine | `apps/api/src/domain/inquiryRules.ts`, `apps/api/src/services/inquiries.service.ts` |
| Escrow and payments | `apps/api/src/services/payments.service.ts`, `apps/api/src/lib/paystack.ts` |
| Tenancy, signing, handover | `apps/api/src/services/tenancy.service.ts`, `apps/api/src/domain/agreement.ts` |
| Sessions and auth | `apps/api/src/lib/sessions.ts`, `apps/api/src/services/auth.service.ts`, `apps/api/src/middleware/auth.ts` |
| Rate limits | `apps/api/src/middleware/rateLimits.ts` |
| Background jobs | `apps/api/src/jobs/scheduler.ts` |
| Environment rules | `apps/api/src/config/env.ts` |
| Database | `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts` |
| Web route guard and API proxy | `apps/web/src/proxy.ts`, `apps/web/next.config.ts` |
| Web pages | `apps/web/src/app/`, grouped by role |
| Sample marketing content | `apps/web/src/content/sample.ts` |
| Mobile app | `apps/mobile/app/`, `apps/mobile/lib/session.ts` |
| Tests | `apps/api/src/**/*.test.ts`, `apps/web/src/proxy.test.ts`, `apps/web/e2e/` |
| CI | `.github/workflows/ci.yml` |

## Found after this checkpoint

Building the `vercel-portfolio` branch exposed three bugs that also exist at this tag. They're fixed on that branch only:

| Bug | Effect | Fix |
| --- | --- | --- |
| The API's money serializer never ran | Money reached clients as strings. The tenant's "saved" total on Payments is wrong with two or more payments | Commit `205a325`, which can be cherry-picked as it is |
| The seed's delete order fails once a dispute exists | `pnpm db:seed` crashes on a database that has been used | `TRUNCATE` in `apps/api/src/demo/sampleData.ts` |
| `pnpm db:seed` gives no warning that it deletes everything | Accounts you created yourself are lost | Warnings in the README |

The CI workflow has also now run for the first time, on `vercel-portfolio`, where all three jobs pass. Getting there took two changes: pinning Ubuntu 24.04, because Playwright 1.60 does not support 26.04, and building the web app from the repository root in the end-to-end job. Building from inside `apps/web` failed in CI with a Turbopack error on the Google Fonts URL. The cause of that error was not established.

The portfolio demo has been live since 6 November 2026 at <https://lettr-ashy.vercel.app>, built from `vercel-portfolio`. The earlier Vercel failures came from a project with no environment variables and no database. See [VERCEL.md](VERCEL.md#current-deployment).

## Recommended next steps

1. Review the running app. The README's "Getting started" section has the commands and seeded logins. Note that `pnpm db:seed` deletes everything in the database.
2. Merge `phase-2` into `main` once the review is done, with the fixes above. It is unmerged on purpose.
3. Confirm the CI workflow passes on GitHub and fix anything it finds.
4. To continue toward launch, start Phase 3 in this order: staging with test-mode keys, device testing, operations (error tracking, logs, job queue, backups), PDFs, then audits.
