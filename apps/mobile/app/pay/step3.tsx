import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "../../lib/axios";

export default function PayStep3Screen() {
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();
  const router = useRouter();
  const { data: payment, isLoading, refetch } = useQuery({
    queryKey: ["payment", paymentId],
    queryFn: async () => {
      const response = await apiClient.post(`/api/payments/${paymentId}/verify`);
      return response.data.data as { status: string };
    },
    enabled: Boolean(paymentId),
    refetchInterval: (query) => query.state.data?.status === "PENDING" ? 3000 : false,
  });
  const confirmed = payment?.status === "IN_ESCROW" || payment?.status === "RELEASED";

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7] items-center justify-center px-6" edges={["bottom"]}>
      <View className="items-center gap-4 max-w-sm w-full">
        {isLoading ? <ActivityIndicator color="#1A3C5E" /> : (
          <Text className="text-3xl text-[#1A3C5E] text-center" style={{ fontFamily: "PlayfairDisplay_700Bold" }}>
            {confirmed ? "Payment confirmed" : "Waiting for payment confirmation"}
          </Text>
        )}
        <Text className="text-[#64748B] text-center text-sm leading-6">
          {confirmed ? "Your funds are safely held in escrow." : "Complete the Paystack checkout, then check again."}
        </Text>
        {!confirmed && (
          <TouchableOpacity onPress={() => refetch()} className="w-full h-14 bg-[#D4A017] rounded-xl items-center justify-center">
            <Text className="text-white font-bold">Check payment</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.replace("/(tabs)")} className="w-full h-14 bg-[#1A3C5E] rounded-xl items-center justify-center">
          <Text className="text-white font-bold">Go to home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
