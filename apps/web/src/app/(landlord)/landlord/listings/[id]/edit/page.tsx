"use client";

import { useParams } from "next/navigation";
import { ListingEditor } from "../../../../../../components/landlord/ListingEditor";
import { ErrorState, PageHeader, Skeleton } from "../../../../../../components/ui/display";
import { useMyListing } from "../../../../../../hooks/useListings";
import { errorMessage } from "../../../../../../lib/api";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, error } = useMyListing(id);
  if (isPending) return <Skeleton className="h-[600px] w-full" />;
  if (isError || !data) return <ErrorState message={errorMessage(error, "We couldn't open this listing.")} />;
  return (
    <>
      <PageHeader eyebrow="Edit listing" title={data.property.title} />
      {/* Remount when the listing changes identity so the form re-initialises. */}
      <ListingEditor key={data.id} listing={data} />
    </>
  );
}
