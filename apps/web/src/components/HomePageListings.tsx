// File: apps/web/src/components/HomepageListings.tsx
// Client component that fetches and renders the 6 most popular active listings

"use client";

import { useListings } from "../hooks/useListings";
import { EmptyState } from "./EmptyState";
import { PropertyCard } from "./PropertyCard";
import { PropertyCardSkeletonGrid } from "./ui/skeleton";

export function HomepageListings() {
  const { data, isLoading, isError } = useListings({}, 1);

  if (isLoading) return <PropertyCardSkeletonGrid count={6} />;

  if (isError || !data?.listings.length) {
    return (
      <EmptyState
        icon="home"
        title="No listings yet"
        description="Check back soon — new properties are added daily."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.listings.slice(0, 6).map((listing) => (
        <PropertyCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
