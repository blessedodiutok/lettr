"use client";

// Local development stand-in for Paystack's checkout page. The API only
// accepts simulated payments when it has no Paystack key outside production.

import { FlaskConical } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, ErrorState } from "../../../../../components/ui/display";
import { useSimulatePayment } from "../../../../../hooks/usePayments";
import { errorMessage } from "../../../../../lib/api";

function Simulator() {
  const { listingId } = useParams<{ listingId: string }>();
  const paymentId = useSearchParams().get("paymentId") ?? "";
  const router = useRouter();
  const simulate = useSimulatePayment();
  return (
    <Card>
      <FlaskConical className="size-8 text-warn" aria-hidden />
      <h1 className="mt-3 font-display text-2xl font-medium text-ink">Test payment</h1>
      <p className="mt-2 text-[15px] text-ink-2">Paystack isn&apos;t configured on this server, so this page stands in for the checkout. No money moves.</p>
      {simulate.isError && (
        <div className="mt-4">
          <ErrorState message={errorMessage(simulate.error)} />
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button variant="accent" isLoading={simulate.isPending} onClick={() => simulate.mutate(paymentId, { onSuccess: () => router.replace(`/pay/${listingId}/result?paymentId=${paymentId}`) })}>
          Simulate a successful payment
        </Button>
        <Button variant="secondary" onClick={() => router.replace(`/pay/${listingId}`)}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}

export default function SimulatePage() {
  return (
    <div className="mx-auto max-w-xl py-6">
      <Suspense>
        <Simulator />
      </Suspense>
    </div>
  );
}
