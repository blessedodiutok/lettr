"use client";

// The "what happens next" panel inside a conversation. Buttons come straight
// from the API's availableActions, so the UI can't offer a step the rules forbid.

import { formatAppointment, formatCurrency, RENTAL_RULES } from "@lettr/utils";
import { CalendarClock, CheckCircle2, FileSignature, HandCoins } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useInquiryAction } from "../../hooks/useInquiries";
import type { InquiryThread } from "../../lib/types";
import { Button } from "../ui/button";
import { ConfirmDialog, Dialog } from "../ui/dialog";
import { Field, Input, Textarea } from "../ui/field";

function minDateTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function InspectionDialog({ thread, open, onOpenChange }: { thread: InquiryThread; open: boolean; onOpenChange: (v: boolean) => void }) {
  const action = useInquiryAction(thread.id);
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={thread.inspectionBooking ? "Suggest another time" : "Propose an inspection"}
      description="The other person confirms the time, or suggests a different one."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!when}
            isLoading={action.isPending}
            onClick={() =>
              action.mutate({ type: "scheduleInspection", scheduledAt: new Date(when).toISOString(), notes: notes || undefined }, { onSuccess: () => onOpenChange(false) })
            }
          >
            Send proposal
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Date and time">
          <Input type="datetime-local" min={minDateTime()} value={when} onChange={(e) => setWhen(e.target.value)} />
        </Field>
        <Field label="Notes" optional hint="Where to meet, who to ask for, what to bring.">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
        </Field>
      </div>
    </Dialog>
  );
}

