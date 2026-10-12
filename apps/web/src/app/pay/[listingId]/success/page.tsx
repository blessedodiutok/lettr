"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "next/navigation";
import { apiClient } from "../../../../lib/axios";
import { Button } from "../../../../components/ui/button";

export default function PaymentSuccessPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const paymentId = useSearchParams().get("paymentId");
  const { data: payment, isLoading, refetch } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const response = await apiClient.post(`/api/payments/${paymentId}/verify`);
      return response.data.data as { status: string };
    },
    enabled: Boolean(paymentId),
    refetchInterval: (query) => query.state.data?.status === "PENDING" ? 3000 : false,
  });
  const confirmed = payment?.status === "IN_ESCROW" || payment?.status === "RELEASED";
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center space-y-6">
      <h1 className="text-3xl font-bold">{confirmed ? "Payment confirmed" : "Confirming your payment"}</h1>
      <p>{confirmed ? "Your payment is in escrow and your tenancy agreement is ready." : "We are waiting for Paystack to confirm the transaction."}</p>
      {!confirmed && !isLoading && <Button onClick={() => refetch()}>Check again</Button>}
      <Button variant="secondary" onClick={() => { window.location.href = confirmed ? "/dashboard" : `/pay/${listingId}`; }}>
        {confirmed ? "Go to dashboard" : "Return to payment"}
      </Button>
    </main>
  );
}
