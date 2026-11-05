// Development only: point seeded photos whose Cloudinary files don't exist at
// placeholder images. Leaves every other row untouched.
//   pnpm --filter @lettr/api exec tsx --env-file=.env prisma/dev/fixSamplePhotos.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { SAMPLE_PHOTO_URLS } from "../../src/demo/samplePhotos.js";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to run in production");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const photos = await prisma.propertyPhoto.findMany({
  where: { url: { startsWith: "https://res.cloudinary.com/lettr/" } },
  orderBy: [{ propertyId: "asc" }, { displayOrder: "asc" }],
});
let n = 0;
for (const photo of photos) {
  await prisma.propertyPhoto.update({ where: { id: photo.id }, data: { url: SAMPLE_PHOTO_URLS[n++ % SAMPLE_PHOTO_URLS.length] } });
}
console.info(`Updated ${photos.length} sample photo URLs`);
await prisma.$disconnect();
