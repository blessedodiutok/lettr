"use client";

import { useListingSearch } from "../../hooks/useListings";
import { EmptyState, ErrorState } from "../ui/display";
import { ListingCard, ListingCardSkeleton } from "./ListingCard";

export function LatestListings() {
  const { data, isPending, isError, refetch } = useListingSearch({ sortBy: "newest" }, 6);
  if (isPending) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState message="We couldn't load homes right now." onRetry={() => refetch()} />;
  if (!data.listings.length) return <EmptyState title="No homes listed yet" description="New homes are added every week — check back soon." />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.listings.map((listing, i) => (
        <ListingCard key={listing.id} listing={listing} priority={i < 3} />
      ))}
    </div>
  );
}
