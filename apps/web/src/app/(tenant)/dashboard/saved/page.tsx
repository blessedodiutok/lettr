"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ListingCard, ListingCardSkeleton } from "../../../../components/listings/ListingCard";
import { Button } from "../../../../components/ui/button";
import { EmptyState, ErrorState, PageHeader } from "../../../../components/ui/display";
import { useSavedListings } from "../../../../hooks/useListings";

export default function SavedPage() {
  const { data, isPending, isError, refetch } = useSavedListings();
  return (
    <>
      <PageHeader title="Saved homes" description="Homes you've saved. A home disappears from here once it's let." />
      {isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't load your saved homes." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-5" />}
          title="No saved homes yet"
          description="Tap the heart on any home to keep it here."
          action={
            <Button asChild>
              <Link href="/listings">Browse homes</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map(({ listing }) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </>
  );
}
