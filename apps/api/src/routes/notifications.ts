// File: apps/api/src/routes/notifications.ts
// Base: /api/notifications

import { FcmTokenSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as notificationsController from "../controllers/notifications.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.get("/", authenticate, notificationsController.getNotifications);
router.patch("/:id/read", authenticate, notificationsController.markRead);
router.patch("/read-all", authenticate, notificationsController.markAllRead);
router.post(
  "/fcm-token",
  authenticate,
  validate({ body: FcmTokenSchema }),
  notificationsController.registerFcmToken,
);
router.delete(
  "/fcm-token",
  authenticate,
  validate({ body: FcmTokenSchema }),
  notificationsController.unregisterFcmToken,
);
export default router;
