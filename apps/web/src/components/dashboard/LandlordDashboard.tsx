// File: apps/web/src/components/dashboard/LandlordDashboard.tsx
"use client";

import {
  Building2,
  CheckCircle,
  Edit,
  Eye,
  MessageSquare,
  PlusCircle,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMyInquiries } from "../../hooks/useInquiries";
import { useMyListings, type Listing } from "../../hooks/useListings";
import { cn, formatNaira, formatPropertyType } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import { EmptyState } from "../EmptyState";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { DashboardShell } from "./DashboardShell";
import { StatCard } from "./StatCard";

/* ── Listing status pill ───────────────────────────────────────────────────── */
function ListingStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:
      "bg-[var(--color-success-50)]  text-[var(--color-success-700)]  border-[var(--color-success-200)]",
    UNDER_OFFER:
      "bg-[var(--color-warning-50)]  text-[var(--color-warning-700)]  border-[var(--color-warning-200)]",
    TAKEN:
      "bg-[var(--color-primary-50)]  text-[var(--color-primary-700)]  border-[var(--color-primary-200)]",
    ARCHIVED:
      "bg-[var(--color-neutral-100)] text-[var(--color-neutral-500)]  border-[var(--color-neutral-200)]",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Active",
    UNDER_OFFER: "Under offer",
    TAKEN: "Taken",
    ARCHIVED: "Archived",
    DRAFT: "Draft",
    SUSPENDED: "Suspended",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full",
        "text-[11px] font-semibold border whitespace-nowrap",
        styles[status] ?? styles.ARCHIVED,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

