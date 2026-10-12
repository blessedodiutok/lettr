"use client";

import { formatRelativeDate } from "@lettr/utils";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../../components/ui/display";
import { useMarkNotifications, useNotifications } from "../../../hooks/useAccount";
import { cn } from "../../../lib/cn";

export default function NotificationsPage() {
  const { data, isPending, isError, refetch } = useNotifications();
  const mark = useMarkNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Updates about your conversations, payments and tenancies."
        actions={
          data && data.unreadCount > 0 ? (
            <Button variant="secondary" size="sm" isLoading={mark.isPending} onClick={() => mark.mutate(undefined)}>
              Mark all as read
            </Button>
          ) : null
        }
      />
      {isPending ? (
        <Skeleton className="h-64 w-full" />
      ) : isError ? (
        <ErrorState message="We couldn't load notifications." onRetry={() => refetch()} />
      ) : data.notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-5" />} title="You're all caught up" description="We'll let you know when something needs your attention." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {data.notifications.map((n) => {
            const content = (
              <div className="flex gap-3 px-4 py-3.5">
                <span className={cn("mt-2 size-2 shrink-0 rounded-full", n.isRead ? "bg-transparent" : "bg-brass")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm text-ink", !n.isRead && "font-semibold")}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">{formatRelativeDate(n.createdAt)}</p>
                </div>
              </div>
            );
            const onOpen = () => !n.isRead && mark.mutate(n.id);
            return (
              <li key={n.id} className={cn(!n.isRead && "bg-navy-soft/40")}>
                {n.data?.link ? (
                  <Link href={n.data.link} onClick={onOpen} className="block hover:bg-surface-2">
                    {content}
                  </Link>
                ) : (
                  <button type="button" onClick={onOpen} className="block w-full text-left hover:bg-surface-2">
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
