// File: apps/api/src/controllers/reviews.controller.ts
import type { NextFunction, Request, Response } from "express";
import * as reviewsService from "../services/reviews.service.js";

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const review = await reviewsService.createReview(req.body, req.user!.id);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
}

export async function getListingReviews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviews = await reviewsService.getListingReviews(
      String(req.params.listingId),
    );
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}

export async function getUserReviews(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const reviews = await reviewsService.getUserReviews(String(req.params.userId));
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
}
