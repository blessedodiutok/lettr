// File: apps/web/src/components/ListingDetail.tsx
"use client";

import {
  Bath,
  BedDouble,
  Calendar,
  Car,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Heart,
  MapPin,
  Car as ParkingIcon,
  Shield,
  Tv,
  Waves,
  Wifi,
  Wind,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useListing, useToggleSave } from "../hooks/useListings";
import { useListingReviews } from "../hooks/useReviews";
import { cn, formatDate, formatNaira, formatPropertyType } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { SavingsCallout } from "./SavingsCallout";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { VerifiedBadge } from "./VerifiedBadge";

/* ── Amenity icon lookup ───────────────────────────────────────────────────── */
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  INTERNET_FIBRE: <Wifi size={13} />,
  INTERNET_CABLE: <Wifi size={13} />,
  WATER: <Droplets size={13} />,
  ELECTRICITY: <Zap size={13} />,
  GENERATOR: <Zap size={13} />,
  GYM: <Dumbbell size={13} />,
  PARKING: <ParkingIcon size={13} />,
  SWIMMING_POOL: <Waves size={13} />,
  AIR_CONDITIONING: <Wind size={13} />,
  CABLE_TV: <Tv size={13} />,
  SECURITY: <Shield size={13} />,
};

/* ── Star rating ───────────────────────────────────────────────────────────── */
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 13 13"
          fill={
            i < rating ? "var(--color-accent-500)" : "var(--color-neutral-200)"
          }
          aria-hidden="true"
        >
          <path d="M6.5 1l1.545 3.13L11.5 4.635l-2.5 2.435.59 3.43L6.5 8.885 3.91 10.5l.59-3.43L2 4.635l3.455-.505L6.5 1z" />
        </svg>
      ))}
    </div>
  );
}

/* ── User initials avatar ──────────────────────────────────────────────────── */
function Avatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const sizeClass = {
    sm: "w-7 h-7 text-[11px]",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full flex-shrink-0",
        "bg-[var(--color-primary-100)]",
        "text-[var(--color-primary-700)] font-bold",
        "flex items-center justify-center",
        "select-none",
      )}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/* ── Loading skeleton ──────────────────────────────────────────────────────── */
