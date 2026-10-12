import { ModerateListingSchema, ModerateUserSchema, ResolveDisputeSchema, ReviewVerificationSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.use(authenticate, requireRole("ADMIN"));
router.get("/verifications", controller.verificationQueue);
router.patch("/verifications/:id", validate({ body: ReviewVerificationSchema }), controller.reviewVerification);
router.get("/disputes", controller.disputes);
router.patch("/disputes/:id", validate({ body: ResolveDisputeSchema }), controller.resolveDispute);
router.patch("/listings/:id", validate({ body: ModerateListingSchema }), controller.moderateListing);
router.patch("/users/:id", validate({ body: ModerateUserSchema }), controller.moderateUser);
export default router;
