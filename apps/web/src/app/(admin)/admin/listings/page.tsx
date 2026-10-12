"use client";

import { formatCurrency, formatDate } from "@lettr/utils";
import Link from "next/link";
import { useState } from "react";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { ReasonDialog } from "../../../../components/admin/ReasonDialog";
import { Button } from "../../../../components/ui/button";
import { PageHeader, StatusPill } from "../../../../components/ui/display";
import { useAdminList, useAdminMutation } from "../../../../hooks/useAdmin";

interface Row {
  id: string;
  status: string;
  annualRent: number;
  viewCount: number;
  createdAt: string;
  property: { title: string; neighbourhood: string; state: string };
  landlord: { id: string; firstName: string; lastName: string; email: string; landlordProfile: { verificationStatus: string } | null };
  _count: { inquiries: number };
}

const STATUSES = [
  { value: "", label: "All listings" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_OFFER", label: "Under offer" },
  { value: "TAKEN", label: "Let" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "ARCHIVED", label: "Archived" },
];

export default function AdminListingsPage() {
  const [filters, setFilters] = useState<{ q?: string; status?: string; page?: number }>({ page: 1 });
  const query = useAdminList<Row>("listings", filters);
  const moderate = useAdminMutation("Listing updated");
  const [target, setTarget] = useState<{ row: Row; status: "ACTIVE" | "SUSPENDED" } | null>(null);

  return (
    <>
      <PageHeader title="Listings" description="Suspend listings that are misleading or break the rules. The landlord is told why." />
      <AdminTable
        query={query}
        statuses={STATUSES}
        filters={filters}
        setFilters={setFilters}
        columns={["Home", "Landlord", "Rent", "Status", "Activity", ""]}
        rowKey={(r) => r.id}
        row={(r) => (
          <>
            <td className="px-4 py-3">
              <Link href={`/listings/${r.id}`} className="font-semibold text-ink hover:text-navy">
                {r.property.title}
              </Link>
              <p className="text-xs text-muted">
                {r.property.neighbourhood}, {r.property.state} · {formatDate(r.createdAt)}
              </p>
            </td>
            <td className="px-4 py-3 text-ink-2">
              {r.landlord.firstName} {r.landlord.lastName}
              <span className="block text-xs text-muted">{r.landlord.landlordProfile?.verificationStatus.replace("_", " ").toLowerCase()}</span>
            </td>
            <td className="tnum px-4 py-3 text-ink">{formatCurrency(r.annualRent)}</td>
            <td className="px-4 py-3">
              <StatusPill kind="listing" status={r.status} />
            </td>
            <td className="tnum px-4 py-3 text-xs text-muted">
              {r.viewCount} views · {r._count.inquiries} inquiries
            </td>
            <td className="px-4 py-3 text-right">
              {r.status === "ACTIVE" && (
                <Button variant="danger" size="sm" onClick={() => setTarget({ row: r, status: "SUSPENDED" })}>
                  Suspend
                </Button>
              )}
              {r.status === "SUSPENDED" && (
                <Button variant="secondary" size="sm" onClick={() => setTarget({ row: r, status: "ACTIVE" })}>
                  Reinstate
                </Button>
              )}
            </td>
          </>
        )}
      />
      <ReasonDialog
        open={Boolean(target)}
        onOpenChange={(v) => !v && setTarget(null)}
        title={target?.status === "SUSPENDED" ? "Suspend listing" : "Reinstate listing"}
        description="The landlord receives this reason by email."
        confirmLabel={target?.status === "SUSPENDED" ? "Suspend" : "Reinstate"}
        tone={target?.status === "SUSPENDED" ? "danger" : "primary"}
        isLoading={moderate.isPending}
        onConfirm={(reason) => target && moderate.mutate({ method: "patch", path: `/api/admin/listings/${target.row.id}`, body: { status: target.status, reason } }, { onSuccess: () => setTarget(null) })}
      />
    </>
  );
}
