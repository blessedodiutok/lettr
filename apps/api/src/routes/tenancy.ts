// Base: /api/tenancy — agreements are created automatically when rent reaches escrow.

import { CancelTenancySchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/tenancy.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.use(authenticate);

router.get("/my", controller.getMyTenancies);
router.get("/:id", controller.getAgreement);
router.post("/:id/sign", requireRole("TENANT", "LANDLORD"), controller.signAgreement);
router.post("/:id/handover", requireRole("LANDLORD"), controller.markHandover);
router.post("/:id/confirm-move-in", requireRole("TENANT"), controller.confirmMoveIn);
router.post("/:id/cancel", requireRole("TENANT"), validate({ body: CancelTenancySchema }), controller.cancelTenancy);

export default router;
