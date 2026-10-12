// File: apps/web/src/components/PropertyCard.tsx
"use client";

import { ArrowRight, Bath, BedDouble, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Listing } from "../hooks/useListings";
import { useToggleSave } from "../hooks/useListings";
import {
  calculateAgentSaving,
  cn,
  formatNaira,
  formatPropertyType,
} from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { VerifiedBadge } from "./VerifiedBadge";
import { Badge } from "./ui/badge";

interface PropertyCardProps {
  listing: Listing;
  className?: string;
}

export function PropertyCard({ listing, className }: PropertyCardProps) {
  const { user } = useAuthStore();
  const toggleSave = useToggleSave();
  const { property, landlord } = listing;

  const coverPhoto =
    property.photos.find((p) => p.isCover) ?? property.photos[0];
  const isVerified =
    landlord.landlordProfile?.verificationStatus === "VERIFIED";
  const saving = calculateAgentSaving(listing.annualRent);

  function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }
    toggleSave.mutate({ listingId: listing.id, isSaved: listing.isSaved });
  }

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={cn(
        "group block bg-white rounded-2xl overflow-hidden",
        "border border-[var(--color-neutral-200)]",
        "shadow-[var(--shadow-card)]",
        "transition-all duration-200",
        "hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        className,
      )}
    >
      {/* ── Photo ───────────────────────────────────────────────────────── */}
      <div className="relative h-56 bg-[var(--color-neutral-100)] overflow-hidden">
        {coverPhoto ? (
          <Image
            src={coverPhoto.url}
            alt={coverPhoto.altText ?? property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          /* Placeholder */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-neutral-300)]">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className="text-xs font-medium">No photo</span>
          </div>
        )}

        {/* Gradient scrim — bottom edge for chip legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent"
        />

        {/* Save button */}
        <button
          onClick={handleSaveClick}
          aria-label={listing.isSaved ? "Remove from saved" : "Save listing"}
          aria-pressed={listing.isSaved}
          className={cn(
            "absolute top-3 right-3",
            "w-9 h-9 rounded-full",
            "flex items-center justify-center",
            "bg-white/90 backdrop-blur-sm",
            "shadow-sm border border-white/60",
            "transition-all duration-150",
            "hover:scale-110 active:scale-95",
            listing.isSaved ? "bg-red-50" : "hover:bg-white",
          )}
        >
          <Heart
            size={15}
            className={cn(
              "transition-colors",
              listing.isSaved
                ? "fill-red-500 stroke-red-500"
                : "stroke-[var(--color-neutral-500)] group-hover:stroke-[var(--color-neutral-700)]",
            )}
          />
        </button>

        {/* Savings chip — sits on the gradient scrim */}
        <div className="absolute bottom-3 left-3">
          <span
            className="
              inline-flex items-center gap-1
              bg-[var(--color-success-500)] text-white
              text-[11px] font-bold
              px-2.5 py-1 rounded-full
              shadow-sm
            "
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 10 10"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 5l2.5 2.5L8 2.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Save {formatNaira(saving)}
          </span>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="p-4">
        {/* Type badge + verified */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="default">
            {formatPropertyType(property.propertyType)}
          </Badge>
          {isVerified && <VerifiedBadge size="sm" />}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-[var(--color-neutral-800)] text-sm leading-snug mb-1 line-clamp-2">
          {property.title}
        </h3>

        {/* Location */}
        <p className="text-xs text-[var(--color-neutral-400)] mb-3 flex items-center gap-1">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {property.neighbourhood}, {property.lga} · {property.state}
        </p>

        {/* Price */}
        <p
          className="
            font-[family-name:var(--font-display)]
            font-bold text-xl
            text-[var(--color-primary-600)]
            mb-3 leading-none
          "
        >
          {formatNaira(listing.annualRent)}
          <span className="font-sans font-normal text-xs text-[var(--color-neutral-400)] ml-1">
            /yr
          </span>
        </p>

        {/* Features row */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-neutral-500)]">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble size={12} aria-hidden="true" />
              {property.bedrooms} bed
            </span>
          )}
          <span className="flex items-center gap-1">
            <Bath size={12} aria-hidden="true" />
            {property.bathrooms} bath
          </span>

          <div className="flex items-center gap-1.5 ml-auto">
            {property.isFurnished && (
              <span className="bg-[var(--color-accent-50)] text-[var(--color-accent-700)] px-2 py-0.5 rounded-full font-medium text-[11px]">
                Furnished
              </span>
            )}
            {property.isServiced && (
              <span className="bg-[var(--color-primary-50)] text-[var(--color-primary-700)] px-2 py-0.5 rounded-full font-medium text-[11px]">
                Serviced
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Hover reveal footer ─────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="
          flex items-center justify-center gap-1.5
          py-2.5
          border-t border-[var(--color-neutral-100)]
          text-xs font-semibold text-[var(--color-primary-600)]
          bg-[var(--color-primary-50)]
          opacity-0 translate-y-1
          group-hover:opacity-100 group-hover:translate-y-0
          transition-all duration-200
        "
      >
        View listing
        <ArrowRight size={12} />
      </div>
    </Link>
  );
}
