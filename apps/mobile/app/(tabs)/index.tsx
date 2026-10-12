// File: apps/mobile/app/(tabs)/index.tsx
// Explore tab — search bar + featured listings

import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { PropertyCard } from "../../components/PropertyCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { apiClient } from "../../lib/axios";
import type { Listing } from "../../types";

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Self-con", value: "SELF_CONTAINED" },
  { label: "Mini flat", value: "MINI_FLAT" },
  { label: "1 Bed", value: "ONE_BEDROOM" },
  { label: "2 Bed", value: "TWO_BEDROOM" },
  { label: "3 Bed", value: "THREE_BEDROOM" },
  { label: "Duplex", value: "DUPLEX" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ listings: Listing[] }>({
    queryKey: ["listings", activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams(
        activeCategory
          ? [["limit", "20"], ["propertyType", activeCategory]]
          : [["limit", "20"]],
      );
      const res = await apiClient.get(`/api/listings?${params.toString()}`);
      return res.data.data;
    },
  });

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4 bg-[#1A3C5E]">
        <Text
          className="text-2xl text-white mb-4"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Find your home
        </Text>
        {/* Search bar */}
        <TouchableOpacity
          onPress={() => router.push("/listings" as never)}
          className="flex-row items-center bg-white rounded-xl px-4 h-11 gap-2"
          activeOpacity={0.85}
        >
          <Feather name="search" size={16} color="#94A3B8" />
          <Text
            className="text-[#94A3B8] text-sm flex-1"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            Search by location, type…
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.listings ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1A3C5E"
          />
        }
        ListHeaderComponent={
          <>
            {/* Category chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-4 -mx-4 px-4"
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setActiveCategory(cat.value)}
                  className={[
                    "mr-2 px-4 py-2 rounded-full border",
                    activeCategory === cat.value
                      ? "bg-[#1A3C5E] border-[#1A3C5E]"
                      : "bg-white border-[#E2E8F0]",
                  ].join(" ")}
                >
                  <Text
                    className={
                      activeCategory === cat.value
                        ? "text-white text-sm font-semibold"
                        : "text-[#64748B] text-sm"
                    }
                    style={{ fontFamily: "DMSans_500Medium" }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text
              className="text-lg text-[#1A3C5E] mb-4"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              Latest listings
            </Text>

            {isLoading && (
              <View className="gap-4">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="search"
              title="No listings found"
              description="Try a different category or check back soon."
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View className="mb-4">
            <PropertyCard listing={item} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
