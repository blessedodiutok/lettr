// File: apps/api/src/middleware/upload.ts
// Multer configuration for file uploads
// Accepts images (JPEG, PNG, WebP) and PDFs only — max 5MB per file

import type { Request } from "express";
import multer from "multer";
import { createError } from "./errorHandler.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf", ...ALLOWED_IMAGE_TYPES];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Store files in memory (as Buffer) — we stream directly to Cloudinary
const memoryStorage = multer.memoryStorage();

function fileFilter(allowedTypes: string[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: multer.FileFilterCallback,
  ) => {
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        createError(
          `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
          400,
        ) as unknown as null,
        false,
      );
    }
  };
}

/** For property photo uploads — images only, up to 12 at once */
export const uploadPhotos = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 12 },
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

/** For verification document uploads — PDFs and images, 1 at a time */
export const uploadDocument = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: fileFilter(ALLOWED_DOC_TYPES),
});

/** For single avatar photo uploads */
export const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 }, // 2MB for avatars
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});
