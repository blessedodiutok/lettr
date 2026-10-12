// Base: /api/users

import { BankAccountSchema, UpdateProfileSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as controller from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.js";
import { requireRole } from "../middleware/roles.js";
import { uploadAvatar } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.get("/landlords/:id", controller.getPublicLandlord);

router.get("/me", authenticate, controller.getProfile);
router.put("/me", authenticate, validate({ body: UpdateProfileSchema }), controller.updateProfile);
router.post("/me/avatar", authenticate, uploadAvatar.single("avatar"), controller.uploadAvatar);
router.get("/me/banks", authenticate, requireRole("LANDLORD"), controller.getBanks);
router.put("/me/bank-account", authenticate, requireRole("LANDLORD"), validate({ body: BankAccountSchema }), controller.setBankAccount);
router.get("/:id/screening", authenticate, controller.getScreeningProfile);

export default router;
