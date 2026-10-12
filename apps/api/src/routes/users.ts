// File: apps/api/src/routes/users.ts
// Base: /api/users

import { UpdateProfileSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { authenticate } from "../middleware/auth.js";
import { uploadAvatar } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.get("/me", authenticate, usersController.getProfile);
router.put("/me", authenticate, validate({ body: UpdateProfileSchema }), usersController.updateProfile);
router.post(
  "/me/avatar",
  authenticate,
  uploadAvatar.single("avatar"),
  usersController.uploadAvatar,
);
router.get("/:id/screening", authenticate, usersController.getScreeningProfile);
export default router;
