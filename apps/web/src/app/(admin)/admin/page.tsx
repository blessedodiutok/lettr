"use client";

import { formatCurrency } from "@lettr/utils";
import Link from "next/link";
import { Card, ErrorState, PageHeader, Skeleton } from "../../../components/ui/display";
import { useAdminOverview } from "../../../hooks/useAdmin";

export default function AdminOverviewPage() {
  const { data, isPending, isError, refetch } = useAdminOverview();
  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorState message="We couldn't load the overview." onRetry={() => refetch()} />;

  const queues = [
    { label: "Verifications to review", value: data.pendingVerifications, href: "/admin/verifications" },
    { label: "Open disputes", value: data.openDisputes, href: "/admin/disputes" },
    { label: "Payout problems", value: data.payoutIssues, href: "/admin/payments?status=ISSUES" },
  ];

  return (
    <>
      <PageHeader title="Admin overview" description="Queues that need a person, and the state of money on the platform." />
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        {queues.map((q) => (
          <Link key={q.label} href={q.href} className={`rounded-card border bg-surface p-4 hover:shadow-2 ${q.value ? "border-brass/50" : "border-line"}`}>
            <p className="text-[13px] text-muted">{q.label}</p>
            <p className={`tnum mt-1 text-3xl font-bold ${q.value ? "text-warn" : "text-ink"}`}>{q.value}</p>
          </Link>
        ))}
      </section>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold text-ink">Money</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">In escrow ({data.escrow.count})</dt>
              <dd className="tnum font-semibold">{formatCurrency(data.escrow.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Released ({data.released.count})</dt>
              <dd className="tnum font-semibold">{formatCurrency(data.released.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Platform fees earned</dt>
              <dd className="tnum font-semibold">{formatCurrency(data.released.platformFees)}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink">Users</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            {Object.entries(data.users).map(([role, count]) => (
              <div key={role} className="flex justify-between">
                <dt className="text-muted">{role.charAt(0) + role.slice(1).toLowerCase()}s</dt>
                <dd className="tnum font-semibold">{count}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold text-ink">Listings</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            {Object.entries(data.listings).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <dt className="text-muted">{status.replace("_", " ").toLowerCase()}</dt>
                <dd className="tnum font-semibold">{count}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
