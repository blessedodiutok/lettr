// File: apps/api/src/services/listings.service.ts
// Business logic for listing search, creation, and management

import {
  calculateAgentCommission,
  calculatePlatformFee,
  calculateSavings,
} from "@lettr/utils";
import { createError } from "../middleware/errorHandler.js";
import * as listingsRepo from "../repositories/listings.repository.js";

interface SearchQuery {
  state?: string;
  lga?: string;
  neighbourhood?: string;
  propertyType?: string;
  minRent?: string;
  maxRent?: string;
  bedrooms?: string;
  isFurnished?: string;
  isServiced?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
}

export async function searchListings(query: SearchQuery, userId?: string) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
  const skip = (page - 1) * limit;

  const filters = {
    state: query.state,
    lga: query.lga,
    neighbourhood: query.neighbourhood,
    propertyType: query.propertyType as string | undefined,
    minRent: query.minRent ? Number(query.minRent) : undefined,
    maxRent: query.maxRent ? Number(query.maxRent) : undefined,
    bedrooms: query.bedrooms ? Number(query.bedrooms) : undefined,
    isFurnished: query.isFurnished === "true" ? true : undefined,
    isServiced: query.isServiced === "true" ? true : undefined,
  };

  const { listings, total } = await listingsRepo.searchListings(
    filters,
    skip,
    limit,
    query.sortBy,
  );

  // Attach savings callout to each listing
  const enrichedListings = listings.map((l) => ({
    ...l,
    agentFeeSaved: calculateAgentCommission(l.annualRent.toNumber()),
    platformFee: calculatePlatformFee(l.annualRent.toNumber()),
    savings: calculateSavings(l.annualRent.toNumber()),
  }));

  // If tenant, mark which listings they've saved
  let savedIds: Set<string> = new Set();
  if (userId) {
    const saved = await listingsRepo.getSavedListingIds(userId);
    savedIds = new Set(saved);
  }

  return {
    listings: enrichedListings.map((l) => ({
      ...l,
      isSaved: savedIds.has(l.id),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getMapListings(query: SearchQuery) {
  // Returns minimal data for map pins — just id, lat, lng, rent, type
  const filters = {
    state: query.state,
    lga: query.lga,
    propertyType: query.propertyType,
    minRent: query.minRent ? Number(query.minRent) : undefined,
    maxRent: query.maxRent ? Number(query.maxRent) : undefined,
  };
  return listingsRepo.getMapListings(filters);
}

export async function getListing(id: string, userId?: string) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing) {
    throw createError("Listing not found", 404);
  }
  if (listing.status !== "ACTIVE" && listing.landlordId !== userId) {
    throw createError("Listing not found", 404);
  }

  // Increment view counter (fire and forget — not awaited to keep response fast)
  listingsRepo.incrementViewCount(id).catch(() => {});

  const isSaved = userId
    ? await listingsRepo.isListingSaved(id, userId)
    : false;

  return {
    ...listing,
    isSaved,
    agentFeeSaved: calculateAgentCommission(listing.annualRent.toNumber()),
    platformFee: calculatePlatformFee(listing.annualRent.toNumber()),
    savings: calculateSavings(listing.annualRent.toNumber()),
  };
}

export async function createListing(
  body: Record<string, unknown>,
  landlordId: string,
) {
  const { property, listing } = body as {
    property: Record<string, unknown>;
    listing: Record<string, unknown>;
  };

  return listingsRepo.createPropertyWithListing({
    property: { ...property, landlordId } as unknown as Parameters<
      typeof listingsRepo.createPropertyWithListing
    >[0]["property"],
    listing: { ...listing, landlordId } as unknown as Parameters<
      typeof listingsRepo.createPropertyWithListing
    >[0]["listing"],
  });
}

export async function updateListing(
  id: string,
  body: Record<string, unknown>,
  landlordId: string,
) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing) throw createError("Listing not found", 404);
  if (listing.landlordId !== landlordId)
    throw createError("Not authorised to edit this listing", 403);
  const { property, listing: listingData } = body as {
    property?: Record<string, unknown>;
    listing?: Record<string, unknown>;
  };
  return listingsRepo.updatePropertyAndListing(id, listing.propertyId, property, listingData);
}

export async function deleteListing(id: string, landlordId: string) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing) throw createError("Listing not found", 404);
  if (listing.landlordId !== landlordId)
    throw createError("Not authorised to delete this listing", 403);
  if (listing.status === "TAKEN" || listing.status === "UNDER_OFFER") {
    throw createError(
      "Cannot delete a listing with an active tenancy or pending payment",
      400,
    );
  }
  return listingsRepo.deleteListing(id);
}

export async function publishListing(id: string, landlordId: string) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing) throw createError("Listing not found", 404);
  if (listing.landlordId !== landlordId)
    throw createError("Not authorised", 403);
  if (listing.property.photos.length === 0) {
    throw createError("At least one photo is required before publishing", 400);
  }
  return listingsRepo.updateListingStatus(id, "ACTIVE", new Date());
}

export async function archiveListing(id: string, landlordId: string) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing) throw createError("Listing not found", 404);
  if (listing.landlordId !== landlordId)
    throw createError("Not authorised", 403);
  return listingsRepo.updateListingStatus(id, "ARCHIVED");
}

export async function saveListing(listingId: string, userId: string) {
  const listing = await listingsRepo.findListingById(listingId);
  if (!listing) throw createError("Listing not found", 404);
  if (listing.status !== "ACTIVE") throw createError("Only active listings can be saved", 400);
  return listingsRepo.saveListing(userId, listingId);
}

export async function unsaveListing(listingId: string, userId: string) {
  return listingsRepo.unsaveListing(userId, listingId);
}

export async function getSavedListings(userId: string) {
  return listingsRepo.getSavedListings(userId);
}

export async function getMyListings(landlordId: string) {
  return listingsRepo.getListingsByLandlord(landlordId);
}
