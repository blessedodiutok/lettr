// Development seed: replaces the database with the sample data.

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { SAMPLE_PASSWORD, seedSampleData } from "../src/demo/sampleData.js";

if (process.env.NODE_ENV === "production") throw new Error("The seed wipes data and must not run in production");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

console.info("🌱 Starting Lettr database seed (this deletes ALL existing data)...");
await seedSampleData(prisma);
console.info("");
console.info("🎉 Seed complete! 10 listings, 2 landlords, 3 tenants, 1 admin.");
console.info(`   Every account uses the password ${SAMPLE_PASSWORD}`);
console.info("   Landlords: emeka@lettr-test.com, amaka@lettr-test.com");
console.info("   Tenants:   tunde@lettr-test.com, ngozi@lettr-test.com, chidi@lettr-test.com");
console.info("   Admin:     admin@lettr-test.com");
await prisma.$disconnect();
