// File: apps/api/src/services/uploads.service.ts
// Business logic for file uploads — Cloudinary integration

import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../lib/cloudinary.js";
import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";

export async function uploadPropertyPhotos(
  files: Express.Multer.File[],
  propertyId: string,
  landlordId: string,
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });
  if (!property) throw createError("Property not found", 404);
  if (property.landlordId !== landlordId)
    throw createError("Not authorised", 403);

  const existingCount = await prisma.propertyPhoto.count({
    where: { propertyId },
  });
  if (existingCount + files.length > 12) {
    throw createError("Maximum 12 photos per property", 400);
  }

  const uploadPromises = files.map(async (file, index) => {
    const { url, publicId } = await uploadToCloudinary(
      file.buffer,
      "properties",
    );
    return prisma.propertyPhoto.create({
      data: {
        propertyId,
        url,
        publicId,
        altText: `${property.title} — photo ${existingCount + index + 1}`,
        isCover: existingCount === 0 && index === 0,
        displayOrder: existingCount + index,
      },
    });
  });

  return Promise.all(uploadPromises);
}

export async function deletePhoto(publicId: string, landlordId: string) {
  const photo = await prisma.propertyPhoto.findFirst({ where: { publicId } });
  if (!photo) throw createError("Photo not found", 404);

  const property = await prisma.property.findUnique({
    where: { id: photo.propertyId },
  });
  if (property?.landlordId !== landlordId)
    throw createError("Not authorised", 403);

  await deleteFromCloudinary(publicId);
  await prisma.propertyPhoto.delete({ where: { id: photo.id } });
}

export async function uploadVerificationDocument(
  file: Express.Multer.File,
  documentType: string,
  documentNumber: string,
  userId: string,
) {
  const { url, publicId } = await uploadToCloudinary(
    file.buffer,
    "verification",
    "raw",
  );
  return prisma.$transaction(async (tx) => {
    const document = await tx.verificationDocument.create({
      data: { userId, documentType, documentNumber, documentUrl: url, publicId },
    });
    await tx.landlordProfile.updateMany({
      where: { userId },
      data: { verificationStatus: "PENDING_REVIEW", rejectionReason: null },
    });
    return document;
  });
}
