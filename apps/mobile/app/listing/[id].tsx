// File: apps/mobile/app/listing/[id].tsx
// Full listing detail with swipeable gesture-based photo gallery

import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { SavingsCallout } from "../../components/SavingsCallout";
import { VerifiedBadge } from "../../components/VerifiedBadge";
import { apiClient } from "../../lib/axios";
import { formatDate, formatNaira, formatPropertyType } from "../../lib/utils";
import { useAuthStore } from "../../stores/authStore";
import type { Listing } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [activePhoto, setActivePhoto] = useState(0);
  const translateX = useSharedValue(0);

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/listings/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(translateX.value) }],
  }));

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#FAFAF7] items-center justify-center"
        edges={["top"]}
      >
        <ActivityIndicator color="#1A3C5E" size="large" />
      </SafeAreaView>
    );
  }

  if (!listing) return null;

  const { property, landlord } = listing;
  const photos = [...property.photos].sort((a) => (a.isCover ? -1 : 1));
  const isVerified =
    landlord.landlordProfile?.verificationStatus === "VERIFIED";

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo gallery */}
        <View className="relative" style={{ height: 280 }}>
          {photos.length > 0 ? (
            <>
              <Animated.View
                style={[{ width: SCREEN_WIDTH, height: 280 }, animatedStyle]}
              >
                <Image
                  source={{ uri: photos[activePhoto]?.url }}
                  style={{ width: SCREEN_WIDTH, height: 280 }}
                  contentFit="cover"
                />
              </Animated.View>
              {/* Photo counter */}
              <View className="absolute bottom-3 right-3 bg-black/50 rounded-full px-3 py-1">
                <Text className="text-white text-xs">
                  {activePhoto + 1} / {photos.length}
                </Text>
              </View>
              {/* Photo dots */}
              <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
                {photos.slice(0, 6).map((_, i) => (
                  <TouchableOpacity key={i} onPress={() => setActivePhoto(i)}>
                    <View
                      className={[
                        "rounded-full",
                        i === activePhoto
                          ? "w-4 h-1.5 bg-white"
                          : "w-1.5 h-1.5 bg-white/50",
                      ].join(" ")}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View
              className="w-full items-center justify-center bg-[#E2E8F0]"
              style={{ height: 280 }}
            >
              <Feather name="image" size={48} color="#94A3B8" />
            </View>
          )}

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-white/90 rounded-full items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color="#1A3C5E" />
          </TouchableOpacity>
        </View>

        <View className="px-4 pt-5 pb-8 space-y-5">
          {/* Type + title */}
          <View>
            <View className="flex-row items-center gap-2 mb-1">
              <View className="bg-[#EEF3F8] rounded-full px-3 py-1">
                <Text className="text-xs text-[#1A3C5E] font-semibold">
                  {formatPropertyType(property.propertyType)}
                </Text>
              </View>
              {listing.status === "ACTIVE" && (
                <View className="bg-green-100 rounded-full px-3 py-1">
                  <Text className="text-xs text-green-700 font-semibold">
                    Available
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-2xl text-[#1A3C5E] mb-1"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {property.title}
            </Text>
            <View className="flex-row items-center gap-1">
              <Feather name="map-pin" size={13} color="#64748B" />
              <Text
                className="text-sm text-[#64748B]"
                style={{ fontFamily: "DMSans_400Regular" }}
              >
                {property.neighbourhood}, {property.lga} · {property.state}
              </Text>
            </View>
          </View>

          {/* Price */}
          <View>
            <Text
              className="text-3xl text-[#1A3C5E]"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {formatNaira(listing.annualRent)}
            </Text>
            <Text className="text-sm text-[#64748B]">per year</Text>
          </View>

          {/* Savings callout */}
          <SavingsCallout annualRent={listing.annualRent} />

          {/* Features */}
          <View className="flex-row flex-wrap gap-4">
            {property.bedrooms > 0 && (
              <View className="flex-row items-center gap-1.5">
                <Feather name="home" size={15} color="#1A3C5E" />
                <Text className="text-sm text-[#374151]">
                  {property.bedrooms} bed{property.bedrooms > 1 ? "s" : ""}
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1.5">
              <Feather name="droplet" size={15} color="#1A3C5E" />
              <Text className="text-sm text-[#374151]">
                {property.bathrooms} bath{property.bathrooms > 1 ? "s" : ""}
              </Text>
            </View>
            {property.parkingSpaces > 0 && (
              <View className="flex-row items-center gap-1.5">
                <Feather name="truck" size={15} color="#1A3C5E" />
                <Text className="text-sm text-[#374151]">
                  {property.parkingSpaces} parking
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1.5">
              <Feather name="calendar" size={15} color="#1A3C5E" />
              <Text className="text-sm text-[#374151]">
                From {formatDate(listing.availableFrom)}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View>
            <Text
              className="text-base font-bold text-[#1E293B] mb-2"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              About this property
            </Text>
            <Text
              className="text-sm text-[#64748B] leading-6"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              {property.description}
            </Text>
          </View>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View>
              <Text
                className="text-base font-bold text-[#1E293B] mb-3"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Amenities
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <View
                    key={a.type}
                    className="bg-[#EEF3F8] px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-xs text-[#1A3C5E] font-medium">
                      {a.type
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Landlord */}
          <View className="bg-white rounded-2xl border border-[#E2E8F0] p-4 flex-row items-center gap-3">
            <View className="w-12 h-12 rounded-full bg-[#EEF3F8] items-center justify-center">
              <Text className="text-[#1A3C5E] font-bold text-base">
                {landlord.firstName.charAt(0)}
                {landlord.lastName.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="font-bold text-[#1E293B]"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                {landlord.firstName} {landlord.lastName}
              </Text>
              {isVerified && <VerifiedBadge />}
              {landlord.landlordProfile && (
                <Text className="text-xs text-[#64748B] mt-0.5">
                  ⭐ {landlord.landlordProfile.averageRating.toFixed(1)} ·{" "}
                  {landlord.landlordProfile.totalReviews} reviews
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {listing.status === "ACTIVE" && user?.role === "TENANT" && (
        <View className="px-4 py-4 bg-white border-t border-[#E2E8F0]">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 h-12 border-2 border-[#1A3C5E] rounded-xl items-center justify-center"
              activeOpacity={0.85}
            >
              <Text
                className="text-[#1A3C5E] font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Send inquiry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 h-12 bg-[#1A3C5E] rounded-xl items-center justify-center"
              activeOpacity={0.85}
              onPress={() => router.push(`/pay/step1?listingId=${listing.id}`)}
            >
              <Text
                className="text-white font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Pay rent
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
