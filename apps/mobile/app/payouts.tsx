// Payments (tenants) and payouts (landlords). Bank details are managed on the web.

import { formatCurrency, formatDate } from "@lettr/utils";
import * as WebBrowser from "expo-web-browser";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { Button, Card, EmptyState, ErrorBox, ScreenHeader, Skeleton, StatusPill } from "../components/ui";
import { usePayments } from "../hooks/data";
import { WEB_URL } from "../lib/api";
import { useAuthStore } from "../stores/auth";

export default function PayoutsScreen() {
  const user = useAuthStore((s) => s.user);
  const payments = usePayments();
  const landlord = user?.role === "LANDLORD";
  const bank = user?.landlordProfile;

  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader title={landlord ? "Payouts" : "Payments"} />
      <FlatList
        data={payments.data ?? []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={payments.isRefetching} onRefresh={() => payments.refetch()} />}
        ListHeaderComponent={
          landlord ? (
            <Card className="mb-2 gap-2">
              <Text className="font-sans-bold text-[15px] text-ink">Payout account</Text>
              <Text className="font-sans text-sm text-ink-2">
                {bank?.bankAccountVerifiedAt ? `${bank.bankAccountName} · ${bank.bankName} ${bank.bankAccountNumber}` : "No bank account yet — add one so you're paid without delay."}
              </Text>
              <Button size="sm" variant="secondary" onPress={() => WebBrowser.openBrowserAsync(`${WEB_URL}/landlord/payouts`)}>
                {bank?.bankAccountVerifiedAt ? "Change on lettr.ng" : "Add on lettr.ng"}
              </Button>
            </Card>
          ) : null
        }
        ListEmptyComponent={
          payments.isPending ? (
            <Skeleton className="h-20" />
          ) : payments.isError ? (
            <ErrorBox message="We couldn't load payments." onRetry={() => payments.refetch()} />
          ) : (
            <EmptyState icon="credit-card" title="No payments yet" />
          )
        }
        renderItem={({ item }) => (
          <Card className="gap-1">
            <View className="flex-row items-center justify-between gap-2">
              <Text numberOfLines={1} className="flex-1 font-sans-bold text-[15px] text-ink">
                {item.listing.property.title}
              </Text>
              <StatusPill kind="payment" status={item.status} />
            </View>
            <Text className="font-sans text-sm text-ink-2">
              {formatCurrency(landlord ? item.landlordPayout : item.totalAmount)} · {formatDate(item.createdAt)}
            </Text>
            {item.receipt && <Text className="font-sans text-xs text-muted">Receipt {item.receipt.receiptNumber}</Text>}
          </Card>
        )}
      />
    </View>
  );
}
