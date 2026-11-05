# Deploying the portfolio demo to Vercel

The `vercel-portfolio` branch runs Lettr as a public demo on Vercel's free Hobby plan: one project, one URL and one free database. Visitors can walk through a complete rental as a tenant, a landlord and an admin.

To see where the main product stands, read [CHECKPOINT.md](CHECKPOINT.md). This demo is not the launch version.

## Deploy it

You need a Vercel account connected to GitHub. The database is created from inside Vercel, and neither service asks for a card on its free plan.

1. **Make this branch the one Vercel deploys.** Vercel builds the repository's default branch, which is still `main` (the Phase 1 baseline). Run:

   ```bash
   gh repo edit blessedodiutok/lettr --default-branch vercel-portfolio
   ```

   Alternatively, merge this branch into `main`.

2. **Import the repository.** At [vercel.com/new](https://vercel.com/new), choose `lettr`, then click **Edit** next to Root Directory and select `apps/web`. Leave the other settings alone, because `apps/web/vercel.json` supplies them.

3. **Add the environment variables.** Run this and paste the output into the Environment Variables section of the same screen:

   ```bash
   node scripts/vercel-env.mjs
   ```

4. **Click Deploy, and let this first build fail.** It stops with a message saying `DATABASE_URL` is missing, which is expected. The project has to exist before a database can be connected to it.

5. **Add the database.** In the project, open **Storage → Create Database → Neon**. Choose the free plan and the region **US East (N. Virginia)**, which is closest to Vercel's default function region. Connect it to the project, with Production selected.

6. **Redeploy.** Open **Deployments**, then choose **⋯ → Redeploy** on the latest one. The build creates the tables and the sample data, and the site is live.

Optional settings, added in the same place and followed by a redeploy, credit you on the tour page:

| Variable | Shows |
| --- | --- |
| `NEXT_PUBLIC_PORTFOLIO_AUTHOR` | "Built by" your name |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Makes your name a link |
| `NEXT_PUBLIC_PORTFOLIO_REPO` | A "Read the source code" link. Only useful if the repository is public |

Send clients to `/demo`, which has the one-click accounts and a suggested route.

### Check that it worked

- `/api/health` reports `"database":true,"store":true`.
- `/demo` signs you in as each role with one click.
- Under **Settings → Cron Jobs**, the `/api/demo/reset` job is listed. Clicking **Run** resets the data.

## Staying within the free plan

Vercel's Hobby plan is for **non-commercial personal use only**. A portfolio piece fits that. If someone pays you to build, change or host a deployment, Vercel counts it as commercial and it needs the Pro plan, so a paid client's real product shouldn't run on this. Read [Vercel's definition](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage) if you're unsure.

| Limit (checked November 2026) | How the demo stays within it |
| --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby): 1M function calls, 4 active CPU-hours, 100 GB transfer per month | Pages are mostly static, and images load from their own hosts, not Vercel's optimiser. Each visitor is limited to 300 changes an hour |
| [Vercel Cron](https://vercel.com/docs/cron-jobs/usage-and-pricing): once a day on Hobby, within the hour | One nightly reset at 03:00 UTC |
| Vercel request body: 4.5 MB | Visitors' files are never sent. A four-byte placeholder goes instead |
| [Neon free](https://neon.com/docs/introduction/plans): 100 compute-hours per month, 1 GB | Small data, wiped nightly. It sleeps after 5 idle minutes |

If usage ever hits a limit, the site pauses until the next period, and no charge is made. After a quiet spell, the first visit takes a few seconds longer while the database wakes up.

## How it works

`DEMO_MODE=true` is the only switch. It changes the following:

| Normally | In the demo | Where |
| --- | --- | --- |
| Separate API server, reached through a rewrite | Express runs inside Next.js | `apps/web/src/app/api/[...path]/route.ts`, `apps/api/scripts/bundle-demo.mjs` |
| Redis | A PostgreSQL table | `apps/api/src/lib/postgresStore.ts` |
| Paystack | Always simulated, even if keys are present | `apps/api/src/config/env.ts` |
| Email and push | Never sent | `apps/api/src/lib/mailer.ts`, `firebase.ts` |
| Cloudinary uploads | Nothing stored. Sample photos and a sample document are used | `apps/api/src/lib/storage.ts`, `apps/web/src/lib/demo.ts` |
| 5-minute scheduler | Not running. The data resets nightly instead, so timed rules such as lapsing offers never come due | `apps/api/src/demo/reset.ts` |
| Open sign-up | Off, along with anything that would let one visitor lock out another | `apps/api/src/demo/guards.ts` |

The sample rentals are created by calling the real services, so every stage a visitor finds is one the rental rules can reach.

### Protections

Because this is public and anyone can sign in as an admin:

- **No personal data.** Sign-up is off, ID numbers aren't saved, and files never leave the browser. Otherwise the shared admin account would expose visitors' details to everyone.
- **It can't be mistaken for a real service.** Every page carries a banner, sample content is labelled, and search engines are told not to index it, so fictional homes don't appear in real rental searches.
- **No real payments.** There's no way to reach Paystack, and no payment details are ever asked for.
- **It won't wipe the wrong database.** A reset refuses to run on a database the demo didn't create.

**Remaining risk:** visitors can still type free text, such as messages and listing titles, that other visitors will see until the next reset. React escapes it, so it can't run as code, but it could be rude. If that happens, reset the demo from `/demo`.

## Working on the demo locally

Use a separate database, because a reset wipes whatever it's given:

```bash
createdb lettr_demo
export DEMO_MODE=true NODE_ENV=production \
  DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/lettr_demo?schema=public" \
  JWT_ACCESS_SECRET=at-least-32-characters-long-access JWT_REFRESH_SECRET=at-least-32-characters-long-refresh \
  CRON_SECRET=any-local-secret API_INTERNAL_URL=http://localhost:3200

pnpm --filter @lettr/api exec prisma generate
pnpm --filter @lettr/api exec prisma migrate deploy
pnpm --filter @lettr/api run demo:seed-if-empty
pnpm --filter @lettr/web build
pnpm --filter @lettr/web exec next start -p 3200
```

Then run the browser tests with `E2E_DEMO=1 E2E_BASE_URL=http://localhost:3200 pnpm --filter @lettr/web exec playwright test e2e/demo.spec.ts`. To test the store against a real database, set `TEST_DATABASE_URL` and run `pnpm --filter @lettr/api test`.

`next build` may rewrite `apps/web/next-env.d.ts`. Don't commit that change.

## Not covered by this demo

- The mobile app. It stays in the repository but needs a device and a native build, so it isn't deployed.
- Real Paystack, Cloudinary, email and push, which remain untested with live keys. See the checkpoint.