function ListingDetailSkeleton() {
  return (
    <div className="page-container py-8 space-y-6 animate-pulse">
      {/* Gallery */}
      <Skeleton className="h-[26rem] w-full rounded-2xl" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-28 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
        <div className="lg:col-span-2 space-y-5">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export function ListingDetail({ listingId }: { listingId: string }) {
  const { data: listing, isLoading } = useListing(listingId);
  const { data: reviews } = useListingReviews(listingId);
  const { user } = useAuthStore();
  const toggleSave = useToggleSave();
  const [activePhoto, setActivePhoto] = useState(0);

  /* Photo keyboard navigation */
  const photos =
    listing?.property.photos.sort((a) => (a.isCover ? -1 : 1)) ?? [];

  const prevPhoto = useCallback(
    () => setActivePhoto((i) => (i === 0 ? photos.length - 1 : i - 1)),
    [photos.length],
  );
  const nextPhoto = useCallback(
    () => setActivePhoto((i) => (i === photos.length - 1 ? 0 : i + 1)),
    [photos.length],
  );

  useEffect(() => {
    if (photos.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevPhoto, nextPhoto, photos.length]);

  if (isLoading) return <ListingDetailSkeleton />;

  if (!listing) {
    return (
      <div className="page-container py-24 text-center">
        <p className="text-[var(--color-neutral-500)] text-lg">
          Listing not found.
        </p>
        <Link
          href="/listings"
          className="mt-4 inline-flex text-sm font-semibold text-[var(--color-primary-600)] hover:underline"
        >
          ← Back to listings
        </Link>
      </div>
    );
  }

  const { property, landlord } = listing;
  const isVerified =
    landlord.landlordProfile?.verificationStatus === "VERIFIED";

  /* Status pill — using CSS vars instead of arbitrary Tailwind strings */
  const statusStyles: Record<string, string> = {
    ACTIVE:
      "bg-[var(--color-success-50)]  text-[var(--color-success-700)]  border-[var(--color-success-200)]",
    PENDING:
      "bg-[var(--color-warning-50)]  text-[var(--color-warning-600)]  border-[var(--color-warning-200)]",
    TAKEN:
      "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]  border-[var(--color-neutral-300)]",
    ARCHIVED:
      "bg-[var(--color-danger-50)]   text-[var(--color-danger-600)]   border-[var(--color-danger-200)]",
  };
  const statusLabel: Record<string, string> = {
    ACTIVE: "Available",
    PENDING: "Under Review",
    TAKEN: "Taken",
    ARCHIVED: "Archived",
    UNDER_OFFER: "Under offer",
    SUSPENDED: "Suspended",
    DRAFT: "Draft",
  };

  return (
    <div className="page-container py-8">
      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <Link
        href="/listings"
        className="
          inline-flex items-center gap-1.5 mb-6
          text-sm font-medium text-[var(--color-neutral-500)]
          hover:text-[var(--color-primary-600)]
          transition-colors duration-150
        "
      >
        <ChevronLeft size={15} aria-hidden="true" />
        Back to listings
      </Link>

      {/* ── Photo gallery ─────────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <div className="mb-8">
          {/* Main photo */}
          <div className="relative h-[22rem] sm:h-[28rem] rounded-2xl overflow-hidden bg-[var(--color-neutral-100)] group">
            <Image
              src={photos[activePhoto]?.url ?? photos[0].url}
              alt={photos[activePhoto]?.altText ?? property.title}
              fill
              className="object-cover transition-opacity duration-300"
              priority
              sizes="(max-width: 768px) 100vw, 80vw"
            />

            {/* Nav arrows — only show when there are multiple photos */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  aria-label="Previous photo"
                  className="
                    absolute left-3 top-1/2 -translate-y-1/2
                    w-10 h-10 rounded-full
                    bg-white/90 backdrop-blur-sm
                    flex items-center justify-center
                    shadow-md border border-white/60
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    hover:bg-white
                  "
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextPhoto}
                  aria-label="Next photo"
                  className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    w-10 h-10 rounded-full
                    bg-white/90 backdrop-blur-sm
                    flex items-center justify-center
                    shadow-md border border-white/60
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    hover:bg-white
                  "
                >
                  <ChevronRight size={18} />
                </button>

                {/* Photo counter */}
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {activePhoto + 1} / {photos.length}
                </div>
              </>
            )}

            {/* Save button */}
            <button
              onClick={() => {
                if (!user) {
                  window.location.href = "/auth/login";
                  return;
                }
                toggleSave.mutate({
                  listingId: listing.id,
                  isSaved: listing.isSaved,
                });
              }}
              aria-label={
                listing.isSaved ? "Remove from saved" : "Save listing"
              }
              aria-pressed={listing.isSaved}
              className="
                absolute top-4 right-4
                w-10 h-10 bg-white/90 backdrop-blur-sm
                rounded-full flex items-center justify-center
                shadow-md border border-white/60
                hover:scale-110 active:scale-95
                transition-all duration-150
              "
            >
              <Heart
                size={18}
                className={
                  listing.isSaved
                    ? "fill-red-500 stroke-red-500"
                    : "stroke-[var(--color-neutral-600)]"
                }
              />
            </button>
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {photos.slice(0, 8).map((photo, i) => (
                <button
                  key={photo.url}
                  onClick={() => setActivePhoto(i)}
                  aria-label={`View photo ${i + 1}`}
                  aria-pressed={i === activePhoto}
                  className={cn(
                    "relative flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden",
                    "border-2 transition-all duration-150",
                    i === activePhoto
                      ? "border-[var(--color-primary-600)] shadow-sm"
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-[var(--color-neutral-300)]",
                  )}
                >
                  <Image
                    src={photo.url}
                    alt={photo.altText ?? `Photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </button>
              ))}
              {photos.length > 8 && (
                <div className="flex-shrink-0 w-28 h-20 rounded-xl bg-[var(--color-neutral-100)] flex items-center justify-center border border-[var(--color-neutral-200)]">
                  <span className="text-xs font-semibold text-[var(--color-neutral-500)]">
                    +{photos.length - 8} more
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
        {/* ── Left column — main content ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title + meta */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="default">
                {formatPropertyType(property.propertyType)}
              </Badge>
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                  statusStyles[listing.status] ?? statusStyles.ARCHIVED,
                )}
              >
                {statusLabel[listing.status] ?? listing.status}
              </span>
            </div>

            <h1 className="heading-display text-3xl text-[var(--color-primary-600)] mb-3">
              {property.title}
            </h1>

            <div className="flex items-start gap-1.5 text-sm text-[var(--color-neutral-500)]">
              <MapPin
                size={14}
                className="shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                {property.address}, {property.neighbourhood}, {property.lga},{" "}
                {property.state}
              </span>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[var(--color-neutral-200)] text-sm text-[var(--color-neutral-700)]">
                <BedDouble
                  size={15}
                  className="text-[var(--color-primary-500)]"
                  aria-hidden="true"
                />
                <span className="font-medium">{property.bedrooms}</span>
                <span className="text-[var(--color-neutral-500)]">
                  bedroom{property.bedrooms > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[var(--color-neutral-200)] text-sm text-[var(--color-neutral-700)]">
              <Bath
                size={15}
                className="text-[var(--color-primary-500)]"
                aria-hidden="true"
              />
              <span className="font-medium">{property.bathrooms}</span>
              <span className="text-[var(--color-neutral-500)]">
                bathroom{property.bathrooms > 1 ? "s" : ""}
              </span>
            </div>
            {property.parkingSpaces > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[var(--color-neutral-200)] text-sm text-[var(--color-neutral-700)]">
                <Car
                  size={15}
                  className="text-[var(--color-primary-500)]"
                  aria-hidden="true"
                />
                <span className="font-medium">{property.parkingSpaces}</span>
                <span className="text-[var(--color-neutral-500)]">parking</span>
              </div>
            )}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[var(--color-neutral-200)] text-sm text-[var(--color-neutral-700)]">
              <Calendar
                size={15}
                className="text-[var(--color-primary-500)]"
                aria-hidden="true"
              />
              <span className="text-[var(--color-neutral-500)]">Available</span>
              <span className="font-medium">
                {formatDate(listing.availableFrom)}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-semibold text-base text-[var(--color-neutral-800)] mb-3">
              About this property
            </h2>
            <p className="text-[var(--color-neutral-600)] text-sm leading-[1.8] whitespace-pre-wrap">
              {property.description}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h2 className="font-semibold text-base text-[var(--color-neutral-800)] mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {property.amenities.map((a) => (
                  <div
                    key={a.type}
                    className="
                      flex items-center gap-2.5
                      px-3 py-2.5 rounded-xl
                      bg-[var(--color-primary-50)]
                      border border-[var(--color-primary-100)]
                      text-sm text-[var(--color-primary-700)]
                    "
                  >
                    <span
                      className="text-[var(--color-primary-500)]"
                      aria-hidden="true"
                    >
                      {AMENITY_ICONS[a.type] ?? (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="12" cy="12" r="4" />
                        </svg>
                      )}
                    </span>
                    <span className="font-medium truncate">
                      {a.type
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews && reviews.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <h2 className="font-semibold text-base text-[var(--color-neutral-800)]">
                  Reviews
                </h2>
                <span
                  className="
                  inline-flex items-center justify-center
                  w-6 h-6 rounded-full text-xs font-bold
                  bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]
                "
                >
                  {reviews.length}
                </span>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="
                      bg-white rounded-2xl
                      border border-[var(--color-neutral-200)]
                      p-5
                    "
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          firstName={review.reviewer.firstName}
                          lastName={review.reviewer.lastName}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold text-sm text-[var(--color-neutral-800)]">
                            {review.reviewer.firstName}{" "}
                            {review.reviewer.lastName.charAt(0)}.
                          </p>
                          <p className="text-xs text-[var(--color-neutral-400)] mt-0.5">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} />
                    </div>

                    <p className="font-semibold text-sm text-[var(--color-neutral-800)] mb-1.5">
                      {review.title}
                    </p>
                    <p className="text-sm text-[var(--color-neutral-600)] leading-relaxed">
                      {review.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column — sticky sidebar ──────────────────────────────── */}
        <div>
          <div
            className="
            bg-white rounded-2xl
            border border-[var(--color-neutral-200)]
            shadow-[var(--shadow-lg)]
            sticky top-[5.5rem]
            overflow-hidden
          "
          >
            {/* Price zone */}
            <div className="px-5 pt-5 pb-4 border-b border-[var(--color-neutral-100)]">
              <p
                className="
                  font-[family-name:var(--font-display)]
                  font-bold text-4xl
                  text-[var(--color-primary-600)]
                  leading-none mb-1
                "
              >
                {formatNaira(listing.annualRent)}
              </p>
              <p className="text-sm text-[var(--color-neutral-500)]">
                per year · no agent fee
              </p>
            </div>

            {/* Savings */}
            <div className="px-5 py-4 border-b border-[var(--color-neutral-100)]">
              <SavingsCallout annualRent={listing.annualRent} variant="card" />
            </div>

            {/* Landlord */}
            <div className="px-5 py-4 border-b border-[var(--color-neutral-100)]">
              <p className="label-section mb-3">Listed by</p>
              <div className="flex items-center gap-3">
                <Avatar
                  firstName={landlord.firstName}
                  lastName={landlord.lastName}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-neutral-800)] truncate">
                    {landlord.firstName} {landlord.lastName}
                  </p>
                  {isVerified && <VerifiedBadge size="sm" />}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="px-5 py-4 space-y-2.5">
              {listing.status === "ACTIVE" ? (
                <>
                  {user?.role === "TENANT" && (
                    <>
                      <Link href={`/pay/${listing.id}`} className="block">
                        <Button variant="primary" size="lg" className="w-full">
                          Pay rent now
                        </Button>
                      </Link>
                      <Button variant="secondary" size="lg" className="w-full">
                        Send inquiry
                      </Button>
                    </>
                  )}
                  {!user && (
                    <>
                      <Link href="/auth/login">
                        <Button variant="primary" size="lg" className="w-full">
                          Log in to inquire
                        </Button>
                      </Link>
                      <p className="text-center text-xs text-[var(--color-neutral-400)]">
                        No account?{" "}
                        <Link
                          href="/auth/signup"
                          className="text-[var(--color-primary-600)] font-medium hover:underline"
                        >
                          Sign up free
                        </Link>
                      </p>
                    </>
                  )}
                </>
              ) : (
                <div
                  className="
                  bg-[var(--color-neutral-100)] rounded-xl p-4 text-center
                "
                >
                  <p className="text-sm font-semibold text-[var(--color-neutral-600)]">
                    This listing is no longer available
                  </p>
                  <Link
                    href="/listings"
                    className="mt-2 inline-block text-xs text-[var(--color-primary-600)] font-medium hover:underline"
                  >
                    Browse similar properties →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
