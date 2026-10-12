import { formatDate } from "@lettr/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingCard } from "../../../../components/listings/ListingCard";
import { Avatar, EmptyState, Stars, VerifiedBadge } from "../../../../components/ui/display";
import type { PublicLandlord } from "../../../../lib/types";
import { fetchPublic } from "../../../../lib/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const landlord = await fetchPublic<PublicLandlord>(`/api/users/landlords/${id}`);
  return { title: landlord ? `${landlord.firstName} ${landlord.lastName.charAt(0)}. — landlord` : "Landlord" };
}

export default async function LandlordProfilePage({ params }: Props) {
  const { id } = await params;
  const landlord = await fetchPublic<PublicLandlord>(`/api/users/landlords/${id}`);
  if (!landlord) notFound();
  const profile = landlord.landlordProfile;

  return (
    <div className="page py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar person={landlord} size={80} />
        <div>
          <h1 className="font-display text-[32px] font-medium leading-tight text-ink">
            {profile?.businessName ?? `${landlord.firstName} ${landlord.lastName}`}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            {profile?.verificationStatus === "VERIFIED" && <VerifiedBadge />}
            {profile && profile.totalReviews > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Stars rating={profile.averageRating} /> {profile.averageRating.toFixed(1)} from {profile.totalReviews} reviews
              </span>
            )}
            <span>{profile?.totalRentalsCompleted ?? 0} tenancies on Lettr</span>
            <span>Member since {formatDate(landlord.createdAt)}</span>
          </div>
          {profile?.bio && <p className="mt-3 max-w-2xl text-[15px] text-ink-2">{profile.bio}</p>}
        </div>
      </header>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold text-ink">Homes available now</h2>
        {landlord.listings.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {landlord.listings.map((listing) => (
              <ListingCard key={listing.id} listing={{ ...listing, isSaved: false }} />
            ))}
          </div>
        ) : (
          <EmptyState title="No homes available right now" />
        )}
      </section>

      {landlord.reviewsReceived.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-ink">Reviews from tenants</h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {landlord.reviewsReceived.map((review) => (
              <li key={review.id} className="rounded-card border border-line bg-surface p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">
                    {review.reviewer.firstName} {review.reviewer.lastName.charAt(0)}.
                  </p>
                  <Stars rating={review.rating} />
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{review.title}</p>
                <p className="mt-1 text-sm text-ink-2">{review.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
