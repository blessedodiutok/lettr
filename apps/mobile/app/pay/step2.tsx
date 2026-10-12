// File: apps/mobile/app/pay/step2.tsx
// Step 2: Open Paystack WebView
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatNaira } from "../../lib/utils";

export default function PayStep2Screen() {
  const { authorizationUrl, paymentId, totalAmount, agentFeeSaved, platformFee } =
    useLocalSearchParams<{
      authorizationUrl: string;
      paymentId: string;
      totalAmount: string;
      agentFeeSaved: string;
      platformFee: string;
    }>();
  const router = useRouter();

  const saving = Number(agentFeeSaved) - Number(platformFee);

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["bottom"]}>
      <View className="flex-1 px-4 py-6 gap-5">
        {/* Amount */}
        <View className="bg-white rounded-2xl border border-[#E2E8F0] p-6 items-center gap-2">
          <Text className="text-sm text-[#64748B]">Total to pay</Text>
          <Text
            className="text-4xl text-[#1A3C5E]"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {formatNaira(Number(totalAmount))}
          </Text>
          <View className="bg-green-50 px-4 py-2 rounded-full">
            <Text className="text-green-700 text-sm font-semibold">
              You save {formatNaira(saving)} vs agent
            </Text>
          </View>
        </View>

        {/* Payment methods info */}
        <View className="bg-white rounded-2xl border border-[#E2E8F0] p-4 gap-3">
          <Text
            className="font-bold text-[#1E293B]"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Accepted payment methods
          </Text>
          {[
            { icon: "credit-card" as const, label: "Debit / credit card" },
            { icon: "smartphone" as const, label: "Bank transfer" },
            { icon: "hash" as const, label: "USSD (*737#, *770#, etc.)" },
          ].map((method) => (
            <View key={method.label} className="flex-row items-center gap-3">
              <View className="w-9 h-9 bg-[#EEF3F8] rounded-full items-center justify-center">
                <Feather name={method.icon} size={16} color="#1A3C5E" />
              </View>
              <Text className="text-sm text-[#374151]">{method.label}</Text>
            </View>
          ))}
        </View>

        <View className="bg-[#FEF9EC] border border-[#F9E194] rounded-xl p-4">
          <Text className="text-sm text-[#7C590D]">
            🔒 Your payment is processed by{" "}
            <Text className="font-bold">Paystack</Text> — Nigeria's most trusted
            payment gateway. Funds are held in escrow until handover is
            confirmed.
          </Text>
        </View>
      </View>

      <View className="px-4 py-4 bg-white border-t border-[#E2E8F0]">
        <TouchableOpacity
          onPress={async () => {
            await Linking.openURL(authorizationUrl);
            router.push({ pathname: "/pay/step3", params: { paymentId } });
          }}
          className="h-14 bg-[#D4A017] rounded-xl items-center justify-center flex-row gap-2"
          activeOpacity={0.85}
        >
          <Feather name="lock" size={18} color="#FFFFFF" />
          <Text
            className="text-white font-bold text-base"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Pay with Paystack
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
