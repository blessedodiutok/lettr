// Base: /api/admin — every route requires an ADMIN account.

import {
  AdminListQuerySchema,
  ModerateListingSchema,
  ModerateUserSchema,
  ResolveDisputeSchema,
  ReviewVerificationSchema,
} from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.use(authenticate, requireRole("ADMIN"));
const list = validate({ query: AdminListQuerySchema });

router.get("/overview", controller.overview);
router.get("/verifications", controller.verificationQueue);
router.get("/verifications/:id/document", controller.verificationDocument);
router.patch("/verifications/:id", validate({ body: ReviewVerificationSchema }), controller.reviewVerification);
router.get("/users", list, controller.users);
router.patch("/users/:id", validate({ body: ModerateUserSchema }), controller.moderateUser);
router.get("/listings", list, controller.listings);
router.patch("/listings/:id", validate({ body: ModerateListingSchema }), controller.moderateListing);
router.get("/disputes", controller.disputes);
router.patch("/disputes/:id", validate({ body: ResolveDisputeSchema }), controller.resolveDispute);
router.get("/payments", list, controller.payments);
router.get("/audit-log", list, controller.auditLog);

export default router;
