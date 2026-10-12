// Base: /api/inquiries — conversations between a tenant and a landlord about one listing.
// Static paths are declared before /:id.

import {
  CloseInquirySchema,
  CreateInquirySchema,
  MakeOfferSchema,
  ScheduleInspectionSchema,
  SendMessageSchema,
} from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/inquiries.controller.js";
import { authenticate } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimits.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.use(authenticate);

const messageLimit = rateLimit({ name: "messages", windowSeconds: 60, max: 30, message: "You're sending messages too quickly." });

router.post("/", requireRole("TENANT"), messageLimit, validate({ body: CreateInquirySchema }), controller.createInquiry);
router.get("/my", controller.getMyInquiries);
router.get("/unread-count", controller.getUnreadCount);
router.get("/for-listing/:listingId", requireRole("TENANT"), controller.getForListing);

router.get("/:id", controller.getInquiry);
router.post("/:id/message", messageLimit, validate({ body: SendMessageSchema }), controller.sendMessage);
router.post("/:id/close", validate({ body: CloseInquirySchema }), controller.closeInquiry);

router.post("/:id/inspection", validate({ body: ScheduleInspectionSchema }), controller.scheduleInspection);
router.post("/:id/inspection/confirm", controller.confirmInspection);
router.post("/:id/inspection/complete", requireRole("LANDLORD"), controller.completeInspection);

router.post("/:id/offer", requireRole("LANDLORD"), validate({ body: MakeOfferSchema }), controller.makeOffer);
router.post("/:id/offer/withdraw", requireRole("LANDLORD"), controller.withdrawOffer);
router.post("/:id/offer/accept", requireRole("TENANT"), controller.acceptOffer);
router.post("/:id/offer/decline", requireRole("TENANT"), validate({ body: CloseInquirySchema }), controller.declineOffer);

export default router;
