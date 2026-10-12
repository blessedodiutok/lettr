// File: apps/api/src/routes/payments.ts
// Base: /api/payments
// Public:        POST /webhook (Paystack — verified by signature)
// Tenant only:   POST /initiate
// Landlord only: POST /:id/release
// Authenticated: GET /my

import { CreateDisputeSchema, InitiatePaymentSchema, RefundPaymentSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

// Paystack webhook — raw body required for signature verification
// Tenant only
router.post(
  "/initiate",
  authenticate,
  requireRole("TENANT"),
  validate({ body: InitiatePaymentSchema }),
  paymentsController.initiatePayment,
);

// Landlord only — manually trigger escrow release (admin can also call this)
router.post(
  "/:id/release",
  authenticate,
  requireRole("LANDLORD", "ADMIN"),
  paymentsController.releaseEscrow,
);
router.post("/:id/verify", authenticate, paymentsController.verifyPayment);
router.post(
  "/:id/refund",
  authenticate,
  requireRole("ADMIN"),
  validate({ body: RefundPaymentSchema }),
  paymentsController.refundPayment,
);
router.post(
  "/:id/disputes",
  authenticate,
  validate({ body: CreateDisputeSchema }),
  paymentsController.createDispute,
);

// Any authenticated user — view own payments
router.get("/my", authenticate, paymentsController.getMyPayments);
router.get("/:id", authenticate, paymentsController.getPayment);

export default router;
