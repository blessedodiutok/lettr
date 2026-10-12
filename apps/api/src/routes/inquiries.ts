// File: apps/api/src/routes/inquiries.ts
// Base: /api/inquiries
// Tenant only:   POST / (create inquiry)
// Authenticated: GET /:id, POST /:id/message, POST /:id/inspection,
//                PATCH /:id/status, GET /my

import {
  CreateInquirySchema,
  ScheduleInspectionSchema,
  SendMessageSchema,
  UpdateInquiryStatusSchema,
} from "@lettr/zod-schemas";
import { Router } from "express";
import * as inquiriesController from "../controllers/inquiries.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.post(
  "/",
  authenticate,
  requireRole("TENANT"),
  validate({ body: CreateInquirySchema }),
  inquiriesController.createInquiry,
);
router.get("/my", authenticate, inquiriesController.getMyInquiries);
router.get("/:id", authenticate, inquiriesController.getInquiry);
router.post(
  "/:id/message",
  authenticate,
  validate({ body: SendMessageSchema }),
  inquiriesController.sendMessage,
);
router.post(
  "/:id/inspection",
  authenticate,
  validate({ body: ScheduleInspectionSchema }),
  inquiriesController.scheduleInspection,
);
router.patch(
  "/:id/status",
  authenticate,
  validate({ body: UpdateInquiryStatusSchema }),
  inquiriesController.updateStatus,
);

export default router;
