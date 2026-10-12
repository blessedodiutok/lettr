import { Text, View } from "react-native";
import {
  calculateAgentSaving,
  calculatePlatformFee,
  formatNaira,
} from "../lib/utils";

interface SavingsCalloutProps {
  annualRent: number;
}

export function SavingsCallout({ annualRent }: SavingsCalloutProps) {
  const agentFee = calculateAgentSaving(annualRent);
  const platformFee = calculatePlatformFee(annualRent);
  const netSaving = agentFee - platformFee;

  return (
    <View className="bg-green-50 border border-green-100 rounded-xl p-4">
      <Text className="text-xs text-green-700 uppercase font-semibold mb-2">
        You save with Lettr
      </Text>
      <View className="gap-1.5">
        <View className="flex-row justify-between">
          <Text className="text-sm text-[#64748B]">Agent fee</Text>
          <Text className="text-sm text-[#94A3B8] line-through">
            {formatNaira(agentFee)}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-[#64748B]">Platform fee</Text>
          <Text className="text-sm text-[#1E293B]">
            {formatNaira(platformFee)}
          </Text>
        </View>
        <View className="flex-row justify-between border-t border-green-200 pt-2 mt-1">
          <Text className="text-sm text-green-700 font-bold">Your saving</Text>
          <Text className="text-sm text-green-700 font-bold">
            {formatNaira(netSaving)}
          </Text>
        </View>
      </View>
    </View>
  );
}
