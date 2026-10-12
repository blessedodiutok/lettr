// Base: /api/payments
// The Paystack webhook is mounted in app.ts because it needs the raw body.

import { CreateDisputeSchema, InitiatePaymentSchema, RefundPaymentSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/payments.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.use(authenticate);

router.get("/my", controller.getMyPayments);
router.post("/initiate", requireRole("TENANT"), validate({ body: InitiatePaymentSchema }), controller.initiatePayment);

router.get("/:id", controller.getPayment);
router.post("/:id/verify", controller.verifyPayment);
router.post("/:id/simulate-success", requireRole("TENANT"), controller.simulateSuccess);
router.post("/:id/disputes", requireRole("TENANT", "LANDLORD"), validate({ body: CreateDisputeSchema }), controller.createDispute);
router.post("/:id/release", requireRole("ADMIN"), controller.releaseEscrow);
router.post("/:id/refund", requireRole("ADMIN"), validate({ body: RefundPaymentSchema }), controller.refundPayment);

export default router;
