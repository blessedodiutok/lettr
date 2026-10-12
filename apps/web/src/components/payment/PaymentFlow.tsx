// File: apps/web/src/components/payment/PaymentFlow.tsx
"use client";

import { useEffect } from "react";
import { useListing } from "../../hooks/useListings";
import { useInitiatePayment } from "../../hooks/usePayments";
import { formatNaira } from "../../lib/utils";
import { usePaymentStore } from "../../stores/paymentStore";
import { SavingsCallout } from "../SavingsCallout";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface PaymentFlowProps {
  listingId: string;
}

export function PaymentFlow({ listingId }: PaymentFlowProps) {
  const { step, breakdown, authorizationUrl, setListing, reset } =
    usePaymentStore();
  const initiatePayment = useInitiatePayment();
  const { data: listing, isLoading } = useListing(listingId);

  useEffect(() => {
    setListing(listingId);
    return () => reset();
  }, [listingId, setListing, reset]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!listing) return null;

  // Step 1: Review listing and cost breakdown
  if (step === 1) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-md)] p-8 space-y-6">
        <div>
          <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wide mb-1">
            Step 1 of 3
          </p>
          <h2
            className="text-2xl font-bold text-[var(--color-primary-600)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Review your payment
          </h2>
        </div>

        <div className="rounded-xl border border-[var(--color-neutral-200)] p-4">
          <p className="font-semibold text-[var(--color-neutral-800)]">
            {listing.property.title}
          </p>
          <p className="text-sm text-[var(--color-neutral-500)]">
            {listing.property.neighbourhood}, {listing.property.state}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-[var(--color-neutral-700)]">
            <span>Annual rent</span>
            <span className="font-semibold">
              {formatNaira(listing.annualRent)}
            </span>
          </div>
          <div className="flex justify-between text-[var(--color-neutral-700)]">
            <span>Caution fee (refundable)</span>
            <span className="font-semibold">
              {formatNaira(listing.cautionFee)}
            </span>
          </div>
          <div className="flex justify-between text-[var(--color-neutral-700)]">
            <span>Lettr platform fee (3%)</span>
            <span className="font-semibold">
              {formatNaira(listing.annualRent * 0.03)}
            </span>
          </div>
          {listing.serviceCharge > 0 && (
            <div className="flex justify-between text-[var(--color-neutral-700)]">
              <span>Service charge</span>
              <span className="font-semibold">{formatNaira(listing.serviceCharge)}</span>
            </div>
          )}
          {listing.legalFee > 0 && (
            <div className="flex justify-between text-[var(--color-neutral-700)]">
              <span>Legal fee</span>
              <span className="font-semibold">{formatNaira(listing.legalFee)}</span>
            </div>
          )}
          <div className="border-t border-[var(--color-neutral-200)] pt-2 flex justify-between font-bold text-base text-[var(--color-neutral-900)]">
            <span>Total</span>
            <span style={{ fontFamily: "var(--font-display)" }}>
              {formatNaira(
                listing.annualRent +
                  listing.cautionFee +
                  listing.serviceCharge +
                  listing.legalFee +
                  listing.annualRent * 0.03,
              )}
            </span>
          </div>
        </div>

        <SavingsCallout annualRent={listing.annualRent} variant="card" />

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => initiatePayment.mutate(listingId)}
          isLoading={initiatePayment.isPending}
        >
          Continue to payment
        </Button>
      </div>
    );
  }

  // Step 2: Method selection + redirect to Paystack
  if (step === 2 && authorizationUrl) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-md)] p-8 space-y-6">
        <div>
          <p className="text-xs font-semibold text-[var(--color-neutral-500)] uppercase tracking-wide mb-1">
            Step 2 of 3
          </p>
          <h2
            className="text-2xl font-bold text-[var(--color-primary-600)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Choose payment method
          </h2>
        </div>

        <div className="bg-[var(--color-neutral-50)] rounded-xl p-4 text-sm text-[var(--color-neutral-600)]">
          <p>
            You'll be securely redirected to Paystack — Nigeria's most trusted
            payment gateway. They accept debit cards, bank transfer, and USSD.
          </p>
        </div>

        {breakdown && (
          <div className="border-t border-[var(--color-neutral-200)] pt-4">
            <div className="flex justify-between font-bold">
              <span>Total to pay</span>
              <span
                className="text-xl text-[var(--color-primary-600)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {formatNaira(breakdown.totalAmount)}
              </span>
            </div>
            <p className="text-xs text-[var(--color-success-600)] font-semibold mt-1">
              You save{" "}
              {formatNaira(breakdown.agentFeeSaved - breakdown.platformFee)} vs
              agent
            </p>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => {
            window.location.href = authorizationUrl;
          }}
        >
          Pay securely with Paystack →
        </Button>
      </div>
    );
  }

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="bg-white rounded-2xl shadow-[var(--shadow-md)] p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-success-50)] rounded-full">
          <span className="text-3xl">✅</span>
        </div>
        <h2
          className="text-2xl font-bold text-[var(--color-success-700)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Payment confirmed!
        </h2>
        <p className="text-[var(--color-neutral-600)]">
          Your funds are held safely in escrow. The landlord will be notified to
          arrange handover.
        </p>
        {breakdown && (
          <div className="bg-[var(--color-success-50)] rounded-xl px-6 py-4">
            <p className="text-sm font-semibold text-[var(--color-success-700)]">
              You saved{" "}
              {formatNaira(breakdown.agentFeeSaved - breakdown.platformFee)} vs
              a traditional agent
            </p>
          </div>
        )}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => (window.location.href = "/dashboard")}
        >
          Go to dashboard
        </Button>
      </div>
    );
  }

  return null;
}
