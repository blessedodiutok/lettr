"use client";

import { VERIFICATION_DOCUMENT_TYPES } from "@lettr/types";
import { formatDateTime } from "@lettr/utils";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ReasonDialog } from "../../../../components/admin/ReasonDialog";
import { Button } from "../../../../components/ui/button";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../../../../components/ui/display";
import { openVerificationDocument, useAdminMutation, useAdminQuery } from "../../../../hooks/useAdmin";

interface QueueItem {
  id: string;
  documentType: string;
  documentNumber: string | null;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone: string | null; role: string; createdAt: string };
}

const LABELS = Object.fromEntries(VERIFICATION_DOCUMENT_TYPES.map((d) => [d.value, d.label]));

export default function AdminVerificationsPage() {
  const { data, isPending, isError, refetch } = useAdminQuery<QueueItem[]>("verifications", "/api/admin/verifications");
  const review = useAdminMutation("Verification decision recorded");
  const [rejecting, setRejecting] = useState<QueueItem | null>(null);

  return (
    <>
      <PageHeader title="Verifications" description="Check that the document is genuine, legible and matches the account name." />
      {isPending ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <ErrorState message="We couldn't load the queue." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="size-5" />} title="Queue is empty" description="New documents appear here as landlords submit them." />
      ) : (
        <ul className="grid gap-3">
          {data.map((item) => (
            <Card as="div" key={item.id} className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">
                  {item.user.firstName} {item.user.lastName} <span className="font-normal text-muted">· {item.user.role.toLowerCase()}</span>
                </p>
                <p className="text-sm text-ink-2">
                  {LABELS[item.documentType] ?? item.documentType}
                  {item.documentNumber ? ` · ${item.documentNumber}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {item.user.email} · submitted {formatDateTime(item.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => openVerificationDocument(item.id)}>
                  View document
                </Button>
                <Button size="sm" isLoading={review.isPending} onClick={() => review.mutate({ method: "patch", path: `/api/admin/verifications/${item.id}`, body: { status: "VERIFIED" } })}>
                  Approve
                </Button>
                <Button variant="danger" size="sm" onClick={() => setRejecting(item)}>
                  Reject
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
      <ReasonDialog
        open={Boolean(rejecting)}
        onOpenChange={(v) => !v && setRejecting(null)}
        title="Reject this document"
        description="The landlord sees this reason and can upload another document."
        confirmLabel="Reject"
        tone="danger"
        isLoading={review.isPending}
        onConfirm={(reason) =>
          rejecting && review.mutate({ method: "patch", path: `/api/admin/verifications/${rejecting.id}`, body: { status: "REJECTED", rejectionReason: reason } }, { onSuccess: () => setRejecting(null) })
        }
      />
    </>
  );
}
