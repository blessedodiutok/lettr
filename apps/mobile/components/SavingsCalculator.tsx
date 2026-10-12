// File: apps/mobile/components/SavingsCallout.tsx
import { Text, View } from "react-native";
import {
  calculateAgentSaving,
  calculatePlatformFee,
  formatNaira,
} from "../lib/utils";

export function SavingsCallout({ annualRent }: { annualRent: number }) {
  const agentFee = calculateAgentSaving(annualRent);
  const platformFee = calculatePlatformFee(annualRent);
  const saving = agentFee - platformFee;

  return (
    <View className="bg-green-50 border border-green-100 rounded-2xl p-4 gap-2">
      <Text className="text-xs font-bold text-green-600 uppercase tracking-wide">
        You save with Lettr
      </Text>
      <View className="gap-1.5">
        {[
          { label: "Agent fee (15%)", amount: agentFee, strike: true },
          { label: "Lettr fee (3%)", amount: platformFee, strike: false },
        ].map((row) => (
          <View key={row.label} className="flex-row justify-between">
            <Text className="text-sm text-[#64748B]">{row.label}</Text>
            <Text
              className={[
                "text-sm font-semibold",
                row.strike ? "line-through text-[#94A3B8]" : "text-[#1E293B]",
              ].join(" ")}
            >
              {formatNaira(row.amount)}
            </Text>
          </View>
        ))}
        <View className="border-t border-green-200 pt-2 flex-row justify-between">
          <Text
            className="font-bold text-green-700"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Your saving
          </Text>
          <Text
            className="font-bold text-xl text-green-600"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {formatNaira(saving)}
          </Text>
        </View>
      </View>
    </View>
  );
}
