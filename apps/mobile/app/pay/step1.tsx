// File: apps/mobile/app/pay/step1.tsx
// Step 1: Review listing + cost breakdown
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SavingsCallout } from "../../components/SavingsCallout";
import { apiClient } from "../../lib/axios";
import { formatNaira } from "../../lib/utils";
import type { Listing } from "../../types";

export default function PayStep1Screen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();

  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: ["listing", listingId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/listings/${listingId}`);
      return res.data.data;
    },
    enabled: !!listingId,
  });

  const initiate = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/api/payments/initiate", { listingId });
      return res.data.data;
    },
    onSuccess: (data) => {
      router.push({
        pathname: "/pay/step2",
        params: {
          authorizationUrl: data.authorizationUrl,
          paymentId: data.paymentId,
          totalAmount: String(data.breakdown.totalAmount),
          agentFeeSaved: String(data.breakdown.agentFeeSaved),
          platformFee: String(data.breakdown.platformFee),
        },
      });
    },
  });

  if (isLoading || !listing) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF7] items-center justify-center">
        <ActivityIndicator color="#1A3C5E" />
      </SafeAreaView>
    );
  }

  const platformFee = listing.annualRent * 0.03;
  const total = listing.annualRent + listing.cautionFee + platformFee;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["bottom"]}>
      <ScrollView contentContainerClassName="px-4 py-6 gap-5">
        {/* Property */}
        <View className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <Text
            className="font-bold text-[#1E293B] mb-1"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            {listing.property.title}
          </Text>
          <Text className="text-sm text-[#64748B]">
            {listing.property.neighbourhood}, {listing.property.state}
          </Text>
        </View>

        {/* Breakdown */}
        <View className="bg-white rounded-2xl border border-[#E2E8F0] p-4 gap-3">
          <Text
            className="font-bold text-[#1E293B] mb-1"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Payment breakdown
          </Text>
          {[
            { label: "Annual rent", amount: listing.annualRent },
            { label: "Caution fee (refundable)", amount: listing.cautionFee },
            { label: "Platform fee (3%)", amount: platformFee },
          ].map((row) => (
            <View key={row.label} className="flex-row justify-between">
              <Text className="text-sm text-[#64748B]">{row.label}</Text>
              <Text className="text-sm font-semibold text-[#1E293B]">
                {formatNaira(row.amount)}
              </Text>
            </View>
          ))}
          <View className="border-t border-[#E2E8F0] pt-3 flex-row justify-between">
            <Text
              className="font-bold text-[#1E293B]"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Total
            </Text>
            <Text
              className="font-bold text-xl text-[#1A3C5E]"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {formatNaira(total)}
            </Text>
          </View>
        </View>

        <SavingsCallout annualRent={listing.annualRent} />
      </ScrollView>

      <View className="px-4 py-4 bg-white border-t border-[#E2E8F0]">
        <TouchableOpacity
          onPress={() => initiate.mutate()}
          disabled={initiate.isPending}
          className="h-14 bg-[#1A3C5E] rounded-xl items-center justify-center"
          activeOpacity={0.85}
        >
          {initiate.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="text-white font-bold text-base"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Continue to payment
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
