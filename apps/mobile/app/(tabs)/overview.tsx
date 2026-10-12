// Landlord overview: the actions that move money, first.

import { formatCurrencyShort } from "@lettr/utils";
import { useRouter } from "expo-router";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Skeleton, Title } from "../../components/ui";
import { useInquiries, useMyListings, usePayments, useTenancies } from "../../hooks/data";
import { WEB_URL } from "../../lib/api";
import { useAuthStore } from "../../stores/auth";
import * as WebBrowser from "expo-web-browser";

interface Task {
  key: string;
  title: string;
  detail: string;
  onPress: () => void;
  urgent?: boolean;
}

export default function OverviewScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenancies = useTenancies();
  const inquiries = useInquiries("active");
  const payments = usePayments();
  const listings = useMyListings();

  const tasks: Task[] = [];
  for (const t of tenancies.data ?? []) {
    if (t.cancelledAt || t.isHandoverConfirmed) continue;
    if (!t.landlordSignedAt) tasks.push({ key: `s${t.id}`, title: `Sign the agreement for ${t.listing.property.title}`, detail: `${t.tenant.firstName} has paid into escrow.`, onPress: () => router.push(`/tenancy/${t.id}`), urgent: true });
    else if (t.tenantSignedAt && !t.handoverMarkedAt) tasks.push({ key: `h${t.id}`, title: `Hand over the keys for ${t.listing.property.title}`, detail: "Mark the handover once the tenant has the keys.", onPress: () => router.push(`/tenancy/${t.id}`), urgent: true });
  }
  const waiting = (inquiries.data ?? []).filter((i) => i.unreadCount > 0 || i.status === "OPEN");
  if (waiting.length) tasks.push({ key: "reply", title: `${waiting.length} conversation${waiting.length > 1 ? "s" : ""} waiting for you`, detail: "Quick replies win tenants.", onPress: () => router.push("/messages") });
  const status = user?.landlordProfile?.verificationStatus;
  if (status === "UNVERIFIED" || status === "REJECTED") {
    tasks.push({ key: "verify", title: "Verify your ID", detail: "Needed before you can publish. Opens lettr.ng.", onPress: () => WebBrowser.openBrowserAsync(`${WEB_URL}/landlord/verification`) });
  }

  const escrow = (payments.data ?? []).filter((p) => p.status === "IN_ESCROW").reduce((s, p) => s + p.landlordPayout, 0);
  const paid = (payments.data ?? []).filter((p) => p.status === "RELEASED").reduce((s, p) => s + p.landlordPayout, 0);
  const loading = tenancies.isPending || inquiries.isPending || payments.isPending || listings.isPending;
  const refresh = () => Promise.all([tenancies.refetch(), inquiries.refetch(), payments.refetch(), listings.refetch()]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}>
        <Title sub="What needs your attention across your homes.">{`Welcome, ${user?.firstName ?? ""}`}</Title>
        <Text className="mb-2 font-sans-bold text-xs uppercase tracking-widest text-muted">Needs your attention</Text>
        {loading ? (
          <Skeleton className="h-20" />
        ) : tasks.length === 0 ? (
          <Card>
            <Text className="font-sans text-sm text-muted">You&apos;re all caught up.</Text>
          </Card>
        ) : (
          <View className="gap-2">
            {tasks.map((task) => (
              <Pressable key={task.key} accessibilityRole="button" onPress={task.onPress} className={`rounded-xl border border-line border-l-[3px] bg-surface p-4 ${task.urgent ? "border-l-brass" : "border-l-navy"}`}>
                <Text className="font-sans-bold text-[15px] text-ink">{task.title}</Text>
                <Text className="mt-0.5 font-sans text-[13px] text-muted">{task.detail}</Text>
              </Pressable>
            ))}
          </View>
        )}
        <View className="mt-5 flex-row flex-wrap gap-3">
          {[
            ["Active listings", loading ? "–" : String((listings.data ?? []).filter((l) => l.status === "ACTIVE").length)],
            ["Open conversations", loading ? "–" : String(inquiries.data?.length ?? 0)],
            ["Held in escrow", loading ? "–" : formatCurrencyShort(escrow)],
            ["Paid out", loading ? "–" : formatCurrencyShort(paid)],
          ].map(([label, value]) => (
            <View key={label} className="min-w-[46%] flex-1 rounded-xl border border-line bg-surface p-4">
              <Text className="font-sans text-[13px] text-muted">{label}</Text>
              <Text className="mt-1 font-sans-bold text-2xl text-ink">{value}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.push("/payouts")} className="mt-5">
          <Text className="font-sans-bold text-sm text-navy">View payouts →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
