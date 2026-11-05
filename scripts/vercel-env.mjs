// Prints the environment variables the demo needs, with freshly generated secrets.
// Paste the output into Vercel: Project Settings → Environment Variables.
// Values are printed, never saved, so they can't end up in the repository.

import crypto from "node:crypto";

const secret = () => crypto.randomBytes(48).toString("hex");

console.log(`DEMO_MODE=true
JWT_ACCESS_SECRET=${secret()}
JWT_REFRESH_SECRET=${secret()}
CRON_SECRET=${secret()}`);
