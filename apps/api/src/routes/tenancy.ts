// File: apps/api/src/routes/tenancy.ts
// Base: /api/tenancy
// Authenticated: POST / (landlord), GET /:id, POST /:id/sign, POST /:id/handover

import { CreateTenancyAgreementSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as tenancyController from "../controllers/tenancy.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.post(
  "/",
  authenticate,
  requireRole("LANDLORD"),
  validate({ body: CreateTenancyAgreementSchema }),
  tenancyController.createAgreement,
);
router.get("/my", authenticate, tenancyController.getMyTenancies);
router.get("/:id", authenticate, tenancyController.getAgreement);
router.post("/:id/sign", authenticate, tenancyController.signAgreement);
router.post(
  "/:id/handover",
  authenticate,
  requireRole("LANDLORD"),
  tenancyController.confirmHandover,
);
export default router;
