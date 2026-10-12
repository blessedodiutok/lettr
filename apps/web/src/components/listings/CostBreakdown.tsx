import { formatCurrency, type MoveInCost } from "@lettr/utils";
import { cn } from "../../lib/cn";

/** The one way money is shown before a tenant pays. Figures come from shared pricing code. */
export function CostBreakdown({ cost, className, showSaving = true }: { cost: MoveInCost; className?: string; showSaving?: boolean }) {
  const rows: Array<[string, number, string?]> = [
    ["Annual rent", cost.annualRent],
    ["Caution fee", cost.cautionFee, "Refundable at the end of the tenancy"],
    ...(cost.serviceCharge ? [["Service charge", cost.serviceCharge] as [string, number]] : []),
    ...(cost.legalFee ? [["Legal fee", cost.legalFee] as [string, number]] : []),
    ["Lettr fee (3%)", cost.platformFee],
  ];
  return (
    <div className={className}>
      <dl className="grid gap-2 text-sm">
        {rows.map(([label, value, hint]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-ink-2">
              {label}
              {hint && <span className="block text-xs text-muted">{hint}</span>}
            </dt>
            <dd className="tnum text-ink">{formatCurrency(value)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-4 border-t border-line pt-3 text-[15px] font-bold text-ink">
          <dt>Total to move in</dt>
          <dd className="tnum">{formatCurrency(cost.total)}</dd>
        </div>
      </dl>
      {showSaving && cost.netSaving > 0 && (
        <p className={cn("mt-4 rounded-control bg-ok-soft px-3 py-2.5 text-[13px] font-semibold text-ok")}>
          You save {formatCurrency(cost.netSaving)} compared with a 15% agent fee.
        </p>
      )}
    </div>
  );
}
