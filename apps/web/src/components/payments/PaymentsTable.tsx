"use client";

import { formatCurrency, formatDate } from "@lettr/utils";
import Link from "next/link";
import type { Payment } from "../../lib/types";
import { StatusPill } from "../ui/display";

/** Payment history for tenants (amount paid) and landlords (payout). */
export function PaymentsTable({ payments, view }: { payments: Payment[]; view: "tenant" | "landlord" }) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Home</th>
            <th className="px-4 py-3 font-semibold">{view === "tenant" ? "Paid" : "Tenant"}</th>
            <th className="px-4 py-3 text-right font-semibold">{view === "tenant" ? "Amount" : "Your payout"}</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="px-4 py-3">
                <Link href={p.tenancyAgreement ? `/tenancies/${p.tenancyAgreement.id}` : `/listings/${p.listing.id}`} className="font-semibold text-ink hover:text-navy">
                  {p.listing.property.title}
                </Link>
                <p className="text-xs text-muted">{p.listing.property.neighbourhood}</p>
              </td>
              <td className="px-4 py-3 text-ink-2">{view === "tenant" ? formatDate(p.createdAt) : `${p.tenant.firstName} ${p.tenant.lastName}`}</td>
              <td className="tnum px-4 py-3 text-right font-semibold text-ink">
                {formatCurrency(view === "tenant" ? p.totalAmount : p.landlordPayout)}
                {p.refundAmount ? <span className="block text-xs font-normal text-muted">Refunded {formatCurrency(p.refundAmount)}</span> : null}
              </td>
              <td className="px-4 py-3">
                <StatusPill kind="payment" status={p.status} />
                {view === "landlord" && p.status === "IN_ESCROW" && p.tenancyAgreement?.autoReleaseAt && (
                  <span className="mt-1 block text-xs text-muted">Releases by {formatDate(p.tenancyAgreement.autoReleaseAt)}</span>
                )}
              </td>
              <td className="tnum px-4 py-3 text-ink-2">{p.receipt?.receiptNumber ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
