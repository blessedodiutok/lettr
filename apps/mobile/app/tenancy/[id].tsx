import { formatAppointment, formatCurrency, formatDateTime } from "@lettr/utils";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Modal, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, ErrorBox, Pill, ScreenHeader, Skeleton, StatusPill } from "../../components/ui";
import { useRaiseDispute, useTenancy, useTenancyAction } from "../../hooks/data";
import { errorMessage } from "../../lib/api";
import { tenancyStage } from "../../lib/stage";

function ReasonSheet({ open, title, minLength, onClose, onSubmit, loading }: { open: boolean; title: string; minLength: number; onClose: () => void; onSubmit: (r: string) => void; loading: boolean }) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState("");
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View style={{ paddingBottom: insets.bottom + 16 }} className="gap-3 rounded-t-3xl bg-surface p-5">
          <Text className="font-display text-2xl text-ink">{title}</Text>
          <TextInput
            multiline
            value={reason}
            onChangeText={setReason}
            placeholder={`At least ${minLength} characters`}
            accessibilityLabel="Reason"
            className="min-h-[120px] rounded-lg border border-line-strong p-3 font-sans text-[15px] text-ink"
            style={{ textAlignVertical: "top" }}
          />
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary" onPress={onClose}>
              Back
            </Button>
            <Button className="flex-1" variant="danger" loading={loading} disabled={reason.trim().length < minLength} onPress={() => onSubmit(reason.trim())}>
              Submit
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TenancyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenancy = useTenancy(id);
  const act = useTenancyAction(id);
  const dispute = useRaiseDispute();
  const [sheet, setSheet] = useState<null | "dispute" | "cancel">(null);

  if (tenancy.isPending) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader />
        <Skeleton className="m-4 h-72" />
      </View>
    );
  }
  if (tenancy.isError || !tenancy.data) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader />
        <View className="p-4">
          <ErrorBox message={errorMessage(tenancy.error, "We couldn't open this tenancy.")} />
        </View>
      </View>
    );
  }

  const t = tenancy.data;
  const tenant = t.viewerRole === "TENANT";
  const stage = tenancyStage(t);
  const can = (a: (typeof t.availableActions)[number]) => t.availableActions.includes(a);
  const confirm = (title: string, body: string, label: string, run: () => void) =>
    Alert.alert(title, body, [
      { text: "Cancel", style: "cancel" },
      { text: label, onPress: run },
    ]);
  const openDispute = t.payment?.disputes.find((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW");

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title={t.listing.property.title} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View className="gap-1">
          <Pill tone={stage.tone}>{stage.label}</Pill>
          <Text className="mt-1 font-sans text-sm text-muted">
            {t.listing.property.address}, {t.listing.property.neighbourhood}, {t.listing.property.state}
          </Text>
        </View>

        {openDispute ? (
          <ErrorBox message={`A dispute is open — the payout is paused. ${openDispute.reason}`} />
        ) : (
          <Card className="gap-3 border-brass/50 bg-brass-soft">
            {can("sign") && (
              <>
                <Text className="font-sans-bold text-[15px] text-ink">Read the agreement below, then sign</Text>
                <Button variant="accent" loading={act.isPending} onPress={() => confirm("Sign the agreement?", "Your signature is recorded with today's date and time.", "Sign", () => act.mutate({ action: "sign", done: "Agreement signed" }))}>
                  Sign agreement
                </Button>
              </>
            )}
            {can("markHandover") && (
              <>
                <Text className="font-sans-bold text-[15px] text-ink">Hand over the keys, then mark it here</Text>
                <Button
                  variant="accent"
                  loading={act.isPending}
                  onPress={() =>
                    confirm("Keys handed over?", `${t.tenant.firstName} will be asked to confirm. If they don't respond within 7 days, you're paid automatically.`, "Yes", () =>
                      act.mutate({ action: "handover", done: "Handover recorded" }),
                    )
                  }
                >
                  Mark keys handed over
                </Button>
              </>
            )}
            {can("confirmMoveIn") && (
              <>
                <Text className="font-sans-bold text-[15px] text-ink">Do you have the keys?</Text>
                <Text className="font-sans text-sm text-ink-2">
                  Confirming releases the rent to the landlord.{t.autoReleaseAt ? ` Otherwise it releases on ${formatAppointment(t.autoReleaseAt)}.` : ""}
                </Text>
                <Button
                  variant="accent"
                  loading={act.isPending}
                  onPress={() => confirm("Release the rent?", "Only confirm if you have the keys and the home matches the listing. This can't be undone.", "Release", () => act.mutate({ action: "confirm-move-in", done: "Welcome home" }))}
                >
                  I have the keys
                </Button>
              </>
            )}
            {!can("sign") && !can("markHandover") && !can("confirmMoveIn") && (
              <Text className="font-sans text-sm text-ink-2">
                {t.isHandoverConfirmed
                  ? "Tenancy started. The landlord has been paid."
                  : t.cancelledAt
                    ? "This tenancy was cancelled."
                    : !t.tenantSignedAt || !t.landlordSignedAt
                      ? `Waiting for ${tenant ? t.landlord.firstName : t.tenant.firstName} to sign.`
                      : "Waiting for the next step from the other party."}
              </Text>
            )}
          </Card>
        )}

        {t.payment && (
          <Card className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-bold text-[15px] text-ink">Payment</Text>
              <StatusPill kind="payment" status={t.payment.status} />
            </View>
            <Text className="font-sans text-sm text-ink-2">
              {tenant ? "You paid" : "Your payout"} {formatCurrency(tenant ? t.payment.totalAmount : t.payment.totalAmount - t.payment.platformFee)}
              {t.payment.receipt ? ` · ${t.payment.receipt.receiptNumber}` : ""}
            </Text>
          </Card>
        )}

        <Card className="gap-3">
          <Text className="font-sans-bold text-[15px] text-ink">Tenancy agreement</Text>
          <Text className="font-sans text-[14px] leading-6 text-ink-2">{t.agreementText}</Text>
          <Text className="font-sans text-[13px] text-muted">
            Landlord: {t.landlordSignedAt ? `signed ${formatDateTime(t.landlordSignedAt)}` : "not signed yet"}
            {"\n"}Tenant: {t.tenantSignedAt ? `signed ${formatDateTime(t.tenantSignedAt)}` : "not signed yet"}
          </Text>
        </Card>

        {(can("dispute") || can("cancel")) && (
          <View className="gap-2">
            {can("dispute") && (
              <Button variant="secondary" icon="alert-triangle" onPress={() => setSheet("dispute")}>
                Raise a dispute
              </Button>
            )}
            {can("cancel") && (
              <Button variant="danger" onPress={() => setSheet("cancel")}>
                Cancel and get a refund
              </Button>
            )}
          </View>
        )}
      </ScrollView>
      <ReasonSheet
        open={sheet !== null}
        title={sheet === "cancel" ? "Cancel for a full refund" : "What's wrong?"}
        minLength={sheet === "cancel" ? 10 : 20}
        loading={dispute.isPending || act.isPending}
        onClose={() => setSheet(null)}
        onSubmit={(reason) => {
          const done = { onSuccess: () => setSheet(null) };
          if (sheet === "dispute" && t.payment) dispute.mutate({ paymentId: t.payment.id, reason }, done);
          if (sheet === "cancel") act.mutate({ action: "cancel", body: { reason }, done: "Tenancy cancelled — refund on its way" }, done);
        }}
      />
    </View>
  );
}
