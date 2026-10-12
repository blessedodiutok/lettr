"use client";

import { AMENITY_LABELS } from "@lettr/types";
import { formatCurrency, formatDate, formatPropertyType, formatRelativeDate, pluralise } from "@lettr/utils";
import { Bath, BedDouble, CalendarDays, Car, Check, Ruler, Toilet } from "lucide-react";
import Link from "next/link";
import { useListingReviews } from "../../hooks/useAccount";
import { useListing } from "../../hooks/useListings";
import { errorMessage } from "../../lib/api";
import type { Listing } from "../../lib/types";
import { Avatar, ErrorState, Skeleton, Stars, StatusPill, VerifiedBadge } from "../ui/display";
import { CostBreakdown } from "./CostBreakdown";
import { SaveButton } from "./ListingCard";
import { ListingActions } from "./ListingActions";
import { ListingGallery } from "./ListingGallery";

function Fact({ icon: Icon, children }: { icon: typeof BedDouble; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-[13px] text-ink-2">
      <Icon className="size-4 text-muted" aria-hidden />
      {children}
    </li>
  );
}

function Reviews({ listingId }: { listingId: string }) {
  const { data } = useListingReviews(listingId);
  if (!data?.length) return null;
  return (
    <section className="border-t border-line pt-8">
      <h2 className="text-lg font-semibold text-ink">What tenants say</h2>
      <ul className="mt-4 grid gap-4">
        {data.map((review) => (
          <li key={review.id} className="rounded-card border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar person={review.reviewer} size={32} />
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {review.reviewer.firstName} {review.reviewer.lastName.charAt(0)}.
                  </p>
                  <p className="text-xs text-muted">{formatRelativeDate(review.createdAt)}</p>
                </div>
              </div>
              <Stars rating={review.rating} />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{review.title}</p>
            <p className="mt-1 text-sm text-ink-2">{review.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ListingDetail({ id, initial }: { id: string; initial?: Listing }) {
  const { data: listing, isPending, isError, error } = useListing(id, initial);

  if (isPending && !listing) {
    return (
      <div className="page py-8">
        <Skeleton className="aspect-[16/7] w-full rounded-media" />
        <Skeleton className="mt-6 h-9 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    );
  }
  if (isError || !listing) {
    return (
      <div className="page py-16">
        <ErrorState message={error ? errorMessage(error, "This home isn't available.") : "This home isn't available."} />
        <Link href="/listings" className="mt-4 inline-block text-sm font-semibold text-navy hover:underline">
          ← Browse other homes
        </Link>
      </div>
    );
  }

  const { property, landlord } = listing;
  const profile = landlord.landlordProfile;
  const amenities = property.amenities.map((a) => AMENITY_LABELS[a.type as keyof typeof AMENITY_LABELS] ?? a.type);
  const rules = [
    listing.petsAllowed ? "Pets allowed" : "No pets",
    listing.smokingAllowed ? "Smoking allowed" : "No smoking indoors",
    `Minimum lease ${listing.minimumLeaseTerm} months`,
    listing.maximumOccupants ? `Up to ${listing.maximumOccupants} occupants` : null,
    listing.requiresEmployment ? "Proof of income required" : null,
    listing.requiresGuarantor ? "Guarantor required" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="page py-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-[13px] text-muted">
        <Link href="/listings" className="hover:text-navy">
          Homes
        </Link>
        {" › "}
        <Link href={`/listings?state=${encodeURIComponent(property.state)}`} className="hover:text-navy">
          {property.state}
        </Link>
        {" › "}
        <span>{property.neighbourhood}</span>
      </nav>

      <div className="relative">
        <ListingGallery photos={property.photos} title={property.title} />
        <SaveButton listing={listing} className="absolute left-3 top-3 z-10" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-8">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {listing.status !== "ACTIVE" && <StatusPill kind="listing" status={listing.status} />}
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">{formatPropertyType(property.propertyType)}</span>
            </div>
            <h1 className="font-display text-[30px] font-medium leading-tight text-ink sm:text-[36px]">{property.title}</h1>
            <p className="mt-1.5 text-[15px] text-muted">
              {property.neighbourhood}, {property.lga}, {property.state}
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {property.bedrooms > 0 && <Fact icon={BedDouble}>{pluralise(property.bedrooms, "bedroom", "bedrooms")}</Fact>}
              <Fact icon={Bath}>{pluralise(property.bathrooms, "bathroom", "bathrooms")}</Fact>
              <Fact icon={Toilet}>{pluralise(property.toilets, "toilet", "toilets")}</Fact>
              {property.parkingSpaces > 0 && <Fact icon={Car}>{pluralise(property.parkingSpaces, "parking space", "parking spaces")}</Fact>}
              {property.sizeInSqm && <Fact icon={Ruler}>{property.sizeInSqm} m²</Fact>}
              <Fact icon={CalendarDays}>Available {formatDate(listing.availableFrom)}</Fact>
            </ul>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-ink">About this home</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{property.description}</p>
          </section>

          {amenities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-ink">What&apos;s included</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {amenities.map((label) => (
                  <li key={label} className="flex items-center gap-2 text-[15px] text-ink-2">
                    <Check className="size-4 text-ok" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-ink">House rules and requirements</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {rules.map((rule) => (
                <li key={rule} className="text-[15px] text-ink-2">
                  {rule}
                </li>
              ))}
            </ul>
            {listing.additionalRequirements && <p className="mt-3 text-[15px] text-ink-2">{listing.additionalRequirements}</p>}
          </section>

          <section className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-5">
            <Avatar person={landlord} size={48} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">
                {profile?.businessName ?? `${landlord.firstName} ${landlord.lastName}`}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                {profile?.verificationStatus === "VERIFIED" && <VerifiedBadge />}
                {profile && profile.totalRentalsCompleted > 0 && <span>{profile.totalRentalsCompleted} tenancies on Lettr</span>}
                {profile && profile.totalReviews > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Stars rating={profile.averageRating} size={12} /> {profile.averageRating.toFixed(1)} ({profile.totalReviews})
                  </span>
                )}
                <span>On Lettr since {formatDate(landlord.createdAt).split(" ").slice(1).join(" ")}</span>
              </div>
            </div>
            <Link href={`/landlords/${landlord.id}`} className="text-sm font-semibold text-navy hover:underline">
              View profile
            </Link>
          </section>

          <Reviews listingId={listing.id} />
        </div>

        <aside id="booking" className="scroll-mt-20 lg:sticky lg:top-24">
          <div className="rounded-media border border-line bg-surface p-5 shadow-2">
            <p className="tnum text-[28px] font-bold tracking-tight text-ink">
              {formatCurrency(listing.annualRent)} <span className="text-sm font-medium text-muted">/ year</span>
            </p>
            <CostBreakdown cost={listing.moveInCost} className="mt-4" />
            <div className="mt-5">
              <ListingActions listing={listing} />
            </div>
          </div>
        </aside>
      </div>

      {/* Phones: keep the price and next step within thumb reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-line bg-surface px-4 pt-3 lg:hidden" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
        <div>
          <p className="tnum text-lg font-bold text-ink">
            {formatCurrency(listing.annualRent)} <span className="text-xs font-medium text-muted">/yr</span>
          </p>
          <p className="text-xs text-muted">No agent fee</p>
        </div>
        <a href="#booking" className="inline-flex h-11 items-center rounded-control bg-navy px-5 text-sm font-semibold text-on-navy">
          See costs and contact
        </a>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}
