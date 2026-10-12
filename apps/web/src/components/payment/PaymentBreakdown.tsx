// File: apps/web/src/components/payment/PaymentBreakdown.tsx
import { formatNaira } from "../../lib/utils";

interface PaymentBreakdownProps {
  annualRent: number;
  cautionFee: number;
  platformFee: number;
  agentFeeSaved: number;
  totalAmount: number;
}

export function PaymentBreakdown({
  annualRent,
  cautionFee,
  platformFee,
  agentFeeSaved,
  totalAmount,
}: PaymentBreakdownProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-[var(--color-neutral-700)]">
        <span>Annual rent</span>
        <span className="font-semibold">{formatNaira(annualRent)}</span>
      </div>
      <div className="flex justify-between text-[var(--color-neutral-700)]">
        <span>Caution fee</span>
        <span className="font-semibold">{formatNaira(cautionFee)}</span>
      </div>
      <div className="flex justify-between text-[var(--color-neutral-700)]">
        <span>Platform fee (3%)</span>
        <span className="font-semibold">{formatNaira(platformFee)}</span>
      </div>
      <div className="flex justify-between text-[var(--color-neutral-700)] line-through text-[var(--color-neutral-400)]">
        <span>Agent fee (15%) — waived</span>
        <span>{formatNaira(agentFeeSaved)}</span>
      </div>
      <div className="border-t border-[var(--color-neutral-200)] pt-2 flex justify-between font-bold text-base">
        <span>Total</span>
        <span style={{ fontFamily: "var(--font-display)" }}>
          {formatNaira(totalAmount)}
        </span>
      </div>
    </div>
  );
}
