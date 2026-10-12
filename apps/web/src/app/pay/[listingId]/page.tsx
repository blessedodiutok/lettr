// File: apps/web/src/app/pay/[listingId]/page.tsx
import type { Metadata } from "next";
import { PaymentFlow } from "../../../components/payment/PaymentFlow";

export const metadata: Metadata = { title: "Complete your payment" };

export default function PayPage({ params }: { params: { listingId: string } }) {
  return (
    <div className="min-h-screen bg-[var(--color-neutral-50)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <PaymentFlow listingId={params.listingId} />
      </div>
    </div>
  );
}
