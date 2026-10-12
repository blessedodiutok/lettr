"use client";

import { formatRelativeDate } from "@lettr/utils";
import { MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatusPill } from "../../../components/ui/display";
import { useInquiries } from "../../../hooks/useInquiries";
import { cn } from "../../../lib/cn";
import { useAuthStore } from "../../../stores/authStore";

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"active" | "closed">("active");
  const { data, isPending, isError, refetch } = useInquiries(tab);
  const isLandlord = user?.role === "LANDLORD";

  return (
    <>
      <PageHeader
        title={isLandlord ? "Inquiries" : "Messages"}
        description={isLandlord ? "Tenants interested in your homes. Reply, book inspections and make offers here." : "Your conversations with landlords."}
      />
      <div role="tablist" aria-label="Conversations" className="mb-4 inline-flex rounded-control border border-line bg-surface p-0.5">
        {(["active", "closed"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn("rounded-[6px] px-4 py-1.5 text-sm font-semibold", tab === value ? "bg-navy-soft text-navy" : "text-muted hover:text-ink")}
          >
            {value === "active" ? "Active" : "Closed"}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message="We couldn't load your conversations." onRetry={() => refetch()} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="size-5" />}
          title={tab === "active" ? "No conversations yet" : "No closed conversations"}
          description={isLandlord ? "When tenants message you about a listing, it appears here." : "Find a home you like and message the landlord to get started."}
          action={
            tab === "active" &&
            (isLandlord ? (
              <Button asChild variant="secondary">
                <Link href="/landlord/listings">Manage listings</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/listings">Browse homes</Link>
              </Button>
            ))
          }
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {data.map((item) => {
            const other = isLandlord ? item.tenant : item.landlord;
            const cover = item.listing.property.photos[0]?.url;
            const fromMe = item.lastMessage?.senderId === user?.id;
            return (
              <li key={item.id}>
                <Link href={`/messages/${item.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-control bg-surface-2">
                    {cover && <Image src={cover} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate text-sm text-ink", item.unreadCount ? "font-bold" : "font-semibold")}>
                        {other.firstName} {other.lastName}
                      </p>
                      <StatusPill kind="inquiry" status={item.status} className="hidden sm:inline-flex" />
                    </div>
                    <p className="truncate text-[13px] text-muted">{item.listing.property.title}</p>
                    {item.lastMessage && (
                      <p className={cn("mt-0.5 truncate text-[13px]", item.unreadCount ? "font-semibold text-ink" : "text-ink-2")}>
                        {fromMe ? "You: " : ""}
                        {item.lastMessage.body}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-muted">{formatRelativeDate(item.updatedAt).replace("about ", "")}</span>
                    {item.unreadCount > 0 && (
                      <span className="grid min-w-5 place-items-center rounded-full bg-brass px-1.5 text-[11px] font-bold leading-5 text-on-brass" aria-label={`${item.unreadCount} unread`}>
                        {item.unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
