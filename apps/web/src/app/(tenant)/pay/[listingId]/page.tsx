"use client";

import { formatAppointment, formatCurrency } from "@lettr/utils";
import { Lock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CostBreakdown } from "../../../../components/listings/CostBreakdown";
import { Button } from "../../../../components/ui/button";
import { Card, ErrorState, Skeleton } from "../../../../components/ui/display";
import { useInquiryForListing } from "../../../../hooks/useInquiries";
import { useListing } from "../../../../hooks/useListings";
import { useInitiatePayment } from "../../../../hooks/usePayments";
import { errorMessage } from "../../../../lib/api";
import { IS_DEMO } from "../../../../lib/demo";

export default function CheckoutPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const listing = useListing(listingId);
  const thread = useInquiryForListing(listingId, true);
  const initiate = useInitiatePayment();

  if (listing.isPending || thread.isPending) return <Skeleton className="mx-auto h-[480px] w-full max-w-2xl" />;
  if (listing.isError || !listing.data) return <ErrorState message={errorMessage(listing.error, "This home isn't available.")} />;

  const home = listing.data;
  const inquiry = thread.data;
  const paid = inquiry?.payment && ["IN_ESCROW", "RELEASED"].includes(inquiry.payment.status);

  if (paid && inquiry?.tenancy) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-2xl font-medium text-ink">You&apos;ve already paid for this home</h1>
        <Button asChild className="mt-4">
          <Link href={`/tenancies/${inquiry.tenancy.id}`}>Go to your tenancy</Link>
        </Button>
      </Card>
    );
  }

  if (!inquiry || inquiry.status !== "ACCEPTED") {
    return (
      <Card className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-medium text-ink">Payment opens after you accept an offer</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Talk to {home.landlord.firstName} first. When they offer you the home and you accept, you&apos;ll be able to pay into escrow here.
        </p>
        <Button asChild className="mt-5">
          <Link href={inquiry ? `/messages/${inquiry.id}` : `/listings/${listingId}`}>{inquiry ? "Open your conversation" : "Back to the listing"}</Link>
        </Button>
      </Card>
    );
  }

  const cover = home.property.photos[0]?.url;
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <header>
        <p className="eyebrow mb-1">Secure checkout</p>
        <h1 className="font-display text-[30px] font-medium text-ink">Pay into escrow</h1>
        {inquiry.paymentDueAt && <p className="mt-1 text-[15px] text-muted">The home is held for you until {formatAppointment(inquiry.paymentDueAt)}.</p>}
      </header>

      <Card className="flex items-center gap-4">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-control bg-surface-2">{cover && <Image src={cover} alt="" fill sizes="96px" className="object-cover" />}</div>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{home.property.title}</p>
          <p className="text-sm text-muted">
            {home.property.neighbourhood}, {home.property.state} · landlord {home.landlord.firstName} {home.landlord.lastName}
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold text-ink">What you&apos;ll pay</h2>
        <CostBreakdown cost={home.moveInCost} />
      </Card>

      <Card className="grid gap-3 text-sm text-ink-2">
        <p className="flex gap-3">
          <ShieldCheck className="size-5 shrink-0 text-ok" aria-hidden />
          Lettr holds the money. {home.landlord.firstName} is paid only after you confirm you have the keys, or 7 days after handover if you raise no problem.
        </p>
        <p className="flex gap-3">
          <Lock className="size-5 shrink-0 text-ink-2" aria-hidden />
          {IS_DEMO ? "This is a demo, so no money moves and no payment details are asked for. The next page simulates a successful payment." : "You'll pay on Paystack's secure page by card, bank transfer or USSD. Large transfers may need your bank's approval — that's why the home is held for 72 hours."}
        </p>
      </Card>

      {initiate.isError && <ErrorState message={errorMessage(initiate.error)} />}
      <Button
        variant="accent"
        size="lg"
        block
        isLoading={initiate.isPending}
        onClick={() =>
          initiate.mutate(listingId, {
            onSuccess: (session) => {
              window.location.assign(session.authorizationUrl);
            },
          })
        }
      >
        {IS_DEMO ? "Continue to simulated payment" : `Pay ${formatCurrency(home.moveInCost.total)} securely`}
      </Button>
      <p className="-mt-3 text-center text-xs text-muted">{IS_DEMO ? "Simulated checkout. The real one is handled by Paystack." : "Payments processed by Paystack. Lettr never sees your card details."}</p>
    </div>
  );
}
