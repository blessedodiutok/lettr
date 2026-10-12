"use client";

import { formatAppointment, formatCurrency, formatDate, formatDateTime, formatTenancyPeriod } from "@lettr/utils";
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound, PenLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ReviewForm } from "../../../../components/tenancy/ReviewForm";
import { Button } from "../../../../components/ui/button";
import { ConfirmDialog, Dialog } from "../../../../components/ui/dialog";
import { Card, ErrorState, Pill, Skeleton, StatusPill } from "../../../../components/ui/display";
import { Field, Textarea } from "../../../../components/ui/field";
import { useRaiseDispute, useTenancy, useTenancyAction } from "../../../../hooks/usePayments";
import { errorMessage } from "../../../../lib/api";
import type { TenancyDetail } from "../../../../lib/types";
import { tenancyStage } from "../../../../components/tenancy/stage";

function NextStep({ tenancy }: { tenancy: TenancyDetail }) {
  const act = useTenancyAction(tenancy.id);
  const [confirm, setConfirm] = useState<null | "sign" | "handover" | "confirm-move-in">(null);
  const can = (a: TenancyDetail["availableActions"][number]) => tenancy.availableActions.includes(a);
  const isTenant = tenancy.viewerRole === "TENANT";
  const other = isTenant ? tenancy.landlord : tenancy.tenant;
  const mySignature = isTenant ? tenancy.tenantSignedAt : tenancy.landlordSignedAt;

  let icon = ShieldCheck;
  let title = "";
  let body = "";
  let button: React.ReactNode = null;

  if (tenancy.cancelledAt) {
    title = "This tenancy was cancelled";
    body = tenancy.cancellationReason ?? "";
  } else if (tenancy.isHandoverConfirmed) {
    icon = CheckCircle2;
    title = "Tenancy started";
    body = `The landlord was paid on ${tenancy.handoverConfirmedAt ? formatDate(tenancy.handoverConfirmedAt) : "handover"}.`;
  } else if (can("sign")) {
    icon = PenLine;
    title = "Read and sign the agreement";
    body = `Rent is safely in escrow. ${mySignature ? "" : `Once you sign, we'll ask ${other.firstName} to sign too.`}`;
    button = (
      <Button variant="accent" onClick={() => setConfirm("sign")}>
        Sign agreement
      </Button>
    );
  } else if (!tenancy.tenantSignedAt || !tenancy.landlordSignedAt) {
    title = `Waiting for ${other.firstName} to sign`;
    body = tenancy.landlordSignDeadline && isTenant ? `If they haven't signed by ${formatAppointment(tenancy.landlordSignDeadline)}, you can cancel for a full refund.` : "We've reminded them by email.";
  } else if (can("markHandover")) {
    icon = KeyRound;
    title = "Hand over the keys";
    body = `Once ${tenancy.tenant.firstName} has the keys, mark the handover. Escrow releases when they confirm, or automatically 7 days later.`;
    button = (
      <Button variant="accent" onClick={() => setConfirm("handover")}>
        Mark keys handed over
      </Button>
    );
  } else if (can("confirmMoveIn")) {
    icon = KeyRound;
    title = tenancy.handoverMarkedAt ? `${tenancy.landlord.firstName} says the keys were handed over` : "Do you have the keys?";
    body = `Confirm only when you have the keys and the home matches the listing. This releases the rent to the landlord.${tenancy.autoReleaseAt ? ` Otherwise it releases automatically on ${formatAppointment(tenancy.autoReleaseAt)}.` : ""}`;
    button = (
      <Button variant="accent" onClick={() => setConfirm("confirm-move-in")}>
        I have the keys
      </Button>
    );
  } else {
    title = isTenant ? "Waiting for the handover" : "Waiting for the tenant to confirm";
    body = tenancy.autoReleaseAt ? `Escrow releases automatically on ${formatAppointment(tenancy.autoReleaseAt)} unless a dispute is raised.` : "";
  }

  const Icon = icon;
  const copy = {
    sign: { title: "Sign the tenancy agreement?", body: "Your signature is recorded with today's date and time. Make sure you've read the full agreement below.", label: "Sign agreement" },
    handover: { title: "Confirm the keys were handed over?", body: `${tenancy.tenant.firstName} will be asked to confirm. If they don't respond or dispute within 7 days, the rent is released to you.`, label: "Yes, keys handed over" },
    "confirm-move-in": { title: "Release the rent to the landlord?", body: "This tells Lettr you have the keys and the home is as described. The landlord is paid straight away, and this can't be undone.", label: "Yes, release payment" },
  } as const;

  return (
    <div className="rounded-card border border-brass/40 bg-brass-soft p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Icon className="size-6 shrink-0 text-brass" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{title}</p>
          {body && <p className="mt-0.5 text-sm text-ink-2">{body}</p>}
        </div>
        {button}
      </div>
      {confirm && (
        <ConfirmDialog
          open
          onOpenChange={(v) => !v && setConfirm(null)}
          title={copy[confirm].title}
          description={copy[confirm].body}
          confirmLabel={copy[confirm].label}
          isLoading={act.isPending}
          onConfirm={() => act.mutate({ action: confirm }, { onSettled: () => setConfirm(null) })}
        />
      )}
    </div>
  );
}

