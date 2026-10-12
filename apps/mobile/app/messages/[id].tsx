// Conversation: messages plus the next-step actions the API allows.

import { Feather } from "@expo/vector-icons";
import { formatAppointment, formatDateTime, RENTAL_RULES } from "@lettr/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JourneySteps } from "../../components/listing";
import { Button, Card, COLORS, ErrorBox, ScreenHeader, Skeleton, StatusPill } from "../../components/ui";
import { useInquiry, useSendMessage, useThreadAction } from "../../hooks/data";
import { errorMessage } from "../../lib/api";
import type { InquiryThread } from "../../lib/types";
import { useAuthStore } from "../../stores/auth";

/** Next seven days × common viewing times — no date picker dependency needed. */
function slotOptions() {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  return { days, times: [9, 11, 13, 15, 17] };
}

function InspectionSheet({ thread, open, onClose }: { thread: InquiryThread; open: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const action = useThreadAction(thread.id);
  const { days, times } = slotOptions();
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(11);
  const scheduled = new Date(days[day]);
  scheduled.setHours(hour);
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View style={{ paddingBottom: insets.bottom + 16 }} className="gap-4 rounded-t-3xl bg-surface p-5">
          <Text className="font-display text-2xl text-ink">Propose an inspection</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {days.map((d, i) => (
              <Pressable key={d.toISOString()} onPress={() => setDay(i)} className={`items-center rounded-xl border px-3 py-2 ${day === i ? "border-navy bg-navy" : "border-line-strong"}`}>
                <Text className={`font-sans text-xs ${day === i ? "text-white" : "text-muted"}`}>{d.toLocaleDateString("en-NG", { weekday: "short" })}</Text>
                <Text className={`font-sans-bold text-base ${day === i ? "text-white" : "text-ink"}`}>{d.getDate()}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View className="flex-row flex-wrap gap-2">
            {times.map((h) => (
              <Pressable key={h} onPress={() => setHour(h)} className={`rounded-full border px-4 py-2 ${hour === h ? "border-navy bg-navy-soft" : "border-line-strong"}`}>
                <Text className={`font-sans-medium text-sm ${hour === h ? "text-navy" : "text-ink-2"}`}>{h > 12 ? `${h - 12}pm` : h === 12 ? "12pm" : `${h}am`}</Text>
              </Pressable>
            ))}
          </View>
          <Text className="font-sans text-sm text-ink-2">{formatAppointment(scheduled)}</Text>
          <View className="flex-row gap-2">
            <Button className="flex-1" variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              loading={action.isPending}
              onPress={() => action.mutate({ path: "inspection", body: { scheduledAt: scheduled.toISOString() }, done: "Inspection time proposed" }, { onSuccess: onClose })}
            >
              Send proposal
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Actions({ thread }: { thread: InquiryThread }) {
  const router = useRouter();
  const action = useThreadAction(thread.id);
  const [inspection, setInspection] = useState(false);
  const can = (a: InquiryThread["availableActions"][number]) => thread.availableActions.includes(a);
  const tenant = thread.viewerRole === "TENANT";
  const confirm = (title: string, body: string, label: string, run: () => void) =>
    Alert.alert(title, body, [
      { text: "Cancel", style: "cancel" },
      { text: label, onPress: run },
    ]);
  const booking = thread.inspectionBooking;
  const paid = thread.payment && ["IN_ESCROW", "RELEASED"].includes(thread.payment.status);

  return (
    <View className="gap-3">
      {thread.tenancy ? (
        <Card className="gap-2 border-navy/30">
          <Text className="font-sans-bold text-[15px] text-ink">Rent is in escrow</Text>
          <Button size="sm" onPress={() => router.push(`/tenancy/${thread.tenancy!.id}`)}>
            Open the tenancy
          </Button>
        </Card>
      ) : thread.status === "ACCEPTED" && !paid ? (
        <Card className="gap-2 border-brass/50 bg-brass-soft">
          <Text className="font-sans-bold text-[15px] text-ink">{tenant ? "Pay into escrow to secure the home" : `${thread.tenant.firstName} accepted your offer`}</Text>
          {thread.paymentDueAt && <Text className="font-sans text-sm text-ink-2">Held until {formatAppointment(thread.paymentDueAt)}.</Text>}
          {tenant && (
            <Button variant="accent" size="sm" onPress={() => router.push(`/pay/${thread.listingId}`)}>
              Pay into escrow
            </Button>
          )}
        </Card>
      ) : thread.status === "OFFER_MADE" ? (
        <Card className="gap-2 border-brass/50 bg-brass-soft">
          <Text className="font-sans-bold text-[15px] text-ink">{tenant ? `${thread.landlord.firstName} offered you this home` : "Offer sent"}</Text>
          {thread.offerNote && <Text className="font-sans text-sm italic text-ink-2">“{thread.offerNote}”</Text>}
          {thread.offerExpiresAt && <Text className="font-sans text-sm text-ink-2">Open until {formatAppointment(thread.offerExpiresAt)}.</Text>}
          <View className="flex-row flex-wrap gap-2">
            {can("acceptOffer") && (
              <Button
                variant="accent"
                size="sm"
                loading={action.isPending}
                onPress={() =>
                  confirm("Accept this offer?", `The home is held for you for ${RENTAL_RULES.paymentWindowHours} hours while you pay into escrow. The landlord is paid only after you have the keys.`, "Accept", () =>
                    action.mutate({ path: "offer/accept", done: "Offer accepted — the home is held for you" }),
                  )
                }
              >
                Accept offer
              </Button>
            )}
            {can("declineOffer") && (
              <Button variant="secondary" size="sm" onPress={() => confirm("Decline this offer?", "The conversation will close.", "Decline", () => action.mutate({ path: "offer/decline", done: "Offer declined" }))}>
                Decline
              </Button>
            )}
            {can("withdrawOffer") && (
              <Button variant="secondary" size="sm" onPress={() => action.mutate({ path: "offer/withdraw", done: "Offer withdrawn" })}>
                Withdraw offer
              </Button>
            )}
          </View>
        </Card>
      ) : null}

      {booking && thread.status === "INSPECTION_SCHEDULED" && (
        <Card className="gap-2">
          <Text className="font-sans-bold text-[15px] text-ink">
            Inspection {booking.isConfirmed ? "confirmed" : "proposed"} · {formatAppointment(booking.scheduledAt)}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {can("confirmInspection") && (
              <Button size="sm" loading={action.isPending} onPress={() => action.mutate({ path: "inspection/confirm", done: "Inspection confirmed" })}>
                Confirm time
              </Button>
            )}
            {can("completeInspection") && (
              <Button size="sm" variant="secondary" onPress={() => action.mutate({ path: "inspection/complete", done: "Inspection marked as done" })}>
                Inspection done
              </Button>
            )}
            {can("scheduleInspection") && (
              <Button size="sm" variant="secondary" onPress={() => setInspection(true)}>
                Suggest another time
              </Button>
            )}
          </View>
        </Card>
      )}

      <View className="flex-row flex-wrap gap-2">
        {can("scheduleInspection") && thread.status !== "INSPECTION_SCHEDULED" && (
          <Button size="sm" variant="secondary" icon="calendar" onPress={() => setInspection(true)}>
            Propose inspection
          </Button>
        )}
        {can("makeOffer") && (
          <Button
            size="sm"
            variant="accent"
            onPress={() =>
              confirm(`Offer the home to ${thread.tenant.firstName}?`, `They have ${RENTAL_RULES.offerValidDays} days to accept at the listed rent.`, "Send offer", () =>
                action.mutate({ path: "offer", done: "Offer sent" }),
              )
            }
          >
            Offer the home
          </Button>
        )}
      </View>
      <InspectionSheet thread={thread} open={inspection} onClose={() => setInspection(false)} />
    </View>
  );
}

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const me = useAuthStore((s) => s.user);
  const thread = useInquiry(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState("");
  const [showSteps, setShowSteps] = useState(false);
  const list = useRef<FlatList>(null);

  if (thread.isPending) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader />
        <Skeleton className="m-4 h-64" />
      </View>
    );
  }
  if (thread.isError || !thread.data) {
    return (
      <View className="flex-1 bg-bg">
        <ScreenHeader />
        <View className="p-4">
          <ErrorBox message={errorMessage(thread.error, "We couldn't open this conversation.")} />
        </View>
      </View>
    );
  }

  const t = thread.data;
  const other = t.viewerRole === "TENANT" ? t.landlord : t.tenant;
  const canMessage = t.availableActions.includes("message");

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title={`${other.firstName} ${other.lastName}`} right={<StatusPill kind="inquiry" status={t.status} />} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <FlatList
          ref={list}
          data={t.messages}
          keyExtractor={(m) => m.id}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            <View className="mb-2 gap-3">
              <Pressable onPress={() => setShowSteps((v) => !v)} className="flex-row items-center justify-between rounded-xl border border-line bg-surface p-3">
                <Text numberOfLines={1} className="flex-1 font-sans-medium text-sm text-ink">
                  {t.listing.property.title}
                </Text>
                <Feather name={showSteps ? "chevron-up" : "chevron-down"} size={18} color={COLORS.muted} />
              </Pressable>
              {showSteps && (
                <Card>
                  <JourneySteps input={{ inquiry: t, payment: t.payment, tenancy: t.tenancy }} />
                </Card>
              )}
              <Actions thread={t} />
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.senderId === me?.id;
            return (
              <View className={`max-w-[85%] ${mine ? "self-end items-end" : "self-start items-start"}`}>
                <View className={`rounded-2xl px-3.5 py-2.5 ${mine ? "rounded-br-sm bg-navy" : "rounded-bl-sm bg-surface"}`}>
                  <Text className={`font-sans text-[15px] leading-[22px] ${mine ? "text-white" : "text-ink"}`}>{item.body}</Text>
                </View>
                <Text className="mt-1 font-sans text-[11px] text-muted">{formatDateTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />
        {canMessage ? (
          <View style={{ paddingBottom: insets.bottom + 8 }} className="flex-row items-end gap-2 border-t border-line bg-surface px-3 pt-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${other.firstName}…`}
              placeholderTextColor="#8A97A6"
              multiline
              maxLength={1000}
              accessibilityLabel="Message"
              className="max-h-32 min-h-[44px] flex-1 rounded-xl border border-line-strong bg-bg px-3 py-2.5 font-sans text-[15px] text-ink"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send message"
              disabled={!draft.trim() || send.isPending}
              onPress={() => send.mutate(draft.trim(), { onSuccess: () => setDraft("") })}
              className={`h-11 w-11 items-center justify-center rounded-xl bg-navy ${!draft.trim() ? "opacity-50" : ""}`}
            >
              <Feather name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Text style={{ paddingBottom: insets.bottom + 12 }} className="border-t border-line bg-surface p-4 text-center font-sans text-sm text-muted">
            {t.closedReason ?? "This conversation is closed."}
          </Text>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
