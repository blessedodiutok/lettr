"use client";

import { formatCurrency, formatRelativeDate } from "@lettr/utils";
import { Building2, Eye, MessageSquare, MoreHorizontal, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { ConfirmDialog } from "../../../../components/ui/dialog";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatusPill } from "../../../../components/ui/display";
import { useListingStatusAction, useMyListings } from "../../../../hooks/useListings";
import type { Listing } from "../../../../lib/types";

function Actions({ listing }: { listing: Listing }) {
  const action = useListingStatusAction();
  const [confirm, setConfirm] = useState<null | "archive" | "delete">(null);
  const item = "flex cursor-pointer items-center rounded-[6px] px-2.5 py-2 text-sm text-ink outline-none data-[highlighted]:bg-surface-2";
  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="grid size-9 place-items-center rounded-control text-muted hover:bg-surface-2" aria-label={`Actions for ${listing.property.title}`}>
          <MoreHorizontal className="size-5" />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4} className="z-50 w-52 rounded-card border border-line bg-surface p-1.5 shadow-3">
            <DropdownMenu.Item asChild className={item}>
              <Link href={`/landlord/listings/${listing.id}/edit`}>Edit details and photos</Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild className={item}>
              <Link href={`/listings/${listing.id}`}>Preview as a tenant</Link>
            </DropdownMenu.Item>
            {listing.status === "ACTIVE" && (
              <DropdownMenu.Item className={item} onSelect={() => setConfirm("archive")}>
                Take off the market
              </DropdownMenu.Item>
            )}
            {listing.status === "ARCHIVED" && (
              <DropdownMenu.Item className={item} onSelect={() => action.mutate({ id: listing.id, action: "publish" })}>
                Publish again
              </DropdownMenu.Item>
            )}
            {listing.status === "DRAFT" && (
              <DropdownMenu.Item className={`${item} text-bad`} onSelect={() => setConfirm("delete")}>
                Delete draft
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(v) => !v && setConfirm(null)}
          title={confirm === "archive" ? "Take this home off the market?" : "Delete this draft?"}
          description={confirm === "archive" ? "It disappears from search and open conversations are closed. You can publish it again later." : "The draft and its photos will be deleted."}
          confirmLabel={confirm === "archive" ? "Take off market" : "Delete draft"}
          tone="danger"
          isLoading={action.isPending}
          onConfirm={() => action.mutate({ id: listing.id, action: confirm }, { onSettled: () => setConfirm(null) })}
        />
      )}
    </>
  );
}

export default function LandlordListingsPage() {
  const { data, isPending, isError, refetch } = useMyListings();
  return (
    <>
      <PageHeader
        title="Listings"
        description="Every home you've listed, in every status."
        actions={
          <Button asChild>
            <Link href="/landlord/listings/new">
              <Plus className="size-4" aria-hidden /> New listing
            </Link>
          </Button>
        }
      />
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState message="We couldn't load your listings." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title="No listings yet"
          description="List your first home for free. Tenants message you directly."
          action={
            <Button asChild>
              <Link href="/landlord/listings/new">Create a listing</Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {data.map((l) => {
            const cover = l.property.photos.find((p) => p.isCover) ?? l.property.photos[0];
            return (
              <li key={l.id} className="flex items-center gap-4 rounded-card border border-line bg-surface p-3 sm:p-4">
                <Link href={`/landlord/listings/${l.id}/edit`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-control bg-surface-2 sm:h-20 sm:w-28">
                  {cover && <Image src={cover.url} alt="" fill sizes="112px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/landlord/listings/${l.id}/edit`} className="truncate font-semibold text-ink hover:text-navy">
                      {l.property.title}
                    </Link>
                    <StatusPill kind="listing" status={l.status} />
                  </div>
                  <p className="text-[13px] text-muted">
                    {l.property.neighbourhood}, {l.property.state} · updated {formatRelativeDate(l.updatedAt)}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 text-[13px] text-ink-2">
                    <span className="tnum font-semibold text-ink">{formatCurrency(l.annualRent)}/yr</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" aria-hidden /> {l.viewCount} views
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3.5" aria-hidden /> {l.openInquiries ?? 0} open
                    </span>
                  </p>
                </div>
                <Actions listing={l} />
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
