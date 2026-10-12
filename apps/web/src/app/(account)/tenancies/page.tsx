"use client";

import { formatCurrency, formatDate, formatTenancyPeriod } from "@lettr/utils";
import { FileSignature } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { EmptyState, ErrorState, PageHeader, Pill, Skeleton } from "../../../components/ui/display";
import { useMyTenancies } from "../../../hooks/usePayments";
import { tenancyStage } from "../../../components/tenancy/stage";
import { useAuthStore } from "../../../stores/authStore";

export default function TenanciesPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isPending, isError, refetch } = useMyTenancies();
  const isLandlord = user?.role === "LANDLORD";

  return (
    <>
      <PageHeader title={isLandlord ? "Tenancies" : "My rental"} description={isLandlord ? "Agreements, handovers and current tenants." : "Your tenancy agreement, move-in and payment."} />
      {isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : isError ? (
        <ErrorState message="We couldn't load your tenancies." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="size-5" />}
          title="No tenancies yet"
          description={isLandlord ? "A tenancy appears here as soon as a tenant pays into escrow for one of your homes." : "Once you pay into escrow for a home, your agreement and move-in steps appear here."}
          action={
            !isLandlord && (
              <Button asChild>
                <Link href="/listings">Find a home</Link>
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid gap-3">
          {data.map((t) => {
            const stage = tenancyStage(t);
            const other = isLandlord ? t.tenant : t.landlord;
            const cover = t.listing.property.photos[0]?.url;
            return (
              <li key={t.id}>
                <Link href={`/tenancies/${t.id}`} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 hover:shadow-2 sm:flex-row sm:items-center">
                  <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-control bg-surface-2 sm:h-20 sm:w-28">
                    {cover && <Image src={cover} alt="" fill sizes="112px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{t.listing.property.title}</p>
                    <p className="text-[13px] text-muted">
                      {isLandlord ? "Tenant" : "Landlord"}: {other.firstName} {other.lastName}
                      {t.tenancyStartDate && t.tenancyEndDate ? ` · ${formatTenancyPeriod(t.tenancyStartDate, t.tenancyEndDate)}` : ""}
                    </p>
                    <p className="tnum mt-1 text-[13px] text-ink-2">
                      {formatCurrency(t.listing.annualRent)} a year · started {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <Pill tone={stage.tone}>{stage.label}</Pill>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
