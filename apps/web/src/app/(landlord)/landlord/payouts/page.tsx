"use client";

import { formatCurrency } from "@lettr/utils";
import { Banknote, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { FormError } from "../../../../components/auth/AuthHeading";
import { PaymentsTable } from "../../../../components/payments/PaymentsTable";
import { Button } from "../../../../components/ui/button";
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from "../../../../components/ui/display";
import { Field, Input, Select } from "../../../../components/ui/field";
import { useBanks, useSetBankAccount } from "../../../../hooks/useAccount";
import { useMyPayments } from "../../../../hooks/usePayments";
import { useRefreshMe } from "../../../../hooks/useRefreshMe";
import { errorMessage } from "../../../../lib/api";
import { useAuthStore } from "../../../../stores/authStore";
import { toast } from "../../../../stores/toastStore";

function BankAccount() {
  const profile = useAuthStore((s) => s.user?.landlordProfile);
  const [editing, setEditing] = useState(false);
  const banks = useBanks(editing || !profile?.bankAccountVerifiedAt);
  const save = useSetBankAccount();
  const refreshMe = useRefreshMe();
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  if (profile?.bankAccountVerifiedAt && !editing) {
    return (
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-ink">Payout account</h2>
            <p className="mt-2 flex items-center gap-2 text-[15px] text-ink">
              <CheckCircle2 className="size-4 text-ok" aria-hidden /> {profile.bankAccountName}
            </p>
            <p className="tnum text-sm text-muted">
              {profile.bankName} · {profile.bankAccountNumber}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Change account
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-semibold text-ink">Payout account</h2>
      <p className="mt-1 text-sm text-muted">We check the account name with your bank before saving it. Payouts go only to this account.</p>
      <form
        className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(
            { bankCode, accountNumber },
            {
              onSuccess: async (data) => {
                toast.success(`Saved — account name ${data.bankAccountName}`);
                setEditing(false);
                await refreshMe();
              },
            },
          );
        }}
      >
        <Field label="Bank">
          <Select value={bankCode} onChange={(e) => setBankCode(e.target.value)} disabled={banks.isPending}>
            <option value="">{banks.isPending ? "Loading banks…" : "Choose your bank"}</option>
            {banks.data?.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Account number">
          <Input inputMode="numeric" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} placeholder="10 digits" />
        </Field>
        <Button type="submit" isLoading={save.isPending} disabled={!bankCode || accountNumber.length !== 10}>
          Verify and save
        </Button>
      </form>
      <div className="mt-3">
        <FormError message={save.isError ? errorMessage(save.error) : null} />
      </div>
    </Card>
  );
}

export default function PayoutsPage() {
  const { data, isPending, isError, refetch } = useMyPayments();
  const inEscrow = (data ?? []).filter((p) => p.status === "IN_ESCROW").reduce((s, p) => s + p.landlordPayout, 0);
  const paid = (data ?? []).filter((p) => p.status === "RELEASED").reduce((s, p) => s + p.landlordPayout, 0);

  return (
    <>
      <PageHeader title="Payouts" description="Rent is paid to you when the tenant confirms move-in, or 7 days after you mark the handover." />
      <div className="grid gap-5">
        <BankAccount />
        <div className="grid grid-cols-2 gap-3">
          <Card as="div" className="p-4">
            <p className="text-[13px] text-muted">Held in escrow for you</p>
            <p className="tnum mt-1 text-2xl font-bold text-ink">{formatCurrency(inEscrow)}</p>
          </Card>
          <Card as="div" className="p-4">
            <p className="text-[13px] text-muted">Paid out to date</p>
            <p className="tnum mt-1 text-2xl font-bold text-ink">{formatCurrency(paid)}</p>
          </Card>
        </div>
        {isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : isError ? (
          <ErrorState message="We couldn't load payouts." onRetry={() => refetch()} />
        ) : data.length === 0 ? (
          <EmptyState icon={<Banknote className="size-5" />} title="No payments yet" description="When a tenant pays into escrow for one of your homes, it appears here." />
        ) : (
          <PaymentsTable payments={data} view="landlord" />
        )}
      </div>
    </>
  );
}