function ProblemActions({ tenancy }: { tenancy: TenancyDetail }) {
  const dispute = useRaiseDispute();
  const act = useTenancyAction(tenancy.id);
  const [mode, setMode] = useState<null | "dispute" | "cancel">(null);
  const [reason, setReason] = useState("");
  if (!tenancy.availableActions.includes("dispute") && !tenancy.availableActions.includes("cancel")) return null;
  const minLength = mode === "dispute" ? 20 : 10;
  const pending = dispute.isPending || act.isPending;

  return (
    <Card>
      <h2 className="font-semibold text-ink">Something wrong?</h2>
      <p className="mt-1 text-sm text-muted">Raising a dispute pauses the payout until Lettr reviews it with both of you.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {tenancy.availableActions.includes("dispute") && (
          <Button variant="secondary" size="sm" onClick={() => setMode("dispute")}>
            <AlertTriangle className="size-4" aria-hidden /> Raise a dispute
          </Button>
        )}
        {tenancy.availableActions.includes("cancel") && (
          <Button variant="danger" size="sm" onClick={() => setMode("cancel")}>
            Cancel and get a refund
          </Button>
        )}
      </div>
      <Dialog
        open={mode !== null}
        onOpenChange={(v) => !v && setMode(null)}
        title={mode === "cancel" ? "Cancel for a full refund" : "Raise a dispute"}
        description={mode === "cancel" ? "The landlord didn't sign in time, so you can cancel. Your full payment is refunded." : "Tell us what's wrong. We'll contact you both."}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Back
            </Button>
            <Button
              variant={mode === "cancel" ? "danger" : "primary"}
              disabled={reason.trim().length < minLength}
              isLoading={pending}
              onClick={() => {
                const done = { onSuccess: () => setMode(null) };
                if (mode === "dispute" && tenancy.payment) dispute.mutate({ paymentId: tenancy.payment.id, reason: reason.trim() }, done);
                if (mode === "cancel") act.mutate({ action: "cancel", reason: reason.trim() }, done);
              }}
            >
              {mode === "cancel" ? "Cancel tenancy" : "Raise dispute"}
            </Button>
          </>
        }
      >
        <Field label={mode === "cancel" ? "Reason" : "What's the problem?"} hint={`At least ${minLength} characters.`}>
          <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
        </Field>
      </Dialog>
    </Card>
  );
}

