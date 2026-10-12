"use client";

import { formatCurrency, formatCurrencyShort, formatPropertyType } from "@lettr/utils";
import { Heart, ImageOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToggleSave } from "../../hooks/useListings";
import { cn } from "../../lib/cn";
import type { Listing } from "../../lib/types";
import { useAuthStore } from "../../stores/authStore";
import { VerifiedBadge } from "../ui/display";

export function SaveButton({ listing, className }: { listing: Pick<Listing, "id" | "isSaved">; className?: string }) {
  const { status, user } = useAuthStore();
  const router = useRouter();
  const toggle = useToggleSave();
  if (user && user.role !== "TENANT") return null;
  return (
    <button
      type="button"
      aria-pressed={listing.isSaved}
      aria-label={listing.isSaved ? "Remove from saved homes" : "Save this home"}
      disabled={toggle.isPending}
      onClick={() => {
        if (status !== "authenticated") {
          router.push(`/auth/login?next=${encodeURIComponent(`/listings/${listing.id}`)}`);
          return;
        }
        toggle.mutate({ listingId: listing.id, saved: listing.isSaved });
      }}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/95 text-[#34465A] shadow-1 transition hover:scale-105 active:scale-95",
        className,
      )}
    >
      <Heart className={cn("size-[18px]", listing.isSaved && "fill-[#B42318] text-[#B42318]")} aria-hidden />
    </button>
  );
}

export function ListingCard({ listing, priority }: { listing: Listing; priority?: boolean }) {
  const { property } = listing;
  const cover = property.photos.find((p) => p.isCover) ?? property.photos[0];
  const verified = listing.landlord.landlordProfile?.verificationStatus === "VERIFIED";
  const href = `/listings/${listing.id}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-1 transition-shadow hover:shadow-2">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.altText ?? property.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted">
            <ImageOff className="size-8" aria-hidden />
          </div>
        )}
        {verified && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-0.5 shadow-1">
            <VerifiedBadge compact className="text-[12px] text-[#1D774A]" />
          </span>
        )}
      </div>
      <SaveButton listing={listing} className="absolute right-2.5 top-2.5 z-10" />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">
          <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {property.title}
          </Link>
        </h3>
        <p className="mt-0.5 text-[13px] text-muted">
          {property.neighbourhood} · {property.lga}
        </p>
        <p className="mt-2.5 text-[13px] text-ink-2">
          {[
            formatPropertyType(property.propertyType),
            property.bedrooms ? `${property.bedrooms} bed` : null,
            `${property.bathrooms} bath`,
            property.isServiced ? "Serviced" : null,
            property.isFurnished ? "Furnished" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-auto flex items-baseline justify-between gap-2 pt-3">
          <p className="tnum text-lg font-bold tracking-tight text-ink">
            {formatCurrency(listing.annualRent)}
            <span className="ml-1 text-[13px] font-medium text-muted">/yr</span>
          </p>
          <p className="tnum text-[12px] text-muted" title="Rent, caution fee, charges and Lettr's 3% fee">
            Move in {formatCurrencyShort(listing.moveInCost.total)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton mt-4 h-5 w-1/3" />
      </div>
    </div>
  );
}
