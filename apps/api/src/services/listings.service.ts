// Listing search, detail, creation, publishing and saved homes.

import { calculateMoveInCost } from "@lettr/utils";
import type { ListingStatus, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { deleteStoredFile } from "../lib/storage.js";
import { createError } from "../middleware/errorHandler.js";
import * as listingsRepo from "../repositories/listings.repository.js";
import type { SearchFilters } from "../repositories/listings.repository.js";
import { notify } from "./notify.js";

type Money = { toNumber(): number };
type ListingRecord = NonNullable<Awaited<ReturnType<typeof listingsRepo.findListingById>>>;

interface SearchQuery extends SearchFilters {
  page: number;
  limit: number;
  sortBy?: string;
}

function costOf(listing: { annualRent: Money; cautionFee: Money; serviceCharge: Money; legalFee: Money }) {
  return calculateMoveInCost({
    annualRent: listing.annualRent.toNumber(),
    cautionFee: listing.cautionFee.toNumber(),
    serviceCharge: listing.serviceCharge.toNumber(),
    legalFee: listing.legalFee.toNumber(),
  });
}

function enrich<T extends ListingRecord>(listing: T, savedIds?: Set<string>) {
  return { ...listing, moveInCost: costOf(listing), isSaved: savedIds?.has(listing.id) ?? false };
}

/**
 * The street address and exact pin are private until a tenant has paid; the
 * tenancy agreement shows them then. Everyone else sees neighbourhood and area.
 */
function forPublic<T extends { property: { address: string; latitude: number | null; longitude: number | null } }>(listing: T): T {
  const round = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);
  return {
    ...listing,
    property: { ...listing.property, address: "", latitude: round(listing.property.latitude), longitude: round(listing.property.longitude) },
  };
}

export async function searchListings(query: SearchQuery, userId?: string) {
  const skip = (query.page - 1) * query.limit;
  const { listings, total } = await listingsRepo.searchListings(query, skip, query.limit, query.sortBy);
  const savedIds = userId ? await listingsRepo.getSavedListingIds(userId, listings.map((l) => l.id)) : undefined;
  return {
    listings: listings.map((listing) => forPublic(enrich(listing, savedIds))),
    pagination: { page: query.page, limit: query.limit, total, totalPages: Math.max(1, Math.ceil(total / query.limit)) },
  };
}

export async function getMapListings(query: SearchFilters) {
  // Pins show the area, not the exact building.
  const pins = await listingsRepo.getMapListings(query);
  const round = (value: number | null) => (value === null ? null : Math.round(value * 100) / 100);
  return pins.map((pin) => ({ ...pin, property: { ...pin.property, latitude: round(pin.property.latitude), longitude: round(pin.property.longitude) } }));
}

/**
 * Active listings are public. Owners and admins see any status. A tenant with a
 * conversation or tenancy for the home can still see it after it's taken.
 */
async function canView(listing: ListingRecord, userId?: string, role?: UserRole) {
  if (listing.status === "ACTIVE") return true;
  if (!userId) return false;
  if (listing.landlordId === userId || role === "ADMIN") return true;
  const link = await prisma.inquiry.findUnique({ where: { listingId_tenantId: { listingId: listing.id, tenantId: userId } }, select: { id: true } });
  return Boolean(link);
}

export async function getListing(id: string, userId?: string, role?: UserRole) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing || !(await canView(listing, userId, role))) throw createError("This home isn't available.", 404);
  if (listing.landlordId !== userId && listing.status === "ACTIVE") {
    listingsRepo.incrementViewCount(id).catch(() => undefined);
  }
  const savedIds = userId ? await listingsRepo.getSavedListingIds(userId, [id]) : undefined;
  const enriched = enrich(listing, savedIds);
  return listing.landlordId === userId || role === "ADMIN" ? enriched : forPublic(enriched);
}

async function ownedListing(id: string, landlordId: string) {
  const listing = await listingsRepo.findListingById(id);
  if (!listing) throw createError("Listing not found.", 404);
  if (listing.landlordId !== landlordId) throw createError("You can only manage your own listings.", 403);
  return listing;
}

export async function createListing(body: { property: Record<string, unknown>; listing: Record<string, unknown> }, landlordId: string) {
  const listing = await listingsRepo.createPropertyWithListing({ landlordId, ...body });
  return enrich(listing);
}

// Terms that are locked once a tenant is committing money to them.
const LOCKED_TERMS = ["annualRent", "cautionFee", "serviceCharge", "legalFee", "availableFrom", "minimumLeaseTerm"];

