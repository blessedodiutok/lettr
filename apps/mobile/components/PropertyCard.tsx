// File: apps/mobile/components/PropertyCard.tsx
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import {
  calculateAgentSaving,
  formatNaira,
  formatPropertyType,
} from "../lib/utils";
import type { Listing } from "../types";
import { VerifiedBadge } from "./VerifiedBadge";

export function PropertyCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const { property, landlord } = listing;
  const cover = property.photos.find((p) => p.isCover) ?? property.photos[0];
  const isVerified =
    landlord.landlordProfile?.verificationStatus === "VERIFIED";
  const saving = calculateAgentSaving(listing.annualRent);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/listing/${listing.id}`)}
      className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0]"
      activeOpacity={0.92}
      style={{
        shadowColor: "#1A3C5E",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {/* Photo */}
      <View className="relative h-48">
        {cover ? (
          <Image
            source={{ uri: cover.url }}
            style={{ width: "100%", height: 192 }}
            contentFit="cover"
          />
        ) : (
          <View className="w-full h-48 bg-[#E2E8F0] items-center justify-center">
            <Feather name="image" size={32} color="#94A3B8" />
          </View>
        )}
        {/* Savings chip */}
        <View className="absolute bottom-3 left-3 bg-green-500 rounded-full px-3 py-1">
          <Text className="text-white text-xs font-bold">
            Save {formatNaira(saving)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-1">
          <View className="bg-[#EEF3F8] rounded-full px-2.5 py-1">
            <Text className="text-xs text-[#1A3C5E] font-semibold">
              {formatPropertyType(property.propertyType)}
            </Text>
          </View>
          {isVerified && <VerifiedBadge />}
        </View>

        <Text
          className="text-base font-bold text-[#1E293B] mt-1 mb-0.5"
          numberOfLines={2}
          style={{ fontFamily: "DMSans_700Bold" }}
        >
          {property.title}
        </Text>

        <View className="flex-row items-center gap-1 mb-3">
          <Feather name="map-pin" size={12} color="#94A3B8" />
          <Text className="text-xs text-[#94A3B8]" numberOfLines={1}>
            {property.neighbourhood}, {property.state}
          </Text>
        </View>

        <Text
          className="text-2xl text-[#1A3C5E] mb-3"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          {formatNaira(listing.annualRent)}
          <Text
            className="text-sm text-[#94A3B8]"
            style={{ fontFamily: "DMSans_400Regular" }}
          >
            {" "}
            /yr
          </Text>
        </Text>

        {/* Feature chips */}
        <View className="flex-row gap-2 flex-wrap">
          {property.bedrooms > 0 && (
            <View className="flex-row items-center gap-1">
              <Feather name="home" size={12} color="#64748B" />
              <Text className="text-xs text-[#64748B]">
                {property.bedrooms} bed
              </Text>
            </View>
          )}
          <View className="flex-row items-center gap-1">
            <Feather name="droplet" size={12} color="#64748B" />
            <Text className="text-xs text-[#64748B]">
              {property.bathrooms} bath
            </Text>
          </View>
          {property.isFurnished && (
            <View className="bg-[#FEF9EC] rounded-full px-2 py-0.5">
              <Text className="text-xs text-[#7C590D]">Furnished</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