/* ── Listing row ───────────────────────────────────────────────────────────── */
function ListingRow({
  listing,
  inquiryCount,
}: {
  listing: Listing;
  inquiryCount: number;
}) {
  const coverPhoto =
    listing.property.photos?.find((p) => p.isCover) ??
    listing.property.photos?.[0];

  return (
    <div
      className="
      flex items-center gap-4 px-5 py-4
      hover:bg-(--color-neutral-50)
      transition-colors duration-150
      group
    "
    >
      {/* Thumbnail */}
      <div
        className="
        relative w-16 h-12 rounded-lg overflow-hidden
        bg-neutral-100
        shrink-0 border border-neutral-200
      "
      >
        {coverPhoto ? (
          <Image
            src={coverPhoto.url}
            alt={coverPhoto.altText ?? listing.property.title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2
              size={16}
              className="text-neutral-300"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-semibold text-sm text-neutral-800 truncate">
            {listing.property.title}
          </p>
          <ListingStatusBadge status={listing.status} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-neutral-500">
            {formatPropertyType(listing.property.propertyType)} ·{" "}
            {listing.property.neighbourhood}, {listing.property.state}
          </p>
          {inquiryCount > 0 && (
            <span
              className="
              inline-flex items-center gap-1
              text-[11px] font-semibold
              text-brand-navy
              bg-(--color-primary-50)
              px-2 py-0.5 rounded-full
              border border-(--color-primary-100)
            "
            >
              <MessageSquare size={9} aria-hidden="true" />
              {inquiryCount} {inquiryCount === 1 ? "inquiry" : "inquiries"}
            </span>
          )}
        </div>
      </div>

      {/* Rent */}
      <div className="text-right shrink-0 hidden sm:block">
        <p
          className="
          font-(family-name:--font-display)
          font-bold text-sm text-neutral-800
          whitespace-nowrap
        "
        >
          {formatNaira(listing.annualRent)}
        </p>
        <p className="text-[10px] text-neutral-400">/year</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link href={`/listings/${listing.id}`}>
          <Button
            variant="ghost"
            size="xs"
            className="gap-1 text-neutral-500"
            aria-label={`View ${listing.property.title}`}
          >
            <Eye size={13} aria-hidden="true" />
            View
          </Button>
        </Link>
        <Link href={`/landlord/listings/${listing.id}/edit`}>
          <Button
            variant="ghost"
            size="xs"
            className="gap-1 text-neutral-500"
            aria-label={`Edit ${listing.property.title}`}
          >
            <Edit size={13} aria-hidden="true" />
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export function LandlordDashboard() {
  const { user } = useAuthStore();
  const { data: listings, isLoading } = useMyListings();
  // Always call hooks unconditionally — React rules of hooks
  const { data: inquiries } = useMyInquiries();

  const activeCount =
    listings?.filter((l) => l.status === "ACTIVE").length ?? 0;
  const takenCount = listings?.filter((l) => l.status === "TAKEN").length ?? 0;
  const pendingCount =
    listings?.filter((l) => l.status === "PENDING").length ?? 0;

  const totalRevenue =
    listings
      ?.filter((l) => l.status === "TAKEN")
      .reduce((sum, l) => sum + (l.annualRent ?? 0), 0) ?? 0;

  /* Map inquiry counts by listing ID */
  const inquiryCountByListing: Record<string, number> = {};
  if (inquiries) {
    for (const inquiry of inquiries) {
      inquiryCountByListing[inquiry.listingId] =
        (inquiryCountByListing[inquiry.listingId] ?? 0) + 1;
    }
  }

  return (
    <DashboardShell
      greeting={`My portfolio, ${user?.firstName ?? ""}`}
      subheading="Manage your listings, track inquiries, and grow your income"
      ctaLabel="New listing"
      ctaHref="/landlord/listings/new"
    >
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Total listings"
            value={listings?.length ?? 0}
            icon={<Building2 size={18} />}
            sub={
              pendingCount > 0 ? `${pendingCount} under review` : "All listings"
            }
            variant="default"
          />
          <StatCard
            label="Active"
            value={activeCount}
            icon={<CheckCircle size={18} />}
            sub="Currently available"
            variant="success"
          />
          <StatCard
            label="Rented out"
            value={takenCount}
            icon={<TrendingUp size={18} />}
            sub="Occupied properties"
            variant="accent"
          />
          <StatCard
            label="Est. revenue"
            value={formatNaira(totalRevenue)}
            icon={<TrendingUp size={18} />}
            sub="From rented properties"
            variant="warning"
          />
        </div>
      )}

      {/* ── Listings ────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="label-section mb-1">Your properties</p>
            <h2 className="font-semibold text-neutral-800">All listings</h2>
          </div>
          <Link href="/landlord/listings/new">
            <Button variant="outline" size="sm" className="gap-1.5">
              <PlusCircle size={14} aria-hidden="true" />
              Add listing
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : !listings?.length ? (
          <EmptyState
            icon="home"
            title="No listings yet"
            description="Create your first listing and start receiving direct inquiries from tenants."
            ctaLabel="Create a listing"
            ctaHref="/landlord/listings/new"
          />
        ) : (
          <div
            className="
            bg-white rounded-2xl
            border border-neutral-200
            shadow-card
            overflow-hidden
          "
          >
            {/* Table header — desktop only */}
            <div
              className="
              hidden sm:flex items-center
              px-5 py-3 gap-4
              bg-(--color-neutral-50)
              border-b border-neutral-200
            "
            >
              <div className="w-16 shrink-0" aria-hidden="true" />
              <p className="label-section flex-1">Property</p>
              <p className="label-section hidden sm:block w-24 text-right">
                Rent
              </p>
              <div className="w-28" aria-hidden="true" />
            </div>

            {/* Rows */}
            <div className="divide-y divide-neutral-100">
              {listings.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  inquiryCount={inquiryCountByListing[listing.id] ?? 0}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      {listings && listings.length > 0 && (
        <section>
          <p className="label-section mb-3">Quick actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                href: "/landlord/listings/new",
                icon: <PlusCircle size={18} />,
                title: "Add a listing",
                sub: "List a new property",
              },
              {
                href: "/landlord/inquiries",
                icon: <MessageSquare size={18} />,
                title: "View inquiries",
                sub: "Messages from tenants",
              },
              {
                href: "/landlord/tenancies",
                icon: <CheckCircle size={18} />,
                title: "Active tenancies",
                sub: "Manage your tenants",
              },
            ].map(({ href, icon, title, sub }) => (
              <Link
                key={href}
                href={href}
                className="
                  flex items-center gap-3.5
                  bg-white rounded-xl p-4
                  border border-neutral-200
                  shadow-card
                  hover:shadow-card-hover
                  hover:-translate-y-0.5 hover:border-(--color-primary-200)
                  transition-all duration-200
                  group
                "
              >
                <div
                  className="
                  w-10 h-10 rounded-xl shrink-0
                  bg-(--color-primary-50)
                  text-brand-navy
                  flex items-center justify-center
                  group-hover:bg-brand-navy
                  group-hover:text-white
                  transition-colors duration-200
                "
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-800 truncate">
                    {title}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
