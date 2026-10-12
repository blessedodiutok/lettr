// File: apps/api/src/routes/reviews.ts
// Base: /api/reviews
// Authenticated: POST /, GET /listing/:listingId, GET /user/:userId

import { CreateReviewSchema } from "@lettr/zod-schemas";
import { Router } from "express";
import * as reviewsController from "../controllers/reviews.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router: Router = Router();
router.post(
  "/",
  authenticate,
  validate({ body: CreateReviewSchema }),
  reviewsController.createReview,
);
router.get("/listing/:listingId", reviewsController.getListingReviews);
router.get("/user/:userId", reviewsController.getUserReviews);
export default router;
