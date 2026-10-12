"use client";

import { formatCurrency, formatDateTime } from "@lettr/utils";
import { ArrowLeft, Send } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { JourneyStepper } from "../../../../components/journey/JourneyStepper";
import { ThreadActions } from "../../../../components/messages/ThreadActions";
import { TenantProfileDialog } from "../../../../components/messages/TenantProfileDialog";
import { Avatar, ErrorState, Skeleton, StatusPill } from "../../../../components/ui/display";
import { useInquiry, useSendMessage } from "../../../../hooks/useInquiries";
import { errorMessage } from "../../../../lib/api";
import { cn } from "../../../../lib/cn";
import { useAuthStore } from "../../../../stores/authStore";

export default function ThreadPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const { data: thread, isPending, isError, error } = useInquiry(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const count = thread?.messages.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [count]);

  if (isPending) return <Skeleton className="h-[70svh] w-full" />;
  if (isError || !thread) return <ErrorState message={errorMessage(error, "We couldn't open this conversation.")} />;

  const isTenant = thread.viewerRole === "TENANT";
  const other = isTenant ? thread.landlord : thread.tenant;
  const canMessage = thread.availableActions.includes("message");
  const cover = thread.listing.property.photos[0]?.url;

  const submit = () => {
    const message = draft.trim();
    if (!message) return;
    send.mutate(message, { onSuccess: () => setDraft("") });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col">
        <div className="mb-4 flex items-center gap-3">
          <Link href="/messages" className="grid size-9 place-items-center rounded-control text-muted hover:bg-surface-2" aria-label="Back to all conversations">
            <ArrowLeft className="size-5" />
          </Link>
          <Avatar person={other} size={40} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-ink">
              {other.firstName} {other.lastName}
            </h1>
            <p className="truncate text-[13px] text-muted">{thread.listing.property.title}</p>
          </div>
          <StatusPill kind="inquiry" status={thread.status} />
        </div>

        <div className="mb-4 rounded-card border border-line bg-surface p-4">
          <JourneyStepper
            input={{ inquiry: thread, payment: thread.payment, tenancy: thread.tenancy }}
          />
        </div>

        <div className="mb-4">
          <ThreadActions thread={thread} />
        </div>

        <section aria-label="Messages" className="flex min-h-[320px] flex-1 flex-col rounded-card border border-line bg-surface">
          <ol className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" style={{ maxHeight: "60svh" }}>
            {thread.messages.map((message) => {
              const mine = message.senderId === user?.id;
              return (
                <li key={message.id} className={cn("flex max-w-[85%] flex-col", mine ? "self-end items-end" : "self-start items-start")}>
                  <div className={cn("whitespace-pre-line rounded-[14px] px-3.5 py-2.5 text-[15px] leading-relaxed", mine ? "rounded-br-[4px] bg-navy text-on-navy" : "rounded-bl-[4px] bg-surface-2 text-ink")}>
                    {message.body}
                  </div>
                  <span className="mt-1 text-[11px] text-muted">
                    {formatDateTime(message.createdAt)}
                    {mine && message.readAt ? " · Read" : ""}
                  </span>
                </li>
              );
            })}
            <div ref={endRef} />
          </ol>
          {canMessage ? (
            <form
              className="flex items-end gap-2 border-t border-line p-3"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              <label htmlFor="message" className="sr-only">
                Message
              </label>
              <textarea
                id="message"
                rows={1}
                value={draft}
                maxLength={1000}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={`Message ${other.firstName}…`}
                className="max-h-40 min-h-11 flex-1 resize-none rounded-control border border-line-strong bg-bg px-3 py-2.5 text-[15px] text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/25"
              />
              <button
                type="submit"
                disabled={!draft.trim() || send.isPending}
                className="grid size-11 shrink-0 place-items-center rounded-control bg-navy text-on-navy disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-5" />
              </button>
            </form>
          ) : (
            <p className="border-t border-line p-4 text-center text-sm text-muted">{thread.closedReason ?? "This conversation is closed."}</p>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-4">
        <Link href={`/listings/${thread.listingId}`} className="overflow-hidden rounded-card border border-line bg-surface hover:shadow-2">
          <div className="relative aspect-[16/10] bg-surface-2">{cover && <Image src={cover} alt="" fill sizes="320px" className="object-cover" />}</div>
          <div className="p-4">
            <p className="font-semibold text-ink">{thread.listing.property.title}</p>
            <p className="text-[13px] text-muted">
              {thread.listing.property.neighbourhood}, {thread.listing.property.state}
            </p>
            <p className="tnum mt-2 font-bold text-ink">{formatCurrency(thread.listing.annualRent)} / year</p>
          </div>
        </Link>
        {!isTenant && (
          <div className="rounded-card border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-ink">About {thread.tenant.firstName}</p>
            <p className="mt-1 text-[13px] text-muted">Occupation, household and references they&apos;ve shared.</p>
            <button type="button" onClick={() => setProfileOpen(true)} className="mt-3 text-sm font-semibold text-navy hover:underline">
              View tenant profile
            </button>
            <TenantProfileDialog tenantId={thread.tenantId} open={profileOpen} onOpenChange={setProfileOpen} />
          </div>
        )}
      </aside>
    </div>
  );
}
