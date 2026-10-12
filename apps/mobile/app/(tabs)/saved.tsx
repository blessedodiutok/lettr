// File: apps/mobile/app/(tabs)/saved.tsx
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { PropertyCard } from "../../components/PropertyCard";
import { SkeletonCard } from "../../components/SkeletonCard";
import { apiClient } from "../../lib/axios";
import { useAuthStore } from "../../stores/authStore";
import type { Listing } from "../../types";

export default function SavedScreen() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const { data, isLoading } = useQuery<Array<{ listing: Listing }>>({
    queryKey: ["saved-listings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/listings/tenant/saved");
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
        <EmptyState
          icon="heart"
          title="Save your favourites"
          description="Log in to save listings and access them from any device."
          ctaLabel="Log in"
          onCtaPress={() => router.push("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
      <View className="px-4 pt-4 pb-2">
        <Text
          className="text-2xl text-[#1A3C5E]"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Saved
        </Text>
      </View>

      {isLoading ? (
        <View className="px-4 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : !data?.length ? (
        <EmptyState
          icon="heart"
          title="No saved listings"
          description="Tap the heart on any listing to save it here."
          ctaLabel="Browse listings"
          onCtaPress={() => router.push("/(tabs)")}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={({ listing }) => listing.id}
          contentContainerClassName="px-4 pb-8"
          renderItem={({ item: { listing } }) => (
            <View className="mb-4">
              <PropertyCard listing={listing} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