function OfferDialog({ thread, open, onOpenChange }: { thread: InquiryThread; open: boolean; onOpenChange: (v: boolean) => void }) {
  const action = useInquiryAction(thread.id);
  const [note, setNote] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Offer the home to ${thread.tenant.firstName}`}
      description={`${thread.tenant.firstName} has ${RENTAL_RULES.offerValidDays} days to accept. When they do, the home is taken off the market while they pay into escrow.`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="accent" isLoading={action.isPending} onClick={() => action.mutate({ type: "makeOffer", note: note || undefined }, { onSuccess: () => onOpenChange(false) })}>
            Send offer
          </Button>
        </>
      }
    >
      <p className="mb-4 rounded-control bg-surface-2 px-3 py-2.5 text-sm text-ink-2">
        Offer at the listed terms: <b className="tnum text-ink">{formatCurrency(thread.listing.annualRent)}</b> a year.
      </p>
      <Field label="Message with the offer" optional>
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Happy to offer you the flat. Keys available from 1 November." maxLength={500} />
      </Field>
    </Dialog>
  );
}

function Panel({ icon: Icon, title, children, tone = "neutral" }: { icon: typeof CalendarClock; title: string; children: React.ReactNode; tone?: "neutral" | "accent" }) {
  return (
    <div className={tone === "accent" ? "rounded-card border border-brass/40 bg-brass-soft p-4" : "rounded-card border border-line bg-surface p-4"}>
      <div className="flex gap-3">
        <Icon className={tone === "accent" ? "mt-0.5 size-5 shrink-0 text-brass" : "mt-0.5 size-5 shrink-0 text-navy"} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{title}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ThreadActions({ thread }: { thread: InquiryThread }) {
  const action = useInquiryAction(thread.id);
  const [inspection, setInspection] = useState(false);
  const [offer, setOffer] = useState(false);
  const [confirm, setConfirm] = useState<null | "acceptOffer" | "declineOffer" | "withdrawOffer" | "close">(null);
  const can = (a: InquiryThread["availableActions"][number]) => thread.availableActions.includes(a);
  const isTenant = thread.viewerRole === "TENANT";
  const other = isTenant ? thread.landlord : thread.tenant;
  const booking = thread.inspectionBooking;
  const paid = thread.payment && ["IN_ESCROW", "RELEASED", "PROCESSING"].includes(thread.payment.status);
  const panels: React.ReactNode[] = [];

  if (thread.tenancy) {
    panels.push(
      <Panel key="tenancy" icon={FileSignature} title={thread.tenancy.isHandoverConfirmed ? "Tenancy started" : "Rent is in escrow"}>
        <p className="mt-1 text-sm text-ink-2">
          {thread.tenancy.isHandoverConfirmed ? "The keys are handed over and the landlord has been paid." : "Next: both of you sign the agreement, then the keys are handed over."}
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link href={`/tenancies/${thread.tenancy.id}`}>Open the tenancy</Link>
        </Button>
      </Panel>,
    );
  } else if (thread.status === "ACCEPTED" && !paid) {
    panels.push(
      <Panel key="pay" icon={HandCoins} title={isTenant ? "Pay into escrow to secure the home" : `${thread.tenant.firstName} accepted your offer`} tone="accent">
        <p className="mt-1 text-sm text-ink-2">
          {isTenant ? "The home is held for you" : "The home is held while they pay"}
          {thread.paymentDueAt ? ` until ${formatAppointment(thread.paymentDueAt)}.` : "."}
        </p>
        {isTenant && (
          <Button asChild variant="accent" size="sm" className="mt-3">
            <Link href={`/pay/${thread.listingId}`}>Pay into escrow</Link>
          </Button>
        )}
      </Panel>,
    );
  } else if (thread.status === "OFFER_MADE") {
    panels.push(
      <Panel key="offer" icon={HandCoins} title={isTenant ? `${thread.landlord.firstName} offered you this home` : "Offer sent"} tone="accent">
        <p className="mt-1 text-sm text-ink-2">
          {thread.offerNote && <span className="mb-1 block italic">“{thread.offerNote}”</span>}
          {thread.offerExpiresAt && `Open until ${formatAppointment(thread.offerExpiresAt)}. `}
          {isTenant ? "Accepting holds the home for you while you pay into escrow." : `Waiting for ${thread.tenant.firstName} to respond.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {can("acceptOffer") && (
            <Button variant="accent" size="sm" onClick={() => setConfirm("acceptOffer")}>
              Accept offer
            </Button>
          )}
          {can("declineOffer") && (
            <Button variant="secondary" size="sm" onClick={() => setConfirm("declineOffer")}>
              Decline
            </Button>
          )}
          {can("withdrawOffer") && (
            <Button variant="secondary" size="sm" onClick={() => setConfirm("withdrawOffer")}>
              Withdraw offer
            </Button>
          )}
        </div>
      </Panel>,
    );
  }

  if (booking && thread.status === "INSPECTION_SCHEDULED") {
    const mine = booking.proposedById !== other.id;
    panels.push(
      <Panel key="inspection" icon={CalendarClock} title={booking.isConfirmed ? `Inspection confirmed for ${formatAppointment(booking.scheduledAt)}` : `Inspection proposed for ${formatAppointment(booking.scheduledAt)}`}>
        {booking.notes && <p className="mt-1 text-sm text-ink-2">{booking.notes}</p>}
        {!booking.isConfirmed && <p className="mt-1 text-sm text-muted">{mine ? `Waiting for ${other.firstName} to confirm.` : `${other.firstName} suggested this time.`}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {can("confirmInspection") && (
            <Button size="sm" isLoading={action.isPending} onClick={() => action.mutate({ type: "confirmInspection" })}>
              Confirm this time
            </Button>
          )}
          {can("completeInspection") && (
            <Button size="sm" variant={booking.isConfirmed ? "primary" : "secondary"} isLoading={action.isPending} onClick={() => action.mutate({ type: "completeInspection" })}>
              <CheckCircle2 className="size-4" aria-hidden /> Inspection done
            </Button>
          )}
          {can("scheduleInspection") && (
            <Button size="sm" variant="secondary" onClick={() => setInspection(true)}>
              Suggest another time
            </Button>
          )}
        </div>
      </Panel>,
    );
  }

  const quick: React.ReactNode[] = [];
  if (can("scheduleInspection") && thread.status !== "INSPECTION_SCHEDULED") {
    quick.push(
      <Button key="insp" size="sm" variant="secondary" onClick={() => setInspection(true)}>
        <CalendarClock className="size-4" aria-hidden /> {booking?.isCompleted ? "Book another inspection" : "Propose an inspection"}
      </Button>,
    );
  }
  if (can("makeOffer")) {
    quick.push(
      <Button key="offer" size="sm" variant="accent" onClick={() => setOffer(true)}>
        <HandCoins className="size-4" aria-hidden /> Offer the home
      </Button>,
    );
  }
  if (can("close")) {
    quick.push(
      <Button key="close" size="sm" variant="ghost" onClick={() => setConfirm("close")}>
        Close conversation
      </Button>,
    );
  }

  const confirmCopy = {
    acceptOffer: {
      title: "Accept this offer?",
      body: `The home will be held for you for ${RENTAL_RULES.paymentWindowHours} hours while you pay ${formatCurrency(thread.listing.annualRent)} rent plus fees into escrow. The landlord isn't paid until you have the keys.`,
      label: "Accept offer",
    },
    declineOffer: { title: "Decline this offer?", body: "The conversation will close and the landlord can offer the home to someone else.", label: "Decline offer" },
    withdrawOffer: { title: "Withdraw your offer?", body: `${thread.tenant.firstName} will no longer be able to accept it. You can make a new offer later.`, label: "Withdraw" },
    close: { title: "Close this conversation?", body: "Neither of you will be able to send messages. The tenant can start a new conversation later if the home is still listed.", label: "Close conversation" },
  } as const;

  return (
    <div className="grid gap-3">
      {panels}
      {quick.length > 0 && <div className="flex flex-wrap gap-2">{quick}</div>}
      <InspectionDialog thread={thread} open={inspection} onOpenChange={setInspection} />
      <OfferDialog thread={thread} open={offer} onOpenChange={setOffer} />
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(v) => !v && setConfirm(null)}
          title={confirmCopy[confirm].title}
          description={confirmCopy[confirm].body}
          confirmLabel={confirmCopy[confirm].label}
          tone={confirm === "acceptOffer" ? "primary" : "danger"}
          isLoading={action.isPending}
          onConfirm={() => action.mutate({ type: confirm }, { onSettled: () => setConfirm(null) })}
        />
      )}
    </div>
  );
}
