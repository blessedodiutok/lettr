// Base: /api/auth
// Public:        POST /signup, /login, /verify-otp, /resend-otp, /refresh, /logout,
//                /forgot-password, /reset-password
// Authenticated: GET /me, POST /change-password

import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
  SignupSchema,
  VerifyOtpSchema,
} from "@lettr/zod-schemas";
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.js";
import { emailSendLimit, loginLimit, otpVerifyLimit, refreshLimit, signupLimit } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();

router.post("/signup", signupLimit, emailSendLimit, validate({ body: SignupSchema }), authController.signup);
router.post("/login", ...loginLimit, validate({ body: LoginSchema }), authController.login);
router.post("/verify-otp", otpVerifyLimit, validate({ body: VerifyOtpSchema }), authController.verifyOtp);
router.post("/resend-otp", emailSendLimit, validate({ body: ResendOtpSchema }), authController.resendOtp);
router.post("/refresh", refreshLimit, authController.refresh);
router.post("/logout", authController.logout);
router.post("/forgot-password", emailSendLimit, validate({ body: ForgotPasswordSchema }), authController.forgotPassword);
router.post("/reset-password", otpVerifyLimit, validate({ body: ResetPasswordSchema }), authController.resetPassword);

router.get("/me", authenticate, authController.getMe);
router.post("/change-password", authenticate, validate({ body: ChangePasswordSchema }), authController.changePassword);

export default router;
