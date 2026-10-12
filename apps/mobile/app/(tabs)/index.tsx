// Explore: search, quick filters and results.

import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ListingCard } from "../../components/listing";
import { COLORS, EmptyState, ErrorBox, Skeleton } from "../../components/ui";
import { useListingSearch } from "../../hooks/data";
import { useAuthStore } from "../../stores/auth";

const TYPES = [
  { label: "All", value: "" },
  { label: "Self-con", value: "SELF_CONTAINED" },
  { label: "Mini flat", value: "MINI_FLAT" },
  { label: "1 bed", value: "ONE_BEDROOM" },
  { label: "2 bed", value: "TWO_BEDROOM" },
  { label: "3 bed", value: "THREE_BEDROOM" },
  { label: "Duplex", value: "DUPLEX" },
];

const BUDGETS = [
  { label: "Any budget", value: "" },
  { label: "≤ ₦1m", value: "1000000" },
  { label: "≤ ₦2.5m", value: "2500000" },
  { label: "≤ ₦5m", value: "5000000" },
];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`h-9 justify-center rounded-full border px-3.5 ${active ? "border-navy bg-navy" : "border-line-strong bg-surface"}`}
    >
      <Text className={`font-sans-medium text-[13px] ${active ? "text-white" : "text-ink-2"}`}>{label}</Text>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const role = useAuthStore((s) => s.user?.role);
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const search = useListingSearch({ q, propertyType, maxRent, limit: "30", sortBy: "newest" });

  if (role === "LANDLORD") return <Redirect href="/overview" />;

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <View className="px-4 pb-3 pt-2">
        <Text className="font-display text-[26px] text-ink">
          Lettr<Text className="text-brass">.</Text>
        </Text>
        <View className="mt-3 h-12 flex-row items-center rounded-xl border border-line-strong bg-surface px-3">
          <Feather name="search" size={18} color={COLORS.muted} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => setQ(draft.trim())}
            returnKeyType="search"
            placeholder="Lekki, Yaba, Wuse 2…"
            placeholderTextColor="#8A97A6"
            accessibilityLabel="Search by area or street"
            className="ml-2 flex-1 font-sans text-[15px] text-ink"
          />
          {draft ? (
            <Pressable accessibilityLabel="Clear search" onPress={() => (setDraft(""), setQ(""))}>
              <Feather name="x" size={18} color={COLORS.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {TYPES.map((t) => (
            <Chip key={t.value} label={t.label} active={propertyType === t.value} onPress={() => setPropertyType(t.value)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 8 }}>
          {BUDGETS.map((b) => (
            <Chip key={b.value} label={b.label} active={maxRent === b.value} onPress={() => setMaxRent(b.value)} />
          ))}
        </ScrollView>
      </View>
      {search.isPending ? (
        <View className="gap-4 p-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </View>
      ) : search.isError ? (
        <View className="p-4">
          <ErrorBox message="We couldn't load homes. Check your connection." onRetry={() => search.refetch()} />
        </View>
      ) : (
        <FlatList
          data={search.data.listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={search.isRefetching} onRefresh={() => search.refetch()} />}
          ListHeaderComponent={<Text className="font-sans text-sm text-muted">{search.data.pagination.total} homes · prices per year</Text>}
          ListEmptyComponent={<EmptyState icon="search" title="No homes match" body="Try another area or a wider budget." />}
          renderItem={({ item }) => <ListingCard listing={item} />}
        />
      )}
    </SafeAreaView>
  );
}
