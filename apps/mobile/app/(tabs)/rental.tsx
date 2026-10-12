import { formatCurrency, formatTenancyPeriod } from "@lettr/utils";
import { useRouter } from "expo-router";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState, ErrorBox, Pill, Skeleton, Title } from "../../components/ui";
import { useTenancies } from "../../hooks/data";
import { tenancyStage } from "../../lib/stage";
import { useAuthStore } from "../../stores/auth";

export default function RentalScreen() {
  const router = useRouter();
  const landlord = useAuthStore((s) => s.user?.role === "LANDLORD");
  const tenancies = useTenancies();
  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <FlatList
        data={tenancies.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        refreshControl={<RefreshControl refreshing={tenancies.isRefetching} onRefresh={() => tenancies.refetch()} />}
        ListHeaderComponent={<Title sub={landlord ? "Agreements, handovers and current tenants." : "Your agreement, move-in and payment."}>{landlord ? "Tenancies" : "My rental"}</Title>}
        ListEmptyComponent={
          tenancies.isPending ? (
            <Skeleton className="h-24" />
          ) : tenancies.isError ? (
            <ErrorBox message="We couldn't load tenancies." onRetry={() => tenancies.refetch()} />
          ) : (
            <EmptyState icon="file-text" title="No tenancies yet" body={landlord ? "A tenancy appears once a tenant pays into escrow." : "Once you pay into escrow for a home, it appears here."} />
          )
        }
        renderItem={({ item }) => {
          const stage = tenancyStage(item);
          const other = landlord ? item.tenant : item.landlord;
          return (
            <Pressable accessibilityRole="button" onPress={() => router.push(`/tenancy/${item.id}`)} className="gap-1 rounded-xl border border-line bg-surface p-4 active:opacity-80">
              <Text className="font-sans-bold text-[15px] text-ink">{item.listing.property.title}</Text>
              <Text className="font-sans text-[13px] text-muted">
                {landlord ? "Tenant" : "Landlord"}: {other.firstName} {other.lastName}
              </Text>
              <Text className="font-sans text-[13px] text-ink-2">
                {formatCurrency(item.listing.annualRent)} a year
                {item.tenancyStartDate && item.tenancyEndDate ? ` · ${formatTenancyPeriod(item.tenancyStartDate, item.tenancyEndDate)}` : ""}
              </Text>
              <View className="mt-1">
                <Pill tone={stage.tone}>{stage.label}</Pill>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
