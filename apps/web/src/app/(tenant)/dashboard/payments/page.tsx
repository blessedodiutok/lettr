"use client";

import { formatCurrency } from "@lettr/utils";
import { Receipt } from "lucide-react";
import { PaymentsTable } from "../../../../components/payments/PaymentsTable";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../../../../components/ui/display";
import { useMyPayments } from "../../../../hooks/usePayments";

export default function TenantPaymentsPage() {
  const { data, isPending, isError, refetch } = useMyPayments();
  const settled = (data ?? []).filter((p) => ["IN_ESCROW", "RELEASED"].includes(p.status));
  const saved = settled.reduce((sum, p) => sum + p.agentFeeSaved - p.platformFee, 0);

  return (
    <>
      <PageHeader title="Payments" description="Everything you've paid through Lettr, with receipts." />
      {isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState message="We couldn't load your payments." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={<Receipt className="size-5" />} title="No payments yet" description="When you pay into escrow for a home, the receipt appears here." />
      ) : (
        <div className="grid gap-5">
          {saved > 0 && (
            <Card className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm text-ink-2">Saved compared with a 15% agent fee</p>
              <p className="tnum text-2xl font-bold text-ok">{formatCurrency(saved)}</p>
            </Card>
          )}
          <PaymentsTable payments={data} view="tenant" />
        </div>
      )}
    </>
  );
}
