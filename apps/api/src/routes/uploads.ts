// File: apps/api/src/routes/uploads.ts
// Base: /api/uploads
// Landlord: POST /photos — upload property photos
// Any user: POST /document — upload verification document
// Landlord: DELETE /photos/:publicId

import { UploadVerificationDocumentSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as uploadsController from "../controllers/uploads.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { uploadDocument, uploadPhotos } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.post(
  "/photos/:propertyId",
  authenticate,
  requireRole("LANDLORD"),
  uploadPhotos.array("photos", 12),
  uploadsController.uploadPropertyPhotos,
);
router.delete(
  "/photos/:publicId",
  authenticate,
  requireRole("LANDLORD"),
  uploadsController.deletePhoto,
);
router.post(
  "/document",
  authenticate,
  uploadDocument.single("document"),
  validate({ body: UploadVerificationDocumentSchema }),
  uploadsController.uploadVerificationDocument,
);
export default router;
