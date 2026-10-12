"use client";

import { formatCurrency } from "@lettr/utils";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, ErrorState } from "../../../../../components/ui/display";
import { usePaymentStatus } from "../../../../../hooks/usePayments";
import { errorMessage } from "../../../../../lib/api";

function Result() {
  const { listingId } = useParams<{ listingId: string }>();
  const params = useSearchParams();
  const paymentId = params.get("paymentId") ?? params.get("reference");
  const { data: payment, isError, error, refetch, isFetching } = usePaymentStatus(paymentId);

  if (!paymentId) return <ErrorState message="This payment link is incomplete. Check your payments page." />;
  if (isError) return <ErrorState message={errorMessage(error, "We couldn't check this payment.")} onRetry={() => refetch()} />;

  const status = payment?.status ?? "PENDING";
  if (status === "IN_ESCROW" || status === "RELEASED") {
    return (
      <Card className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-ok" aria-hidden />
        <h1 className="mt-3 font-display text-[28px] font-medium text-ink">Payment received</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          {formatCurrency(payment!.totalAmount)} is safely in escrow{payment?.receipt ? ` (receipt ${payment.receipt.receiptNumber})` : ""}. Next, sign your tenancy agreement.
        </p>
        <Button asChild variant="accent" className="mt-6">
          <Link href={payment?.tenancyAgreement ? `/tenancies/${payment.tenancyAgreement.id}` : "/tenancies"}>Review and sign the agreement</Link>
        </Button>
      </Card>
    );
  }
  if (status === "FAILED" || status === "REFUNDED") {
    return (
      <Card className="text-center">
        <XCircle className="mx-auto size-12 text-bad" aria-hidden />
        <h1 className="mt-3 font-display text-[28px] font-medium text-ink">{status === "REFUNDED" ? "Payment refunded" : "Payment didn't go through"}</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          {status === "REFUNDED" ? payment?.refundReason ?? "Your money is on its way back to you." : "No money was taken. You can try again while the home is held for you."}
        </p>
        <Button asChild className="mt-6">
          <Link href={`/pay/${listingId}`}>Try again</Link>
        </Button>
      </Card>
    );
  }
  return (
    <Card className="text-center">
      <Clock className="mx-auto size-12 animate-pulse text-info" aria-hidden />
      <h1 className="mt-3 font-display text-[28px] font-medium text-ink">Confirming your payment</h1>
      <p className="mt-2 text-[15px] text-ink-2">This usually takes a few seconds. Bank transfers can take a few minutes — you can leave this page and we&apos;ll notify you.</p>
      <Button variant="secondary" className="mt-6" isLoading={isFetching} onClick={() => refetch()}>
        Check again
      </Button>
    </Card>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="mx-auto max-w-xl py-6">
      <Suspense>
        <Result />
      </Suspense>
    </div>
  );
}
