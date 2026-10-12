// File: apps/api/src/services/reviews.service.ts
// Business logic for reviews
// Uses reviews.repository for all Prisma queries

import { prisma } from "../lib/prisma.js";
import { createError } from "../middleware/errorHandler.js";
import * as reviewsRepo from "../repositories/reviews.repository.js";

export async function createReview(
  body: {
    listingId?: string;
    revieweeId: string;
    rating: number;
    title: string;
    body: string;
  },
  reviewerId: string,
) {
  if (reviewerId === body.revieweeId)
    throw createError("You cannot review yourself", 400);
  if (body.rating < 1 || body.rating > 5)
    throw createError("Rating must be between 1 and 5", 400);

  const tenancy = await prisma.tenancyAgreement.findFirst({
    where: {
      isHandoverConfirmed: true,
      ...(body.listingId && { listingId: body.listingId }),
      OR: [
        { tenantId: reviewerId, landlordId: body.revieweeId },
        { landlordId: reviewerId, tenantId: body.revieweeId },
      ],
    },
    select: { listingId: true },
  });
  if (!tenancy) {
    throw createError("Reviews require a completed tenancy", 403);
  }

  return prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        ...body,
        listingId: body.listingId ?? tenancy.listingId,
        reviewerId,
        isVerified: true,
      },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    });
    const aggregate = await tx.review.aggregate({
      where: { revieweeId: body.revieweeId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const rating = {
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count.rating,
    };
    const reviewee = await tx.user.findUnique({
      where: { id: body.revieweeId },
      select: { role: true },
    });
    if (!reviewee) throw createError("Reviewee not found", 404);
    if (reviewee.role === "LANDLORD") {
      await tx.landlordProfile.update({ where: { userId: body.revieweeId }, data: rating });
    } else if (reviewee.role === "TENANT") {
      await tx.tenantProfile.update({ where: { userId: body.revieweeId }, data: rating });
    }
    return review;
  });
}

export async function getListingReviews(listingId: string) {
  return reviewsRepo.findReviewsByListing(listingId);
}

export async function getUserReviews(userId: string) {
  return reviewsRepo.findReviewsByReviewee(userId);
}
