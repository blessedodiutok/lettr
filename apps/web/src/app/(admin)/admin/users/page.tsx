"use client";

import { formatDate } from "@lettr/utils";
import { useState } from "react";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { ReasonDialog } from "../../../../components/admin/ReasonDialog";
import { Button } from "../../../../components/ui/button";
import { PageHeader, Pill } from "../../../../components/ui/display";
import { useAdminList, useAdminMutation } from "../../../../hooks/useAdmin";

interface Row {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  landlordProfile: { verificationStatus: string; totalRentalsCompleted: number } | null;
}

const STATUSES = [
  { value: "", label: "Everyone" },
  { value: "TENANT", label: "Tenants" },
  { value: "LANDLORD", label: "Landlords" },
  { value: "ADMIN", label: "Admins" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function AdminUsersPage() {
  const [filters, setFilters] = useState<{ q?: string; status?: string; page?: number }>({ page: 1 });
  const query = useAdminList<Row>("users", filters);
  const moderate = useAdminMutation("Account updated");
  const [target, setTarget] = useState<Row | null>(null);

  return (
    <>
      <PageHeader title="Users" description="Suspending an account signs it out everywhere and hides its listings immediately." />
      <AdminTable
        query={query}
        statuses={STATUSES}
        filters={filters}
        setFilters={setFilters}
        columns={["Name", "Role", "Joined", "Last login", "Status", ""]}
        rowKey={(r) => r.id}
        row={(r) => (
          <>
            <td className="px-4 py-3">
              <p className="font-semibold text-ink">
                {r.firstName} {r.lastName}
              </p>
              <p className="text-xs text-muted">
                {r.email}
                {r.phone ? ` · ${r.phone}` : ""}
              </p>
            </td>
            <td className="px-4 py-3 text-ink-2">
              {r.role.toLowerCase()}
              {r.landlordProfile && <span className="block text-xs text-muted">{r.landlordProfile.verificationStatus.replace("_", " ").toLowerCase()}</span>}
            </td>
            <td className="px-4 py-3 text-ink-2">{formatDate(r.createdAt)}</td>
            <td className="px-4 py-3 text-ink-2">{r.lastLoginAt ? formatDate(r.lastLoginAt) : "Never"}</td>
            <td className="px-4 py-3">
              {!r.isActive ? <Pill tone="bad">Suspended</Pill> : r.isEmailVerified ? <Pill tone="ok">Active</Pill> : <Pill tone="warn">Unverified email</Pill>}
            </td>
            <td className="px-4 py-3 text-right">
              {r.role !== "ADMIN" && (
                <Button variant={r.isActive ? "danger" : "secondary"} size="sm" onClick={() => setTarget(r)}>
                  {r.isActive ? "Suspend" : "Reinstate"}
                </Button>
              )}
            </td>
          </>
        )}
      />
      <ReasonDialog
        open={Boolean(target)}
        onOpenChange={(v) => !v && setTarget(null)}
        title={target?.isActive ? `Suspend ${target.firstName}?` : `Reinstate ${target?.firstName}?`}
        confirmLabel={target?.isActive ? "Suspend account" : "Reinstate account"}
        tone={target?.isActive ? "danger" : "primary"}
        isLoading={moderate.isPending}
        onConfirm={(reason) => target && moderate.mutate({ method: "patch", path: `/api/admin/users/${target.id}`, body: { isActive: !target.isActive, reason } }, { onSuccess: () => setTarget(null) })}
      />
    </>
  );
}
