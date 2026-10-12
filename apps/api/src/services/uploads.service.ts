// Property photos and identity documents.

import { prisma } from "../lib/prisma.js";
import { deleteStoredFile, storePrivateFile, storePublicImage, type StoredFile } from "../lib/storage.js";
import { createError } from "../middleware/errorHandler.js";

const MAX_PHOTOS = 12;

async function ownedProperty(propertyId: string, landlordId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) throw createError("Property not found.", 404);
  if (property.landlordId !== landlordId) throw createError("You can only change your own listings.", 403);
  return property;
}

export async function uploadPropertyPhotos(files: Express.Multer.File[], propertyId: string, landlordId: string) {
  const property = await ownedProperty(propertyId, landlordId);
  const existingCount = await prisma.propertyPhoto.count({ where: { propertyId } });
  if (existingCount + files.length > MAX_PHOTOS) {
    throw createError(`A listing can have up to ${MAX_PHOTOS} photos. You can add ${MAX_PHOTOS - existingCount} more.`, 400);
  }

  // Upload in parallel, but roll back everything if any file fails so a
  // listing never ends up with half an upload.
  const results = await Promise.allSettled(files.map((file) => storePublicImage(file.buffer, "properties", file.mimetype)));
  const stored = results.filter((r): r is PromiseFulfilledResult<StoredFile> => r.status === "fulfilled").map((r) => r.value);
  if (stored.length !== files.length) {
    await Promise.all(stored.map((file) => deleteStoredFile(file.publicId)));
    const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if ((rejected?.reason as { statusCode?: number })?.statusCode === 400) throw rejected!.reason;
    throw createError("Some photos couldn't be uploaded. Please try again.", 502, { code: "UPLOAD_FAILED" });
  }

  await prisma.propertyPhoto.createMany({
    data: stored.map((file, index) => ({
      propertyId,
      url: file.url,
      publicId: file.publicId,
      altText: `${property.title} — photo ${existingCount + index + 1}`,
      isCover: existingCount === 0 && index === 0,
      displayOrder: existingCount + index,
    })),
  });
  return prisma.propertyPhoto.findMany({ where: { propertyId }, orderBy: { displayOrder: "asc" } });
}

/** Set the photo order; the first photo becomes the cover. */
export async function reorderPhotos(propertyId: string, photoIds: string[], landlordId: string) {
  await ownedProperty(propertyId, landlordId);
  const photos = await prisma.propertyPhoto.findMany({ where: { propertyId }, select: { id: true } });
  const known = new Set(photos.map((p) => p.id));
  if (photoIds.length !== photos.length || photoIds.some((id) => !known.has(id))) {
    throw createError("Include every photo of this listing exactly once.", 400);
  }
  await prisma.$transaction(
    photoIds.map((id, index) => prisma.propertyPhoto.update({ where: { id }, data: { displayOrder: index, isCover: index === 0 } })),
  );
  return prisma.propertyPhoto.findMany({ where: { propertyId }, orderBy: { displayOrder: "asc" } });
}

export async function deletePhoto(photoId: string, landlordId: string) {
  const photo = await prisma.propertyPhoto.findUnique({ where: { id: photoId }, include: { property: { include: { listings: true } } } });
  if (!photo) throw createError("Photo not found.", 404);
  if (photo.property.landlordId !== landlordId) throw createError("You can only change your own listings.", 403);

  const remaining = await prisma.propertyPhoto.count({ where: { propertyId: photo.propertyId } });
  if (remaining === 1 && photo.property.listings.some((listing) => listing.status === "ACTIVE")) {
    throw createError("A live listing needs at least one photo. Add another before removing this one.", 409);
  }

  await prisma.$transaction(async (tx) => {
    await tx.propertyPhoto.delete({ where: { id: photoId } });
    const rest = await tx.propertyPhoto.findMany({ where: { propertyId: photo.propertyId }, orderBy: { displayOrder: "asc" } });
    await Promise.all(rest.map((p, index) => tx.propertyPhoto.update({ where: { id: p.id }, data: { displayOrder: index, isCover: index === 0 } })));
  });
  await deleteStoredFile(photo.publicId);
  return prisma.propertyPhoto.findMany({ where: { propertyId: photo.propertyId }, orderBy: { displayOrder: "asc" } });
}

export async function uploadVerificationDocument(
  file: Express.Multer.File,
  documentType: string,
  documentNumber: string | undefined,
  userId: string,
) {
  const pending = await prisma.verificationDocument.count({ where: { userId, status: "PENDING_REVIEW" } });
  if (pending >= 3) throw createError("You already have documents waiting for review.", 409);

  const { url, publicId } = await storePrivateFile(file.buffer, "verification", file.mimetype);
  return prisma.$transaction(async (tx) => {
    const document = await tx.verificationDocument.create({
      data: { userId, documentType, documentNumber, documentUrl: url, publicId },
      select: { id: true, documentType: true, status: true, createdAt: true },
    });
    await tx.landlordProfile.updateMany({
      where: { userId, verificationStatus: { not: "VERIFIED" } },
      data: { verificationStatus: "PENDING_REVIEW", rejectionReason: null },
    });
    return document;
  });
}

export function getMyVerificationDocuments(userId: string) {
  return prisma.verificationDocument.findMany({
    where: { userId },
    select: { id: true, documentType: true, status: true, rejectionReason: true, createdAt: true, reviewedAt: true },
    orderBy: { createdAt: "desc" },
  });
}
