// Create or update the admin account without touching any other data.
//   pnpm --filter @lettr/api run db:seed-admin
// Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD, with development defaults.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL ?? "admin@lettr-test.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "Lettr@2024!";
if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
  throw new Error("Set ADMIN_PASSWORD to create an admin in production");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const passwordHash = await bcrypt.hash(password, 12);
const admin = await prisma.user.upsert({
  where: { email },
  create: { email, passwordHash, role: "ADMIN", firstName: "Lettr", lastName: "Admin", isEmailVerified: true },
  update: { role: "ADMIN", isActive: true, isEmailVerified: true },
});
console.info(`Admin ready: ${admin.email}${process.env.ADMIN_PASSWORD ? "" : " (password: Lettr@2024!)"}`);
await prisma.$disconnect();
