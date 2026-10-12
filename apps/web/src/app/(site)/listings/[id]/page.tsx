import { formatCurrency, formatPropertyType } from "@lettr/utils";
import type { Metadata } from "next";
import { ListingDetail } from "../../../../components/listings/ListingDetail";
import type { Listing } from "../../../../lib/types";
import { fetchPublic } from "../../../../lib/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchPublic<Listing>(`/api/listings/${id}`);
  if (!listing) return { title: "Home to rent" };
  const { property } = listing;
  const title = `${property.title} — ${formatCurrency(listing.annualRent)}/yr`;
  const description = `${formatPropertyType(property.propertyType)} in ${property.neighbourhood}, ${property.state}. Rent directly from the landlord on Lettr — no agent fee.`;
  const cover = property.photos.find((p) => p.isCover) ?? property.photos[0];
  return { title, description, openGraph: { title, description, images: cover ? [{ url: cover.url }] : undefined } };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  // Public homes render on the server for search engines and link previews.
  // Private states (a tenant's own held home) load in the browser with the session.
  const initial = (await fetchPublic<Listing>(`/api/listings/${id}`)) ?? undefined;
  return <ListingDetail id={id} initial={initial} />;
}