export default function TenancyPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenancy, isPending, isError, error } = useTenancy(id);
  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (isError || !tenancy) return <ErrorState message={errorMessage(error, "We couldn't open this tenancy.")} />;

  const stage = tenancyStage(tenancy);
  const payment = tenancy.payment;
  const isTenant = tenancy.viewerRole === "TENANT";
  const openDispute = payment?.disputes.find((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW");
  const reviewee = isTenant ? tenancy.landlord : tenancy.tenant;

  return (
    <div className="grid gap-6">
      <div className="flex items-start gap-3">
        <Link href="/tenancies" className="mt-1 grid size-9 shrink-0 place-items-center rounded-control text-muted hover:bg-surface-2" aria-label="Back to tenancies">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] font-medium leading-tight text-ink">{tenancy.listing.property.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {tenancy.listing.property.address}, {tenancy.listing.property.neighbourhood}, {tenancy.listing.property.state}
          </p>
        </div>
        <Pill tone={stage.tone}>{stage.label}</Pill>
      </div>

      {openDispute ? (
        <div className="rounded-card border border-bad/30 bg-bad-soft p-5 text-sm text-bad">
          <p className="font-semibold">A dispute is open — the payout is paused</p>
          <p className="mt-1">{openDispute.reason}</p>
        </div>
      ) : (
        <NextStep tenancy={tenancy} />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">Tenancy agreement</h2>
              {tenancy.tenancyStartDate && tenancy.tenancyEndDate && <span className="text-sm text-muted">{formatTenancyPeriod(tenancy.tenancyStartDate, tenancy.tenancyEndDate)}</span>}
            </div>
            <article className="max-h-[520px] overflow-y-auto whitespace-pre-line rounded-control border border-line bg-bg p-5 font-display text-[15px] leading-relaxed text-ink">
              {tenancy.agreementText}
            </article>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { who: "Landlord", person: tenancy.landlord, at: tenancy.landlordSignedAt },
                { who: "Tenant", person: tenancy.tenant, at: tenancy.tenantSignedAt },
              ].map(({ who, person, at }) => (
                <div key={who} className="rounded-control border border-line p-3">
                  <p className="eyebrow">{who}</p>
                  <p className="mt-1 font-semibold text-ink">
                    {person.firstName} {person.lastName}
                  </p>
                  <p className={at ? "mt-0.5 text-[13px] text-ok" : "mt-0.5 text-[13px] text-muted"}>{at ? `Signed ${formatDateTime(at)}` : "Not signed yet"}</p>
                </div>
              ))}
            </div>
          </Card>

          {tenancy.isHandoverConfirmed && (
            <Card>
              <h2 className="mb-1 font-semibold text-ink">Review {reviewee.firstName}</h2>
              <p className="mb-4 text-sm text-muted">Your review helps other {isTenant ? "tenants choose a landlord" : "landlords choose a tenant"}.</p>
              <ReviewForm listingId={tenancy.listing.id} reviewee={reviewee} />
            </Card>
          )}
        </div>

        <aside className="grid content-start gap-4">
          {payment && (
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-ink">Payment</h2>
                <StatusPill kind="payment" status={payment.status} />
              </div>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{isTenant ? "You paid" : "Tenant paid"}</dt>
                  <dd className="tnum font-semibold text-ink">{formatCurrency(payment.totalAmount)}</dd>
                </div>
                {!isTenant && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Your payout</dt>
                    <dd className="tnum font-semibold text-ink">{formatCurrency(payment.totalAmount - payment.platformFee)}</dd>
                  </div>
                )}
                {payment.receipt && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Receipt</dt>
                    <dd className="tnum font-medium text-ink">{payment.receipt.receiptNumber}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted">Paid on</dt>
                  <dd className="text-ink">{formatDate(payment.createdAt)}</dd>
                </div>
              </dl>
              {payment.status === "IN_ESCROW" && <p className="mt-3 text-[13px] text-muted">Held by Lettr until move-in is confirmed.</p>}
            </Card>
          )}
          <Card>
            <h2 className="font-semibold text-ink">{isTenant ? "Your landlord" : "Your tenant"}</h2>
            <p className="mt-2 font-medium text-ink">
              {reviewee.firstName} {reviewee.lastName}
            </p>
            <p className="select-all text-sm text-ink-2">{reviewee.email}</p>
            {reviewee.phone && <p className="select-all text-sm text-ink-2">{reviewee.phone}</p>}
          </Card>
          <ProblemActions tenancy={tenancy} />
        </aside>
      </div>
    </div>
  );
}
