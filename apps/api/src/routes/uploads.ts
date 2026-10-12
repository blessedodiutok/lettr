// Base: /api/uploads
// Landlord: property photos (upload, reorder, delete)
// Any user: identity documents for verification (stored privately)

import { ReorderPhotosSchema, UploadVerificationDocumentSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/uploads.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { uploadDocument, uploadPhotos } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.use(authenticate);
const landlord = requireRole("LANDLORD");

router.post("/photos/:propertyId", landlord, uploadPhotos.array("photos", 12), controller.uploadPropertyPhotos);
router.put("/photos/:propertyId/order", landlord, validate({ body: ReorderPhotosSchema }), controller.reorderPhotos);
router.delete("/photos/item/:photoId", landlord, controller.deletePhoto);

router.get("/documents", controller.getMyDocuments);
router.post("/document", uploadDocument.single("document"), validate({ body: UploadVerificationDocumentSchema }), controller.uploadVerificationDocument);

export default router;
