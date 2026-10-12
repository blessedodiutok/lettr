// File: apps/web/src/components/dashboard/TenantDashboard.tsx
"use client";

import { BookHeart, CreditCard, Home, PiggyBank, Search } from "lucide-react";
import Link from "next/link";
import { useSavedListings } from "../../hooks/useListings";
import { useMyPayments } from "../../hooks/usePayments";
import type { Tenancy } from "../../hooks/useTenancy";
import { useMyTenancy } from "../../hooks/useTenancy";
import { cn, formatDate, formatNaira } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import { EmptyState } from "../EmptyState";
import { PropertyCard } from "../PropertyCard";
import { PropertyCardSkeletonGrid, Skeleton } from "../ui/skeleton";
import { DashboardShell } from "./DashboardShell";
import { StatCard } from "./StatCard";

/* ── Payment status badge ──────────────────────────────────────────────────── */
function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    RELEASED:
      "bg-[var(--color-success-50)]  text-[var(--color-success-700)]  border-[var(--color-success-200)]",
    PENDING:
      "bg-[var(--color-warning-50)]  text-[var(--color-warning-700)]  border-[var(--color-warning-200)]",
    FAILED:
      "bg-[var(--color-danger-50)]   text-[var(--color-danger-700)]   border-[var(--color-danger-200)]",
    REFUNDED:
      "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]  border-[var(--color-neutral-200)]",
  };
  const labels: Record<string, string> = {
    RELEASED: "Released",
    IN_ESCROW: "In escrow",
    PROCESSING: "Processing",
    FAILED: "Failed",
    REFUNDED: "Refunded",
    PARTIALLY_REFUNDED: "Partially refunded",
    PENDING: "Pending",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full",
        "text-[11px] font-semibold border",
        styles[status] ?? styles.PENDING,
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

/* ── Active tenancy card ───────────────────────────────────────────────────── */
function ActiveTenancyCard({ tenancy }: { tenancy: Tenancy }) {
  return (
    <section>
      <p className="label-section mb-3">Your current home</p>
      <div
        className="
        relative overflow-hidden
        bg-[var(--color-primary-600)]
        rounded-2xl p-6
        text-white
      "
      >
        {/* Subtle background texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
          {/* House icon */}
          <div
            className="
            w-14 h-14 rounded-xl flex-shrink-0
            bg-white/15 backdrop-blur-sm
            flex items-center justify-center
          "
          >
            <Home size={24} className="text-white" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[var(--color-primary-200)] text-xs font-semibold uppercase tracking-[0.08em] mb-1">
              Active tenancy
            </p>
            <h3
              className="
              font-[family-name:var(--font-display)] font-bold
              text-xl text-white leading-snug truncate
            "
            >
              {tenancy.listing.property.title}
            </h3>
            <p className="text-[var(--color-primary-200)] text-sm mt-1">
              {tenancy.listing.property.neighbourhood},{" "}
              {tenancy.listing.property.state}
            </p>
          </div>

          <div className="sm:text-right flex-shrink-0">
            <p className="text-[var(--color-primary-200)] text-xs mb-1">
              Lease ends
            </p>
            <p className="font-semibold text-white text-sm">
                        {tenancy.tenancyEndDate ? formatDate(tenancy.tenancyEndDate) : "Pending"}
            </p>
            <Link
              href={`/listings/${tenancy.listing.id}`}
              className="
                mt-3 inline-flex items-center gap-1.5
                text-xs font-semibold
                bg-white/20 hover:bg-white/30
                text-white rounded-lg px-3 py-1.5
                transition-colors duration-150
              "
            >
              View listing →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Payment row shape (inferred from API) ─────────────────────────────────── */
interface PaymentRow {
  id: string;
  status: string;
  totalAmount: number;
  agentFeeSaved: number;
  createdAt: string;
  listing: { id: string; property: { title: string } };
}

/* ── Main component ────────────────────────────────────────────────────────── */
export function TenantDashboard() {
  const { user } = useAuthStore();
  const { data: savedData, isLoading: savedLoading } = useSavedListings();
  const { data: payments, isLoading: paymentsLoading } = useMyPayments();
  const { data: tenancy, isLoading: tenancyLoading } = useMyTenancy();

  const totalSaved =
    (payments as PaymentRow[] | undefined)?.reduce(
      (sum, p) => sum + (p.agentFeeSaved ?? 0),
      0,
    ) ?? 0;

  return (
    <DashboardShell
      greeting={`Welcome back, ${user?.firstName ?? "there"}`}
      subheading="Manage your saved properties, payments, and tenancies"
      ctaLabel="Browse listings"
      ctaHref="/listings"
    >
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Saved listings"
          value={savedData?.length ?? 0}
          icon={<BookHeart size={18} />}
          sub="Properties you've bookmarked"
          variant="default"
        />
        <StatCard
          label="Payments made"
          value={(payments as PaymentRow[] | undefined)?.length ?? 0}
          icon={<CreditCard size={18} />}
          sub="All-time rent payments"
          variant="accent"
        />
        <StatCard
          label="Total saved"
          value={formatNaira(totalSaved)}
          icon={<PiggyBank size={18} />}
          sub="Agent fees you avoided"
          variant="success"
        />
      </div>

      {/* ── Active tenancy ───────────────────────────────────────────────── */}
      {tenancyLoading && <Skeleton className="h-32 w-full rounded-2xl" />}
      {!tenancyLoading && tenancy && <ActiveTenancyCard tenancy={tenancy} />}

      {/* ── Recent payments ──────────────────────────────────────────────── */}
      {(paymentsLoading ||
        ((payments as PaymentRow[] | undefined) &&
          (payments as PaymentRow[]).length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="label-section mb-1">Payments</p>
              <h2 className="font-semibold text-[var(--color-neutral-800)]">
                Recent transactions
              </h2>
            </div>
          </div>

          {paymentsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div
              className="
              bg-white rounded-2xl
              border border-[var(--color-neutral-200)]
              shadow-[var(--shadow-card)]
              overflow-hidden
            "
            >
              {/* Table header */}
              <div
                className="
                hidden sm:grid grid-cols-[1fr_auto_auto_auto]
                gap-4 px-5 py-3
                bg-[var(--color-neutral-50)]
                border-b border-[var(--color-neutral-200)]
              "
              >
                {["Property", "Date", "Amount", "Saved"].map((h) => (
                  <p key={h} className="label-section">
                    {h}
                  </p>
                ))}
              </div>

              {/* Rows */}
              <div className="divide-y divide-[var(--color-neutral-100)]">
                {(payments as PaymentRow[]).slice(0, 5).map((payment) => (
                  <div
                    key={payment.id}
                    className="
                      grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto]
                      gap-2 sm:gap-4 items-center
                      px-5 py-4
                      hover:bg-[var(--color-neutral-50)]
                      transition-colors duration-150
                    "
                  >
                    {/* Property */}
                    <div className="min-w-0">
                      <Link
                        href={`/listings/${payment.listing.id}`}
                        className="font-semibold text-sm text-[var(--color-neutral-800)] hover:text-[var(--color-primary-600)] transition-colors truncate block"
                      >
                        {payment.listing.property.title}
                      </Link>
                      <PaymentStatusBadge status={payment.status} />
                    </div>

                    {/* Date */}
                    <p className="text-sm text-[var(--color-neutral-500)] whitespace-nowrap">
                      {formatDate(payment.createdAt)}
                    </p>

                    {/* Amount */}
                    <p
                      className="
                        font-[family-name:var(--font-display)]
                        font-bold text-sm
                        text-[var(--color-neutral-800)]
                        whitespace-nowrap
                      "
                    >
                      {formatNaira(payment.totalAmount)}
                    </p>

                    {/* Saved */}
                    <p
                      className="
                        text-xs font-semibold
                        text-[var(--color-success-600)]
                        whitespace-nowrap
                      "
                    >
                      +{formatNaira(payment.agentFeeSaved)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Saved listings ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="label-section mb-1">Bookmarks</p>
            <h2 className="font-semibold text-[var(--color-neutral-800)]">
              Saved listings
            </h2>
          </div>
          <Link
            href="/listings"
            className="
              group flex items-center gap-1.5
              text-sm font-semibold text-[var(--color-primary-600)]
              hover:text-[var(--color-primary-700)] transition-colors
            "
          >
            Browse more
            <span className="transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>

        {savedLoading ? (
          <PropertyCardSkeletonGrid count={3} />
        ) : !savedData?.length ? (
          <EmptyState
            icon="saved"
            title="No saved listings yet"
            description="Tap the heart icon on any listing to save it here."
            ctaLabel="Browse listings"
            ctaHref="/listings"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedData.map(({ listing }) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* ── Discover prompt — when no tenancy and few saved ─────────────── */}
      {!tenancyLoading && !tenancy && !savedLoading && !savedData?.length && (
        <div
          className="
          rounded-2xl border-2 border-dashed border-[var(--color-neutral-200)]
          p-10 text-center
        "
        >
          <div
            className="
            w-14 h-14 rounded-full
            bg-[var(--color-primary-50)]
            flex items-center justify-center
            mx-auto mb-4
          "
          >
            <Search
              size={22}
              className="text-[var(--color-primary-600)]"
              aria-hidden="true"
            />
          </div>
          <h3 className="font-semibold text-[var(--color-neutral-800)] mb-2">
            Start your search
          </h3>
          <p className="text-sm text-[var(--color-neutral-500)] max-w-xs mx-auto mb-5">
            Browse thousands of verified listings across Nigeria — no agents, no
            hidden fees.
          </p>
          <Link href="/listings">
            <button
              className="
              inline-flex items-center justify-center
              h-10 px-5 rounded-lg
              bg-[var(--color-primary-600)] text-white
              text-sm font-semibold
              hover:bg-[var(--color-primary-700)]
              transition-colors duration-150
            "
            >
              Browse listings
            </button>
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
