// Demo data from the command line. The Vercel build runs seed-if-empty.
//   tsx --conditions=lettr-source src/demo/cli.ts seed-if-empty | reset

import { prisma } from "../lib/prisma.js";
import { resetDemo, seedIfEmpty } from "./reset.js";

const command = process.argv[2];

try {
  if (command === "seed-if-empty") {
    console.info(`Demo data: ${await seedIfEmpty()}`);
  } else if (command === "reset") {
    console.info(await resetDemo() ? "Demo data: reset" : "Demo data: another reset is already running");
  } else {
    throw new Error(`Unknown command "${command}". Use seed-if-empty or reset.`);
  }
} finally {
  await prisma.$disconnect();
}
