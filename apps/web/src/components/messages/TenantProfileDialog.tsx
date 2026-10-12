"use client";

import { formatCurrency, formatDate } from "@lettr/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Person, Review, TenantProfile } from "../../lib/types";
import { Dialog } from "../ui/dialog";
import { Avatar, Skeleton, Stars } from "../ui/display";

interface Screening extends Person {
  createdAt: string;
  tenantProfile: TenantProfile | null;
  reviewsReceived: Review[];
}

/** What a landlord can see about a tenant who has contacted them. */
export function TenantProfileDialog({ tenantId, open, onOpenChange }: { tenantId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, isPending } = useQuery({
    queryKey: ["screening", tenantId],
    queryFn: () => api<Screening>("get", `/api/users/${tenantId}/screening`),
    enabled: open,
  });
  const profile = data?.tenantProfile;
  const rows: Array<[string, string | null | undefined]> = profile
    ? [
        ["Occupation", profile.occupation],
        ["Employer", profile.employerName],
        ["Monthly income", profile.monthlyIncome ? formatCurrency(profile.monthlyIncome) : null],
        ["People moving in", profile.numberOfOccupants ? String(profile.numberOfOccupants) : null],
        ["Pets", profile.hasPets ? profile.petDescription || "Yes" : "No"],
        ["Smoking household", profile.smokingHousehold ? "Yes" : "No"],
        ["Current address", profile.previousAddress],
        ["Reason for moving", profile.reasonForMoving],
      ]
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Tenant profile" description="Shared with landlords the tenant has contacted.">
      {isPending || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid gap-5">
          <div className="flex items-center gap-3">
            <Avatar person={data} size={48} />
            <div>
              <p className="font-semibold text-ink">
                {data.firstName} {data.lastName}
              </p>
              <p className="text-sm text-muted">On Lettr since {formatDate(data.createdAt)}</p>
            </div>
          </div>
          {rows.some(([, v]) => v) ? (
            <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
              {rows
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-medium text-ink">{value}</dd>
                  </div>
                ))}
            </dl>
          ) : (
            <p className="text-sm text-muted">This tenant hasn&apos;t filled in their profile yet. You can ask them in the conversation.</p>
          )}
          {data.reviewsReceived.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Reviews from previous landlords</p>
              <ul className="grid gap-2">
                {data.reviewsReceived.map((r) => (
                  <li key={r.id} className="rounded-control bg-surface-2 p-3 text-sm">
                    <Stars rating={r.rating} /> <span className="font-semibold text-ink">{r.title}</span>
                    <p className="mt-1 text-ink-2">{r.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