export async function updateListing(
  id: string,
  body: { property?: Record<string, unknown>; listing?: Record<string, unknown> },
  landlordId: string,
) {
  const listing = await ownedListing(id, landlordId);
  const committed: ListingStatus[] = ["UNDER_OFFER", "TAKEN"];
  if (committed.includes(listing.status) && body.listing && Object.keys(body.listing).some((key) => LOCKED_TERMS.includes(key))) {
    throw createError("Rent, fees and dates can't change while a tenant is committed to this home.", 409);
  }
  const updated = await listingsRepo.updatePropertyAndListing(id, listing.propertyId, body.property, body.listing);
  return enrich(updated);
}

export async function publishListing(id: string, landlordId: string) {
  const listing = await ownedListing(id, landlordId);
  if (listing.status === "ACTIVE") return enrich(listing);
  if (listing.status === "SUSPENDED") throw createError("This listing was suspended by Lettr. Contact support to reinstate it.", 409);
  if (listing.status === "UNDER_OFFER" || listing.status === "TAKEN") throw createError("This home is already let or held for a tenant.", 409);
  if (listing.property.photos.length === 0) throw createError("Add at least one photo before publishing.", 409, { code: "PHOTOS_REQUIRED" });

  const verification = listing.landlord.landlordProfile?.verificationStatus;
  if (verification !== "VERIFIED" && verification !== "PENDING_REVIEW") {
    throw createError("Submit an ID document for verification before publishing.", 409, { code: "VERIFICATION_REQUIRED" });
  }
  const published = await listingsRepo.updateListingStatus(id, "ACTIVE", { publishedAt: listing.publishedAt ?? new Date() });
  return enrich(published);
}

export async function archiveListing(id: string, landlordId: string) {
  const listing = await ownedListing(id, landlordId);
  if (listing.status === "UNDER_OFFER" || listing.status === "TAKEN") {
    throw createError("You can't archive a home that a tenant has accepted or paid for.", 409);
  }
  if (listing.status === "SUSPENDED") throw createError("Suspended listings are managed by Lettr.", 409);

  const open = await prisma.inquiry.findMany({
    where: { listingId: id, status: { notIn: ["DECLINED", "EXPIRED", "ACCEPTED"] } },
    select: { id: true, tenantId: true },
  });
  const archived = await prisma.$transaction(async (tx) => {
    await tx.inquiry.updateMany({
      where: { id: { in: open.map((i) => i.id) } },
      data: { status: "DECLINED", closedAt: new Date(), closedReason: "Listing taken off the market" },
    });
    return tx.listing.update({ where: { id }, data: { status: "ARCHIVED" }, include: listingsRepo.LISTING_INCLUDE });
  });
  await Promise.all(
    open.map((inquiry) =>
      notify({
        userId: inquiry.tenantId,
        type: "SYSTEM",
        title: `${listing.property.title} is no longer available`,
        body: "The landlord has taken this home off the market.",
        link: `/messages/${inquiry.id}`,
      }),
    ),
  );
  return enrich(archived);
}

/** Drafts that never reached a tenant are deleted outright; anything else is archived. */
export async function deleteListing(id: string, landlordId: string) {
  const listing = await ownedListing(id, landlordId);
  const hasHistory = await prisma.inquiry.count({ where: { listingId: id } });
  if (listing.status !== "DRAFT" || hasHistory) return archiveListing(id, landlordId);

  await prisma.$transaction(async (tx) => {
    await tx.savedListing.deleteMany({ where: { listingId: id } });
    await tx.listing.delete({ where: { id } });
    const otherListings = await tx.listing.count({ where: { propertyId: listing.propertyId } });
    if (!otherListings) await tx.property.delete({ where: { id: listing.propertyId } });
  });
  await Promise.all(listing.property.photos.map((photo) => deleteStoredFile(photo.publicId)));
  return { deleted: true };
}

export async function saveListing(listingId: string, userId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { status: true } });
  if (!listing) throw createError("Listing not found.", 404);
  if (listing.status !== "ACTIVE") throw createError("Only available homes can be saved.", 409);
  await listingsRepo.saveListing(userId, listingId);
  return { saved: true };
}

export async function unsaveListing(listingId: string, userId: string) {
  await listingsRepo.unsaveListing(userId, listingId);
  return { saved: false };
}

export async function getSavedListings(userId: string) {
  const saved = await listingsRepo.getSavedListings(userId);
  return saved.map((entry) => ({ savedAt: entry.createdAt, listing: forPublic({ ...enrich(entry.listing), isSaved: true }) }));
}

export async function getMyListings(landlordId: string) {
  const listings = await listingsRepo.getListingsByLandlord(landlordId);
  return listings.map(({ _count, ...listing }) => ({
    ...enrich(listing),
    openInquiries: _count.inquiries,
    savedCount: _count.savedBy,
  }));
}

/** A landlord's own listing in any status, for the editor. */
export async function getMyListing(id: string, landlordId: string) {
  return enrich(await ownedListing(id, landlordId));
}
