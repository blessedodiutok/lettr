"use client";

import { formatAppointment, formatCurrency, formatRelativeDate } from "@lettr/utils";
import { Heart, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { JourneyStepper } from "../../../components/journey/JourneyStepper";
import { Button } from "../../../components/ui/button";
import { Avatar, Card, EmptyState, Skeleton, StatusPill } from "../../../components/ui/display";
import { useInquiries } from "../../../hooks/useInquiries";
import { useSavedListings } from "../../../hooks/useListings";
import { useMyTenancies } from "../../../hooks/usePayments";
import type { InquiryListItem } from "../../../lib/types";
import { useAuthStore } from "../../../stores/authStore";

const PROGRESS: Record<string, number> = { ACCEPTED: 5, OFFER_MADE: 4, INSPECTION_COMPLETED: 3, INSPECTION_SCHEDULED: 2, RESPONDED: 1, OPEN: 0 };

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function nextStep(inquiry: InquiryListItem): { text: string; action?: { label: string; href: string; accent?: boolean } } {
  const name = inquiry.landlord.firstName;
  switch (inquiry.status) {
    case "OFFER_MADE":
      return {
        text: `${name} offered you this home${inquiry.offerExpiresAt ? ` — open until ${formatAppointment(inquiry.offerExpiresAt)}` : ""}.`,
        action: { label: "Review the offer", href: `/messages/${inquiry.id}`, accent: true },
      };
    case "ACCEPTED":
      return {
        text: `The home is held for you${inquiry.paymentDueAt ? ` until ${formatAppointment(inquiry.paymentDueAt)}` : ""}. Pay into escrow to secure it.`,
        action: { label: "Pay into escrow", href: `/pay/${inquiry.listingId}`, accent: true },
      };
    case "INSPECTION_SCHEDULED":
      return {
        text: inquiry.inspectionBooking
          ? `Inspection ${inquiry.inspectionBooking.isConfirmed ? "confirmed" : "proposed"} for ${formatAppointment(inquiry.inspectionBooking.scheduledAt)}.`
          : "Inspection being arranged.",
        action: { label: "Open conversation", href: `/messages/${inquiry.id}` },
      };
    case "OPEN":
      return { text: `Waiting for ${name} to reply.`, action: { label: "Open conversation", href: `/messages/${inquiry.id}` } };
    default:
      return { text: `Keep talking with ${name}, or book an inspection.`, action: { label: "Open conversation", href: `/messages/${inquiry.id}` } };
  }
}

export default function TenantHomePage() {
  const user = useAuthStore((s) => s.user);
  const inquiries = useInquiries("active");
  const saved = useSavedListings();
  const tenancies = useMyTenancies();

  const pending = (inquiries.data ?? []).filter((i) => !i.payment || !["IN_ESCROW", "RELEASED"].includes(i.payment.status));
  const focus = [...pending].sort((a, b) => (PROGRESS[b.status] ?? 0) - (PROGRESS[a.status] ?? 0))[0];
  const openTenancy = (tenancies.data ?? []).find((t) => !t.cancelledAt && !t.isHandoverConfirmed);
  const currentHome = (tenancies.data ?? []).find((t) => t.isHandoverConfirmed && !t.cancelledAt);
  const loading = inquiries.isPending || tenancies.isPending;

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-[30px] font-medium text-ink">
          {greeting()}, {user?.firstName}
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          {openTenancy ? "Your rent is in escrow — finish the steps below to move in." : focus ? "Here's where things stand." : "Let's find your next home."}
        </p>
      </header>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : openTenancy ? (
        <Card>
          <p className="eyebrow mb-1">Your next home</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">{openTenancy.listing.property.title}</h2>
            <Button asChild variant="accent">
              <Link href={`/tenancies/${openTenancy.id}`}>Continue</Link>
            </Button>
          </div>
          <JourneyStepper
            className="mt-6"
            input={{
              inquiry: { status: "ACCEPTED", createdAt: openTenancy.createdAt },
              payment: openTenancy.payments[0] ?? null,
              tenancy: openTenancy,
            }}
          />
        </Card>
      ) : focus ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow mb-1">Your next home</p>
              <h2 className="text-lg font-semibold text-ink">{focus.listing.property.title}</h2>
              <p className="text-sm text-muted">
                {focus.listing.property.neighbourhood} · {formatCurrency(focus.listing.annualRent)} a year
              </p>
            </div>
            <StatusPill kind="inquiry" status={focus.status} />
          </div>
          <JourneyStepper className="mt-6" input={{ inquiry: focus, payment: focus.payment }} />
          {(() => {
            const step = nextStep(focus);
            return (
              <div className="mt-6 flex flex-col gap-3 rounded-card border border-brass/40 bg-brass-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-ink">{step.text}</p>
                {step.action && (
                  <Button asChild size="sm" variant={step.action.accent ? "accent" : "primary"}>
                    <Link href={step.action.href}>{step.action.label}</Link>
                  </Button>
                )}
              </div>
            );
          })()}
        </Card>
      ) : currentHome ? (
        <Card>
          <p className="eyebrow mb-1">Your home</p>
          <h2 className="text-lg font-semibold text-ink">{currentHome.listing.property.title}</h2>
          <Link href={`/tenancies/${currentHome.id}`} className="mt-2 inline-block text-sm font-semibold text-navy hover:underline">
            View your tenancy
          </Link>
        </Card>
      ) : (
        <EmptyState
          icon={<Search className="size-5" />}
          title="Find a home and message the landlord"
          description="Browse homes, ask questions and book inspections — all without an agent."
          action={
            <Button asChild>
              <Link href="/listings">Browse homes</Link>
            </Button>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Conversations</h2>
            <Link href="/messages" className="text-sm font-semibold text-navy hover:underline">
              All messages
            </Link>
          </div>
          {inquiries.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : !inquiries.data?.length ? (
            <p className="py-4 text-sm text-muted">No conversations yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {inquiries.data.slice(0, 4).map((i) => (
                <li key={i.id}>
                  <Link href={`/messages/${i.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <Avatar person={i.landlord} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {i.landlord.firstName} · {i.listing.property.title}
                      </p>
                      <p className="truncate text-[13px] text-muted">{i.lastMessage?.body ?? "No messages yet"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted">{formatRelativeDate(i.updatedAt).replace("about ", "")}</span>
                      {i.unreadCount > 0 && <span className="size-2 rounded-full bg-brass" aria-label="Unread" />}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Saved homes</h2>
            <Link href="/dashboard/saved" className="text-sm font-semibold text-navy hover:underline">
              See all
            </Link>
          </div>
          {saved.isPending ? (
            <Skeleton className="h-32 w-full" />
          ) : !saved.data?.length ? (
            <p className="flex items-center gap-2 py-4 text-sm text-muted">
              <Heart className="size-4" aria-hidden /> Tap the heart on a home to save it.
            </p>
          ) : (
            <ul className="grid gap-3">
              {saved.data.slice(0, 3).map(({ listing }) => (
                <li key={listing.id}>
                  <Link href={`/listings/${listing.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-[6px] bg-surface-2">
                      {listing.property.photos[0] && <Image src={listing.property.photos[0].url} alt="" fill sizes="64px" className="object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{listing.property.title}</p>
                      <p className="tnum text-[13px] text-muted">{formatCurrency(listing.annualRent)}/yr</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
