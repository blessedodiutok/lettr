"use client";

import { formatAppointment } from "@lettr/utils";
import { Lock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCreateInquiry, useInquiryForListing } from "../../hooks/useInquiries";
import { errorCode, errorData, errorMessage } from "../../lib/api";
import type { Listing } from "../../lib/types";
import { useAuthStore } from "../../stores/authStore";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Skeleton, StatusPill } from "../ui/display";
import { Field, Textarea } from "../ui/field";

function InquiryComposer({ listing, open, onOpenChange }: { listing: Listing; open: boolean; onOpenChange: (v: boolean) => void }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const create = useCreateInquiry();
  const [message, setMessage] = useState(
    `Hello ${listing.landlord.firstName}, I'm interested in ${listing.property.title}. Is it still available, and when could I come to see it?`,
  );
  const tooShort = message.trim().length < 20;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Message ${listing.landlord.firstName}`}
      description="Introduce yourself. Landlords reply faster when they know who you are and when you'd like to move."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            isLoading={create.isPending}
            disabled={tooShort}
            onClick={() =>
              create.mutate(
                { listingId: listing.id, message: message.trim() },
                {
                  onSuccess: (thread) => router.push(`/messages/${thread.id}`),
                  onError: (error) => {
                    const existing = errorData<{ inquiryId: string }>(error);
                    if (errorCode(error) === "INQUIRY_EXISTS" && existing) router.push(`/messages/${existing.inquiryId}`);
                  },
                },
              )
            }
          >
            Send message
          </Button>
        </>
      }
    >
      <Field label="Your message" hint={`Sending as ${user?.firstName ?? "you"}. The landlord sees your name and your profile.`} error={create.isError ? errorMessage(create.error) : undefined}>
        <Textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
      </Field>
    </Dialog>
  );
}

export function ListingActions({ listing }: { listing: Listing }) {
  const { status, user } = useAuthStore();
  const isTenant = user?.role === "TENANT";
  const thread = useInquiryForListing(listing.id, status === "authenticated" && isTenant);
  const [composing, setComposing] = useState(false);
  const next = encodeURIComponent(`/listings/${listing.id}`);

  const note = (
    <p className="mt-4 flex gap-2 text-[13px] leading-relaxed text-muted">
      <Lock className="mt-0.5 size-3.5 shrink-0 text-ink-2" aria-hidden />
      Payment opens when {listing.landlord.firstName} offers you the home. Paystack holds your money until you confirm you have the keys.
    </p>
  );

  if (status === "loading") return <Skeleton className="h-12 w-full" />;

  if (status === "anonymous") {
    return (
      <div>
        <Button asChild size="lg" block>
          <Link href={`/auth/signup?role=TENANT&next=${next}`}>Message {listing.landlord.firstName}</Link>
        </Button>
        <p className="mt-3 text-center text-[13px] text-muted">
          Already have an account?{" "}
          <Link href={`/auth/login?next=${next}`} className="font-semibold text-navy hover:underline">
            Log in
          </Link>
        </p>
        {note}
      </div>
    );
  }

  if (user?.id === listing.landlordId) {
    return (
      <div className="grid gap-2">
        <Button asChild size="lg" block>
          <Link href={`/landlord/listings/${listing.id}/edit`}>Edit this listing</Link>
        </Button>
        <p className="text-center text-[13px] text-muted">This is how tenants see your listing.</p>
      </div>
    );
  }

  if (!isTenant) return <p className="text-sm text-muted">Sign in with a tenant account to contact this landlord.</p>;
  if (thread.isPending) return <Skeleton className="h-12 w-full" />;

  const inquiry = thread.data;
  const closed = inquiry && ["DECLINED", "EXPIRED"].includes(inquiry.status);

  if (!inquiry || closed) {
    if (listing.status !== "ACTIVE") return <p className="rounded-control bg-surface-2 p-3 text-sm text-ink-2">This home is no longer available.</p>;
    return (
      <div>
        <Button size="lg" block onClick={() => setComposing(true)}>
          <MessageSquare className="size-4" aria-hidden /> {closed ? "Start a new conversation" : `Message ${listing.landlord.firstName}`}
        </Button>
        {note}
        <InquiryComposer listing={listing} open={composing} onOpenChange={setComposing} />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3 rounded-control bg-surface-2 px-3 py-2.5">
        <span className="text-sm text-ink-2">Your conversation</span>
        <StatusPill kind="inquiry" status={inquiry.status} />
      </div>
      {inquiry.status === "ACCEPTED" && !inquiry.payment?.status.match(/IN_ESCROW|RELEASED/) ? (
        <>
          <Button asChild variant="accent" size="lg" block>
            <Link href={`/pay/${listing.id}`}>Pay into escrow</Link>
          </Button>
          {inquiry.paymentDueAt && <p className="text-center text-[13px] text-muted">Held for you until {formatAppointment(inquiry.paymentDueAt)}</p>}
        </>
      ) : inquiry.tenancy ? (
        <Button asChild size="lg" block>
          <Link href={`/tenancies/${inquiry.tenancy.id}`}>View your tenancy</Link>
        </Button>
      ) : (
        <Button asChild size="lg" block variant={inquiry.status === "OFFER_MADE" ? "accent" : "primary"}>
          <Link href={`/messages/${inquiry.id}`}>{inquiry.status === "OFFER_MADE" ? "Review the offer" : "Open conversation"}</Link>
        </Button>
      )}
    </div>
  );
}
