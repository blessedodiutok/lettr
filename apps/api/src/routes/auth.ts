// File: apps/api/src/routes/auth.ts
// Base: /api/auth
// Public:        POST /signup, POST /login, POST /verify-otp, POST /refresh
// Authenticated: POST /logout, GET /me

import { LoginSchema, SignupSchema, VerifyOtpSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

// Public routes
router.post("/signup", validate({ body: SignupSchema }), authController.signup);
router.post("/login", validate({ body: LoginSchema }), authController.login);
router.post(
  "/verify-otp",
  validate({ body: VerifyOtpSchema }),
  authController.verifyOtp,
);
router.post("/refresh", authController.refresh);

// Authenticated routes
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);

export default router;
