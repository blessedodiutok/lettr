// File: apps/web/src/app/listings/[id]/page.tsx
import type { Metadata } from "next";
import { ListingDetail } from "../../../components/ListingDetail";

interface Props {
  params: { id: string };
}

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return {
    title: `Property Listing`,
    description:
      "View property details, photos, and contact the landlord directly on Lettr.",
  };
}

export default function ListingDetailPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)]">
      <ListingDetail listingId={params.id} />
    </div>
  );
}
