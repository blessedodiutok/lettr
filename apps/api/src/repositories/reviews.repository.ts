// File: apps/api/src/repositories/reviews.repository.ts
// All Prisma queries for the reviews domain

import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const REVIEW_INCLUDE = {
  reviewer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
} satisfies Prisma.ReviewInclude;

export async function createReview(data: Prisma.ReviewUncheckedCreateInput) {
  return prisma.review.create({
    data,
    include: REVIEW_INCLUDE,
  });
}

export async function findReviewById(id: string) {
  return prisma.review.findUnique({
    where: { id },
    include: REVIEW_INCLUDE,
  });
}

export async function findReviewsByListing(listingId: string) {
  return prisma.review.findMany({
    where: { listingId },
    include: REVIEW_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function findReviewsByReviewee(revieweeId: string) {
  return prisma.review.findMany({
    where: { revieweeId },
    include: REVIEW_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function findReviewsByReviewer(reviewerId: string) {
  return prisma.review.findMany({
    where: { reviewerId },
    include: REVIEW_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAverageRatingForUser(
  revieweeId: string,
): Promise<{ avg: number; count: number }> {
  const result = await prisma.review.aggregate({
    where: { revieweeId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return {
    avg: result._avg.rating ?? 0,
    count: result._count.rating,
  };
}

export async function hasUserReviewedListing(
  reviewerId: string,
  listingId: string,
): Promise<boolean> {
  const existing = await prisma.review.findFirst({
    where: { reviewerId, listingId },
    select: { id: true },
  });
  return !!existing;
}
