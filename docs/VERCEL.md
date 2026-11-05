# Deploying the portfolio demo to Vercel

The `vercel-portfolio` branch runs Lettr as a public demo on Vercel's free Hobby plan: one project, one URL and one free database. Visitors can walk through a complete rental as a tenant, a landlord and an admin.

To see where the main product stands, read [CHECKPOINT.md](CHECKPOINT.md). This demo is not the launch version.

## Deploy it

These steps assume you've already imported the repository into Vercel. If you see the old Phase 1 design, this is the fix.

**Why it happens:** the current app is on the `vercel-portfolio` branch, while `main` still holds the Phase 1 baseline. Vercel [picks `main` as a new project's Production Branch](https://vercel.com/docs/git#default-configuration) whenever one exists, so you have to tell it which branch to use. Changing GitHub's default branch doesn't affect this, so you don't need `gh repo edit`.

You'll work in two places:

- **The Vercel website:** [vercel.com/dashboard](https://vercel.com/dashboard), then open your `lettr` project. Most of the steps happen here.
- **A terminal, for step 4 only:** in VS Code, with the LETTR folder open, choose **Terminal → New Terminal** from the top menu. A panel opens at the bottom, and its prompt should end in `\LETTR>`.

### Step 1: Point Vercel at the right branch

**Where:** Vercel website, `lettr` project → **Settings** → **Environments** → **Production** → **Branch Tracking**.

**Do:** change the branch name from `main` to `vercel-portfolio`, then click **Save**.

If Vercel answers **No deployments found for 'vercel-portfolio'. Deploy the branch, then retry**, it has never built that branch. Do steps 2 to 4, then get a first build of the branch: push a commit to it, or use a Deploy Hook (**Settings → Git → Deploy Hooks**, with the branch `vercel-portfolio`). Once the branch appears under **Deployments**, save this setting again. A branch's first build is a Preview, and a Preview builds without a database. A production build won't: it stops and names what's missing.

**What it does:** new production deployments are built from `vercel-portfolio`. The live site doesn't change yet.

**Check:** reload the page. Branch Tracking still shows `vercel-portfolio`.

### Step 2: Check the Root Directory

**Where:** Vercel website, `lettr` project → **Settings** → **Build and Deployment** → **Root Directory**. On some layouts it's under **General**.

**Do:** make sure it says `apps/web`. If it doesn't, change it and click **Save**. Leave the build and install commands as they are, because `apps/web/vercel.json` supplies them.

**What it does:** tells Vercel where the web app sits inside the repository.

**Check:** the field shows `apps/web` after you reload.

### Step 3: Connect the database

**Where:** Vercel website, `lettr` project → **Settings** → **Environment Variables**.

**Look first:** if `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are listed, the database is already connected, so go to step 4.

**If they aren't listed:**

1. Open the **Storage** tab of the project and click **Create Database**.
2. Choose **Neon**, the free plan and the region **US East (N. Virginia)**, then finish creating it.
3. Connect it to this project with **Production** and **Preview** ticked.

**What it does:** creates the free database and gives the project its connection details.

**Check:** both variables now appear under **Settings → Environment Variables**.

### Step 4: Add the secrets

**Look first:** if `DEMO_MODE`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` and `CRON_SECRET` are already under **Settings → Environment Variables**, go to step 5. Check that `DEMO_MODE` is exactly `true`.

**Where to run this:** the VS Code terminal.

```powershell
node scripts/vercel-env.mjs
```

**What it does:** prints four lines, three of them with newly generated secrets. It changes nothing and saves nothing.

**Check:** you see four lines starting `DEMO_MODE=true`, `JWT_ACCESS_SECRET=`, `JWT_REFRESH_SECRET=` and `CRON_SECRET=`. If you get `Cannot find module`, the terminal is in the wrong folder or on the wrong branch. Run `git switch vercel-portfolio` in the LETTR folder and try again.

**Then, on the Vercel website:**

1. Select the four lines in the terminal and copy them. Keep them private: don't commit them or send them to anyone.
2. Go to **Settings → Environment Variables** and click **Add**.
3. Paste all four lines into the **Key** box. Vercel splits them into four entries.
4. Select **Production** and **Preview** as the environments and click **Save**. A branch's first build runs as a Preview, so it needs them too.

**Check:** all four names are listed under Environment Variables.

### Step 5: Build the current version

**Where:** Vercel website, `lettr` project → **Deployments** → **Create Deployment**.

**Do:** enter `vercel-portfolio` as the branch, then click **Create Deployment**.

Don't use **Redeploy** on an existing row. That rebuilds the same old Phase 1 commit.

**What it does:** builds the latest code on that branch, creates the database tables and loads the sample data.

**Check:** a new row appears showing the branch `vercel-portfolio` and the label **Production**, and reaches **Ready** after a few minutes. If it says **Error**, click the row and read the build log. The first lines say exactly which setting is missing. Fix it, then repeat this step.

### Step 6: Confirm the site is the current version

Open your production address, which is shown on the project's main page. Press **Ctrl+F5** to skip the browser's copy of the old page, then check these:

| Open | You should see |
| --- | --- |
| The home page | A dark bar across the top reading **Portfolio demo. Fictional homes and people. No real money moves.** The Phase 1 site doesn't have it |
| `/demo` | **See a whole rental, from every side**, with three "Continue as…" cards |
| `/api/health` | Text containing `"database":true,"store":true` |
| `/demo`, then **Continue as tenant** | A dashboard for Tunde with rentals in progress |

Finally, on the Vercel website, **Settings → Cron Jobs** should list `/api/demo/reset`.

### Good to know

- **Future updates:** anything pushed to `vercel-portfolio` now deploys to production automatically.
- **Other branches:** pushes to `main` or `phase-2` create Preview deployments, which don't touch the live site. They may fail, because those branches can't build the demo. That's harmless.
- **Your credit (optional):** add these under **Settings → Environment Variables**, then repeat step 5.

| Variable | Shows on the tour page |
| --- | --- |
| `NEXT_PUBLIC_PORTFOLIO_AUTHOR` | "Built by" your name |
| `NEXT_PUBLIC_PORTFOLIO_URL` | Makes your name a link |
| `NEXT_PUBLIC_PORTFOLIO_REPO` | A "Read the source code" link. Only useful if the repository is public |

Send clients to `/demo`, which has the one-click accounts and a suggested route.

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
