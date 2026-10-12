"use client";

import { enumToLabel, formatDateTime } from "@lettr/utils";
import { useState } from "react";
import { AdminTable } from "../../../../components/admin/AdminTable";
import { PageHeader } from "../../../../components/ui/display";
import { useAdminList } from "../../../../hooks/useAdmin";

interface Row {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  createdAt: string;
  admin: { firstName: string; lastName: string; email: string };
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<{ q?: string; status?: string; page?: number }>({ page: 1 });
  const query = useAdminList<Row>("audit-log", filters);
  return (
    <>
      <PageHeader title="Audit log" description="Every admin action, including each time an identity document is opened." />
      <AdminTable
        query={query}
        statuses={[{ value: "", label: "All actions" }]}
        filters={filters}
        setFilters={setFilters}
        columns={["When", "Admin", "Action", "Target", "Reason"]}
        rowKey={(r) => r.id}
        row={(r) => (
          <>
            <td className="whitespace-nowrap px-4 py-3 text-ink-2">{formatDateTime(r.createdAt)}</td>
            <td className="px-4 py-3 text-ink-2">
              {r.admin.firstName} {r.admin.lastName}
            </td>
            <td className="px-4 py-3 font-medium text-ink">{enumToLabel(r.action)}</td>
            <td className="px-4 py-3 font-mono text-xs text-muted">
              {r.targetType.toLowerCase()} {r.targetId.slice(-8)}
            </td>
            <td className="px-4 py-3 text-ink-2">{r.reason ?? "—"}</td>
          </>
        )}
      />
    </>
  );
}
