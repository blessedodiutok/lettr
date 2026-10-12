// File: apps/api/src/repositories/listings.repository.ts
// All Prisma queries for the listings domain

import type { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

const LISTING_INCLUDE = {
  property: {
    include: {
      photos: { orderBy: { displayOrder: "asc" as const } },
      amenities: true,
    },
  },
  landlord: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      landlordProfile: {
        select: {
          verificationStatus: true,
          averageRating: true,
          totalReviews: true,
          totalRentalsCompleted: true,
        },
      },
    },
  },
} satisfies Prisma.ListingInclude;

interface SearchFilters {
  state?: string;
  lga?: string;
  neighbourhood?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: number;
  isFurnished?: boolean;
  isServiced?: boolean;
}

export async function searchListings(
  filters: SearchFilters,
  skip: number,
  take: number,
  sortBy?: string,
) {
  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    property: {
      ...(filters.state && {
        state: { equals: filters.state, mode: "insensitive" },
      }),
      ...(filters.lga && { lga: { equals: filters.lga, mode: "insensitive" } }),
      ...(filters.neighbourhood && {
        neighbourhood: { contains: filters.neighbourhood, mode: "insensitive" },
      }),
      ...(filters.propertyType && {
        propertyType: filters.propertyType as never,
      }),
      ...(filters.bedrooms !== undefined && { bedrooms: filters.bedrooms }),
      ...(filters.isFurnished !== undefined && {
        isFurnished: filters.isFurnished,
      }),
      ...(filters.isServiced !== undefined && {
        isServiced: filters.isServiced,
      }),
    },
    ...(filters.minRent !== undefined || filters.maxRent !== undefined
      ? {
          annualRent: {
            ...(filters.minRent !== undefined && { gte: filters.minRent }),
            ...(filters.maxRent !== undefined && { lte: filters.maxRent }),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    sortBy === "price_asc"
      ? { annualRent: "asc" }
      : sortBy === "price_desc"
        ? { annualRent: "desc" }
        : sortBy === "newest"
          ? { publishedAt: "desc" }
          : { viewCount: "desc" }; // default: most popular

  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({
      where,
      include: LISTING_INCLUDE,
      orderBy,
      skip,
      take,
    }),
    prisma.listing.count({ where }),
  ]);

  return { listings, total };
}

export async function getMapListings(filters: Partial<SearchFilters>) {
  return prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      property: {
        ...(filters.state && {
          state: { equals: filters.state, mode: "insensitive" },
        }),
        ...(filters.lga && {
          lga: { equals: filters.lga, mode: "insensitive" },
        }),
        latitude: { not: null },
        longitude: { not: null },
      },
    },
    select: {
      id: true,
      annualRent: true,
      property: {
        select: {
          latitude: true,
          longitude: true,
          propertyType: true,
          neighbourhood: true,
          photos: { where: { isCover: true }, select: { url: true }, take: 1 },
        },
      },
    },
    take: 500, // Cap map pins to prevent browser overload
  });
}

export async function findListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      ...LISTING_INCLUDE,
      reviews: {
        include: {
          reviewer: {
            select: { firstName: true, lastName: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createPropertyWithListing(input: {
  property: Record<string, unknown> & { landlordId: string };
  listing: Record<string, unknown> & { landlordId: string };
}) {
  return prisma.$transaction(async (tx) => {
    const { amenities, ...propertyData } = input.property;
    const property = await tx.property.create({
      data: {
        ...(propertyData as Prisma.PropertyUncheckedCreateInput),
        ...(Array.isArray(amenities) && amenities.length
          ? { amenities: { create: amenities as Prisma.AmenityCreateWithoutPropertyInput[] } }
          : {}),
      },
    });
    const { landlordId, ...listingData } = input.listing;
    const listing = await tx.listing.create({
      data: {
        propertyId: property.id,
        landlordId,
        ...(listingData as Omit<Prisma.ListingUncheckedCreateInput, "propertyId" | "landlordId">),
        availableFrom: new Date(String(listingData.availableFrom)),
      },
      include: LISTING_INCLUDE,
    });
    return listing;
  });
}

export async function updateListing(id: string, data: Record<string, unknown>) {
  return prisma.listing.update({
    where: { id },
    data,
    include: LISTING_INCLUDE,
  });
}

export async function updatePropertyAndListing(
  id: string,
  propertyId: string,
  propertyData?: Record<string, unknown>,
  listingData?: Record<string, unknown>,
) {
  return prisma.$transaction(async (tx) => {
    if (propertyData) {
      const { amenities, ...fields } = propertyData;
      await tx.property.update({
        where: { id: propertyId },
        data: fields as Prisma.PropertyUpdateInput,
      });
      if (Array.isArray(amenities)) {
        await tx.amenity.deleteMany({ where: { propertyId } });
        await tx.amenity.createMany({
          data: amenities.map((amenity) => {
            const value = amenity as { type: Prisma.AmenityCreateManyInput["type"]; notes?: string };
            return { propertyId, type: value.type, notes: value.notes };
          }),
        });
      }
    }
    return tx.listing.update({
      where: { id },
      data: {
        ...(listingData as Prisma.ListingUpdateInput),
        ...(listingData?.availableFrom
          ? { availableFrom: new Date(String(listingData.availableFrom)) }
          : {}),
      },
      include: LISTING_INCLUDE,
    });
  });
}

export async function updateListingStatus(
  id: string,
  status: ListingStatus,
  publishedAt?: Date,
) {
  return prisma.listing.update({
    where: { id },
    data: { status, ...(publishedAt && { publishedAt }) },
    include: LISTING_INCLUDE,
  });
}

export async function deleteListing(id: string) {
  return prisma.listing.update({ where: { id }, data: { status: "ARCHIVED" } });
}

export async function incrementViewCount(id: string) {
  return prisma.listing.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });
}

export async function getListingsByLandlord(landlordId: string) {
  return prisma.listing.findMany({
    where: { landlordId },
    include: LISTING_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

export async function saveListing(userId: string, listingId: string) {
  return prisma.savedListing.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });
}

export async function unsaveListing(userId: string, listingId: string) {
  return prisma.savedListing.deleteMany({ where: { userId, listingId } });
}

export async function getSavedListings(userId: string) {
  return prisma.savedListing.findMany({
    where: { userId },
    include: { listing: { include: LISTING_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSavedListingIds(userId: string): Promise<string[]> {
  const saved = await prisma.savedListing.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return saved.map((s) => s.listingId);
}

export async function isListingSaved(
  listingId: string,
  userId: string,
): Promise<boolean> {
  const saved = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId, listingId } },
  });
  return !!saved;
}
