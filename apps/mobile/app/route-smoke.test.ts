/// <reference types="node" />

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const routeFiles = [
  "app/listings.tsx",
  "app/list-property/index.tsx",
  "app/list-property/step1.tsx",
  "app/list-property/step2.tsx",
  "app/list-property/step3.tsx",
  "app/list-property/step4.tsx",
  "app/list-property/step5.tsx",
  "app/list-property/step6.tsx",
];

describe("mobile route entry points", () => {
  it.each(routeFiles)("%s exists", (routeFile) => {
    expect(existsSync(join(process.cwd(), routeFile))).toBe(true);
  });
});
