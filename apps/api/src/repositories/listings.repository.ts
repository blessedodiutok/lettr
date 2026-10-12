// Prisma queries for listings and properties.

import type { ListingStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const LISTING_INCLUDE = {
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
      createdAt: true,
      landlordProfile: {
        select: {
          verificationStatus: true,
          averageRating: true,
          totalReviews: true,
          totalRentalsCompleted: true,
          businessName: true,
        },
      },
    },
  },
} satisfies Prisma.ListingInclude;

export interface SearchFilters {
  q?: string;
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

export function buildSearchWhere(filters: SearchFilters): Prisma.ListingWhereInput {
  const insensitive = (value: string) => ({ equals: value, mode: "insensitive" as const });
  const contains = (value: string) => ({ contains: value, mode: "insensitive" as const });
  const terms = filters.q?.split(/[\s,]+/).filter((term) => term.length > 1).slice(0, 5) ?? [];

  return {
    status: "ACTIVE",
    property: {
      ...(filters.state && { state: insensitive(filters.state) }),
      ...(filters.lga && { lga: insensitive(filters.lga) }),
      ...(filters.neighbourhood && { neighbourhood: contains(filters.neighbourhood) }),
      ...(filters.propertyType && { propertyType: filters.propertyType as Prisma.EnumPropertyTypeFilter["equals"] }),
      ...(filters.bedrooms !== undefined && { bedrooms: { gte: filters.bedrooms } }),
      ...(filters.isFurnished && { isFurnished: true }),
      ...(filters.isServiced && { isServiced: true }),
      // Every search word must match somewhere: "lekki 3 bedroom" narrows rather than widens.
      ...(terms.length && {
        AND: terms.map((term) => ({
          OR: [{ title: contains(term) }, { neighbourhood: contains(term) }, { lga: contains(term) }, { state: contains(term) }, { address: contains(term) }],
        })),
      }),
    },
    ...((filters.minRent !== undefined || filters.maxRent !== undefined) && {
      annualRent: {
        ...(filters.minRent !== undefined && { gte: filters.minRent }),
        ...(filters.maxRent !== undefined && { lte: filters.maxRent }),
      },
    }),
  };
}

const ORDER: Record<string, Prisma.ListingOrderByWithRelationInput[]> = {
  price_asc: [{ annualRent: "asc" }],
  price_desc: [{ annualRent: "desc" }],
  newest: [{ publishedAt: "desc" }],
  popular: [{ viewCount: "desc" }, { publishedAt: "desc" }],
};

export async function searchListings(filters: SearchFilters, skip: number, take: number, sortBy = "newest") {
  const where = buildSearchWhere(filters);
  const [listings, total] = await prisma.$transaction([
    prisma.listing.findMany({ where, include: LISTING_INCLUDE, orderBy: ORDER[sortBy] ?? ORDER.newest, skip, take }),
    prisma.listing.count({ where }),
  ]);
  return { listings, total };
}

export function getMapListings(filters: SearchFilters) {
  const where = buildSearchWhere(filters);
  return prisma.listing.findMany({
    where: { ...where, property: { ...(where.property as Prisma.PropertyWhereInput), latitude: { not: null }, longitude: { not: null } } },
    select: {
      id: true,
      annualRent: true,
      property: {
        select: {
          title: true,
          latitude: true,
          longitude: true,
          propertyType: true,
          bedrooms: true,
          neighbourhood: true,
          photos: { where: { isCover: true }, select: { url: true }, take: 1 },
        },
      },
    },
    take: 500,
  });
}

export function findListingById(id: string) {
  return prisma.listing.findUnique({ where: { id }, include: LISTING_INCLUDE });
}

export function createPropertyWithListing(input: {
  landlordId: string;
  property: Record<string, unknown>;
  listing: Record<string, unknown>;
}) {
  return prisma.$transaction(async (tx) => {
    const { amenities, ...propertyData } = input.property as { amenities?: Array<{ type: string; notes?: string }> };
    const property = await tx.property.create({
      data: {
        ...(propertyData as Omit<Prisma.PropertyUncheckedCreateInput, "landlordId">),
        landlordId: input.landlordId,
        ...(amenities?.length && { amenities: { create: amenities as Prisma.AmenityCreateWithoutPropertyInput[] } }),
      },
    });
    return tx.listing.create({
      data: {
        ...(input.listing as Omit<Prisma.ListingUncheckedCreateInput, "propertyId" | "landlordId" | "availableFrom">),
        availableFrom: new Date(String(input.listing.availableFrom)),
        propertyId: property.id,
        landlordId: input.landlordId,
        status: "DRAFT",
      },
      include: LISTING_INCLUDE,
    });
  });
}

export function updatePropertyAndListing(
  id: string,
  propertyId: string,
  propertyData?: Record<string, unknown>,
  listingData?: Record<string, unknown>,
) {
  return prisma.$transaction(async (tx) => {
    if (propertyData) {
      const { amenities, ...fields } = propertyData as { amenities?: Array<{ type: string; notes?: string }> };
      await tx.property.update({ where: { id: propertyId }, data: fields as Prisma.PropertyUpdateInput });
      if (Array.isArray(amenities)) {
        await tx.amenity.deleteMany({ where: { propertyId } });
        if (amenities.length) {
          await tx.amenity.createMany({
            data: amenities.map((amenity) => ({ propertyId, type: amenity.type as Prisma.AmenityCreateManyInput["type"], notes: amenity.notes })),
          });
        }
      }
    }
    return tx.listing.update({
      where: { id },
      data: {
        ...(listingData as Prisma.ListingUpdateInput),
        ...(listingData?.availableFrom ? { availableFrom: new Date(String(listingData.availableFrom)) } : {}),
      },
      include: LISTING_INCLUDE,
    });
  });
}

export function updateListingStatus(id: string, status: ListingStatus, extra: Prisma.ListingUpdateInput = {}) {
  return prisma.listing.update({ where: { id }, data: { status, ...extra }, include: LISTING_INCLUDE });
}

export function incrementViewCount(id: string) {
  return prisma.listing.update({ where: { id }, data: { viewCount: { increment: 1 } }, select: { id: true } });
}

export async function getListingsByLandlord(landlordId: string) {
  const listings = await prisma.listing.findMany({
    where: { landlordId },
    include: {
      ...LISTING_INCLUDE,
      _count: { select: { inquiries: { where: { status: { notIn: ["DECLINED", "EXPIRED"] } } }, savedBy: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return listings;
}

export function saveListing(userId: string, listingId: string) {
  return prisma.savedListing.upsert({
    where: { userId_listingId: { userId, listingId } },
    create: { userId, listingId },
    update: {},
  });
}

export function unsaveListing(userId: string, listingId: string) {
  return prisma.savedListing.deleteMany({ where: { userId, listingId } });
}

export function getSavedListings(userId: string) {
  return prisma.savedListing.findMany({
    where: { userId },
    include: { listing: { include: LISTING_INCLUDE } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSavedListingIds(userId: string, listingIds?: string[]): Promise<Set<string>> {
  const saved = await prisma.savedListing.findMany({
    where: { userId, ...(listingIds && { listingId: { in: listingIds } }) },
    select: { listingId: true },
  });
  return new Set(saved.map((s) => s.listingId));
}
