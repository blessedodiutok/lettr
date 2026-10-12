"use client";

import { formatCurrency, formatDateTime } from "@lettr/utils";
import { Gavel } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ReasonDialog } from "../../../../components/admin/ReasonDialog";
import { Button } from "../../../../components/ui/button";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton, StatusPill } from "../../../../components/ui/display";
import { Field, Select } from "../../../../components/ui/field";
import { useAdminMutation, useAdminQuery } from "../../../../hooks/useAdmin";

interface DisputeRow {
  id: string;
  status: string;
  reason: string;
  outcome: string | null;
  resolution: string | null;
  createdAt: string;
  openedBy: { firstName: string; lastName: string; email: string; role: string };
  payment: {
    id: string;
    status: string;
    totalAmount: number;
    tenancyAgreementId: string | null;
    tenant: { firstName: string; lastName: string; email: string };
    listing: { id: string; property: { title: string }; landlord: { firstName: string; lastName: string; email: string } };
  };
}

const OUTCOMES = [
  { value: "NO_ACTION", label: "No money moves (resolved between the parties)" },
  { value: "RELEASE_TO_LANDLORD", label: "Release the payout to the landlord" },
  { value: "REFUND_TENANT", label: "Refund the tenant in full" },
];

export default function AdminDisputesPage() {
  const { data, isPending, isError, refetch } = useAdminQuery<DisputeRow[]>("disputes", "/api/admin/disputes");
  const resolve = useAdminMutation("Dispute resolved");
  const [active, setActive] = useState<DisputeRow | null>(null);
  const [outcome, setOutcome] = useState("NO_ACTION");
  const [status, setStatus] = useState<"RESOLVED" | "REJECTED">("RESOLVED");

  return (
    <>
      <PageHeader title="Disputes" description="While a dispute is open, the payout for that tenancy is paused." />
      {isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState message="We couldn't load disputes." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={<Gavel className="size-5" />} title="No disputes" />
      ) : (
        <ul className="grid gap-3">
          {data.map((d) => {
            const open = d.status === "OPEN" || d.status === "UNDER_REVIEW";
            return (
              <Card as="div" key={d.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{d.payment.listing.property.title}</p>
                      <StatusPill kind="dispute" status={d.status} />
                      <StatusPill kind="payment" status={d.payment.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      Raised by {d.openedBy.firstName} {d.openedBy.lastName} ({d.openedBy.role.toLowerCase()}) · {formatDateTime(d.createdAt)} · {formatCurrency(d.payment.totalAmount)}
                    </p>
                  </div>
                  {open && (
                    <Button size="sm" onClick={() => setActive(d)}>
                      Resolve
                    </Button>
                  )}
                </div>
                <p className="mt-3 rounded-control bg-surface-2 p-3 text-sm text-ink-2">{d.reason}</p>
                <p className="mt-3 text-xs text-muted">
                  Tenant {d.payment.tenant.firstName} {d.payment.tenant.lastName} ({d.payment.tenant.email}) · Landlord {d.payment.listing.landlord.firstName} {d.payment.listing.landlord.lastName} ({d.payment.listing.landlord.email})
                  {d.payment.tenancyAgreementId && (
                    <>
                      {" · "}
                      <Link href={`/tenancies/${d.payment.tenancyAgreementId}`} className="font-semibold text-navy hover:underline">
                        Open tenancy
                      </Link>
                    </>
                  )}
                </p>
                {d.resolution && <p className="mt-2 text-sm text-ink-2">Resolution: {d.resolution}</p>}
              </Card>
            );
          })}
        </ul>
      )}
      <ReasonDialog
        open={Boolean(active)}
        onOpenChange={(v) => !v && setActive(null)}
        title="Resolve dispute"
        description="Both parties are emailed the resolution."
        confirmLabel="Resolve dispute"
        isLoading={resolve.isPending}
        onConfirm={(resolution) =>
          active && resolve.mutate({ method: "patch", path: `/api/admin/disputes/${active.id}`, body: { status, outcome, resolution } }, { onSuccess: () => setActive(null) })
        }
      >
        <Field label="Outcome">
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {OUTCOMES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Decision">
          <Select value={status} onChange={(e) => setStatus(e.target.value as "RESOLVED" | "REJECTED")}>
            <option value="RESOLVED">Upheld / resolved</option>
            <option value="REJECTED">Rejected — no grounds</option>
          </Select>
        </Field>
      </ReasonDialog>
    </>
  );
}
