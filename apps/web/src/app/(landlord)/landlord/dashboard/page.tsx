"use client";

import { formatCurrency, formatCurrencyShort } from "@lettr/utils";
import { Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, EmptyState, PageHeader, Skeleton, StatusPill } from "../../../../components/ui/display";
import { useInquiries } from "../../../../hooks/useInquiries";
import { useMyListings } from "../../../../hooks/useListings";
import { useMyPayments, useMyTenancies } from "../../../../hooks/usePayments";
import { useRefreshMe } from "../../../../hooks/useRefreshMe";
import { useAuthStore } from "../../../../stores/authStore";

interface Task {
  key: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
  urgent?: boolean;
}

export default function LandlordOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const refreshMe = useRefreshMe();
  const listings = useMyListings();
  const inquiries = useInquiries("active");
  const tenancies = useMyTenancies();
  const payments = useMyPayments();

  useEffect(() => {
    refreshMe().catch(() => undefined);
  }, [refreshMe]);

  const profile = user?.landlordProfile;
  const tasks: Task[] = [];
  for (const t of tenancies.data ?? []) {
    if (t.cancelledAt || t.isHandoverConfirmed) continue;
    if (!t.landlordSignedAt) tasks.push({ key: `sign-${t.id}`, title: `Sign the agreement for ${t.listing.property.title}`, detail: `${t.tenant.firstName} ${t.tenant.lastName} has paid into escrow.`, href: `/tenancies/${t.id}`, cta: "Review and sign", urgent: true });
    else if (t.tenantSignedAt && !t.handoverMarkedAt) tasks.push({ key: `handover-${t.id}`, title: `Hand over the keys for ${t.listing.property.title}`, detail: "Both of you have signed. Mark the handover to start the release clock.", href: `/tenancies/${t.id}`, cta: "Mark handover", urgent: true });
  }
  const waiting = (inquiries.data ?? []).filter((i) => i.unreadCount > 0 || i.status === "OPEN");
  if (waiting.length) tasks.push({ key: "reply", title: `${waiting.length} conversation${waiting.length > 1 ? "s" : ""} waiting for you`, detail: "Tenants who hear back within a day are far more likely to rent.", href: "/messages", cta: "Reply" });
  const drafts = (listings.data ?? []).filter((l) => l.status === "DRAFT");
  for (const d of drafts.slice(0, 2)) tasks.push({ key: `draft-${d.id}`, title: `Finish your listing “${d.property.title}”`, detail: d.property.photos.length ? "Ready to publish." : "Add photos to publish it.", href: `/landlord/listings/${d.id}/edit#photos`, cta: "Continue" });
  if (profile && (profile.verificationStatus === "UNVERIFIED" || profile.verificationStatus === "REJECTED")) tasks.push({ key: "verify", title: "Verify your ID", detail: profile.verificationStatus === "REJECTED" ? profile.rejectionReason ?? "Your last document was rejected." : "Needed before you can publish, and it adds the verified badge.", href: "/landlord/verification", cta: "Verify now", urgent: true });
  if (profile && !profile.bankAccountVerifiedAt && (tenancies.data ?? []).length) tasks.push({ key: "bank", title: "Add your bank account", detail: "So escrow is paid out to you without delay.", href: "/landlord/payouts", cta: "Add account" });

  const active = (listings.data ?? []).filter((l) => l.status === "ACTIVE").length;
  const escrow = (payments.data ?? []).filter((p) => p.status === "IN_ESCROW").reduce((sum, p) => sum + p.landlordPayout, 0);
  const year = new Date().getFullYear();
  const paidOut = (payments.data ?? []).filter((p) => p.status === "RELEASED" && p.escrowReleasedAt?.startsWith(String(year))).reduce((sum, p) => sum + p.landlordPayout, 0);
  const loading = listings.isPending || tenancies.isPending;
  // Show placeholders, not zeros, until every figure has loaded.
  const figuresLoading = loading || inquiries.isPending || payments.isPending;

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.firstName ?? ""}`}
        description="What needs your attention across your homes."
        actions={
          <Button asChild>
            <Link href="/landlord/listings/new">
              <Plus className="size-4" aria-hidden /> New listing
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="attention" className="mb-6">
        <h2 id="attention" className="eyebrow mb-2">
          Needs your attention
        </h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : tasks.length === 0 ? (
          <p className="rounded-card border border-line bg-surface px-4 py-4 text-sm text-muted">You&apos;re all caught up.</p>
        ) : (
          <ul className="grid gap-2">
            {tasks.map((task) => (
              <li key={task.key} className={`flex flex-col gap-3 rounded-card border border-line border-l-[3px] bg-surface px-4 py-3.5 sm:flex-row sm:items-center ${task.urgent ? "border-l-brass" : "border-l-navy"}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{task.title}</p>
                  <p className="text-sm text-muted">{task.detail}</p>
                </div>
                <Button asChild size="sm" variant={task.urgent ? "accent" : "secondary"}>
                  <Link href={task.href}>{task.cta}</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Active listings", value: String(active) },
          { label: "Open conversations", value: String(inquiries.data?.length ?? 0) },
          { label: "Held in escrow for you", value: formatCurrencyShort(escrow) },
          { label: `Paid out in ${year}`, value: formatCurrencyShort(paidOut) },
        ].map((kpi) => (
          <Card key={kpi.label} as="div" className="p-4">
            <dt className="text-[13px] text-muted">{kpi.label}</dt>
            <dd className="tnum mt-1 text-2xl font-bold tracking-tight text-ink">{figuresLoading ? <Skeleton className="h-8 w-16" /> : kpi.value}</dd>
          </Card>
        ))}
      </dl>

      <Card className="p-0">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold text-ink">Your listings</h2>
          <Link href="/landlord/listings" className="text-sm font-semibold text-navy hover:underline">
            Manage all
          </Link>
        </div>
        {listings.isPending ? (
          <Skeleton className="m-5 h-24" />
        ) : !listings.data?.length ? (
          <div className="p-5 pt-0">
            <EmptyState
              icon={<Building2 className="size-5" />}
              title="List your first home"
              description="It's free, and takes about ten minutes."
              action={
                <Button asChild>
                  <Link href="/landlord/listings/new">Create a listing</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-y border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5 font-semibold">Home</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Views</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Conversations</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Rent / yr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {listings.data.slice(0, 6).map((l) => (
                  <tr key={l.id}>
                    <td className="px-5 py-3">
                      <Link href={`/landlord/listings/${l.id}/edit`} className="font-semibold text-ink hover:text-navy">
                        {l.property.title}
                      </Link>
                      <p className="text-xs text-muted">{l.property.neighbourhood}</p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill kind="listing" status={l.status} />
                    </td>
                    <td className="tnum px-5 py-3 text-right text-ink-2">{l.viewCount}</td>
                    <td className="tnum px-5 py-3 text-right text-ink-2">{l.openInquiries ?? 0}</td>
                    <td className="tnum px-5 py-3 text-right font-semibold text-ink">{formatCurrency(l.annualRent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
