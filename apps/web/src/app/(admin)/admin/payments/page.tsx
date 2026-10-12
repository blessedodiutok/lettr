"use client";

import { formatCurrency, formatDate } from "@lettr/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { ReasonDialog } from "../../../../components/admin/ReasonDialog";
import { Button } from "../../../../components/ui/button";
import { PageHeader, StatusPill } from "../../../../components/ui/display";
import { useAdminList, useAdminMutation } from "../../../../hooks/useAdmin";

interface Row {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  releaseError: string | null;
  releaseAttempts: number;
  receipt: { receiptNumber: string } | null;
  tenant: { firstName: string; lastName: string; email: string };
  listing: { id: string; property: { title: string }; landlord: { firstName: string; lastName: string } };
  tenancyAgreement: { id: string; autoReleaseAt: string | null; isHandoverConfirmed: boolean } | null;
}

const STATUSES = [
  { value: "", label: "All payments" },
  { value: "ISSUES", label: "Payout problems" },
  { value: "IN_ESCROW", label: "In escrow" },
  { value: "RELEASED", label: "Paid out" },
  { value: "PENDING", label: "Awaiting payment" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "FAILED", label: "Failed" },
];

function PaymentsAdmin() {
  const [filters, setFilters] = useState<{ q?: string; status?: string; page?: number }>({ status: useSearchParams().get("status") ?? undefined, page: 1 });
  const query = useAdminList<Row>("payments", filters);
  const release = useAdminMutation("Payout released");
  const refund = useAdminMutation("Refund issued");
  const [refunding, setRefunding] = useState<Row | null>(null);

  return (
    <>
      <PageHeader title="Payments" description="Escrow, payouts and refunds across the platform." />
      <AdminTable
        query={query}
        statuses={STATUSES}
        filters={filters}
        setFilters={setFilters}
        columns={["Home", "Tenant", "Amount", "Status", "Receipt", ""]}
        rowKey={(r) => r.id}
        row={(r) => (
          <>
            <td className="px-4 py-3">
              <p className="font-semibold text-ink">{r.listing.property.title}</p>
              <p className="text-xs text-muted">
                Landlord {r.listing.landlord.firstName} {r.listing.landlord.lastName} · {formatDate(r.createdAt)}
              </p>
              {r.releaseError && <p className="mt-1 text-xs font-medium text-bad">{r.releaseError} (attempt {r.releaseAttempts})</p>}
            </td>
            <td className="px-4 py-3 text-ink-2">
              {r.tenant.firstName} {r.tenant.lastName}
              <span className="block text-xs text-muted">{r.tenant.email}</span>
            </td>
            <td className="tnum px-4 py-3 font-semibold text-ink">{formatCurrency(r.totalAmount)}</td>
            <td className="px-4 py-3">
              <StatusPill kind="payment" status={r.status} />
              {r.status === "IN_ESCROW" && r.tenancyAgreement?.autoReleaseAt && <span className="mt-1 block text-xs text-muted">Auto {formatDate(r.tenancyAgreement.autoReleaseAt)}</span>}
            </td>
            <td className="tnum px-4 py-3 text-ink-2">{r.receipt?.receiptNumber ?? "—"}</td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1.5">
                {r.tenancyAgreement && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/tenancies/${r.tenancyAgreement.id}`}>Tenancy</Link>
                  </Button>
                )}
                {r.status === "IN_ESCROW" && (
                  <>
                    <Button variant="secondary" size="sm" isLoading={release.isPending} onClick={() => release.mutate({ method: "post", path: `/api/payments/${r.id}/release` })}>
                      Release
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setRefunding(r)}>
                      Refund
                    </Button>
                  </>
                )}
              </div>
            </td>
          </>
        )}
      />
      <ReasonDialog
        open={Boolean(refunding)}
        onOpenChange={(v) => !v && setRefunding(null)}
        title="Refund this payment in full"
        description={refunding ? `${formatCurrency(refunding.totalAmount)} goes back to ${refunding.tenant.firstName}. The tenancy is cancelled and the home is listed again.` : undefined}
        confirmLabel="Refund"
        tone="danger"
        isLoading={refund.isPending}
        onConfirm={(reason) => refunding && refund.mutate({ method: "post", path: `/api/payments/${refunding.id}/refund`, body: { reason } }, { onSuccess: () => setRefunding(null) })}
      />
    </>
  );
}

export default function AdminPaymentsPage() {
  return (
    <Suspense>
      <PaymentsAdmin />
    </Suspense>
  );
}
