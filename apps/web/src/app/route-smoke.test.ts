/// <reference types="node" />

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeFiles = [
  "src/app/auth/forgot-password/page.tsx",
  "src/app/dashboard/messages/page.tsx",
  "src/app/dashboard/payments/page.tsx",
  "src/app/dashboard/saved/page.tsx",
  "src/app/dashboard/tenancy/page.tsx",
  "src/app/landlord/listings/new/page.tsx",
  "src/app/landlord/listings/[id]/edit/page.tsx",
  "src/app/notifications/page.tsx",
  "src/app/settings/page.tsx",
];

describe("web route entry points", () => {
  it.each(routeFiles)("%s exists", (routeFile) => {
    expect(existsSync(join(process.cwd(), routeFile))).toBe(true);
  });
});
