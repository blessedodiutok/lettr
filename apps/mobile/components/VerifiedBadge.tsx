// File: apps/mobile/components/VerifiedBadge.tsx
import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";

interface VerifiedBadgeProps {
  showLabel?: boolean;
  size?: "sm" | "md";
}

export function VerifiedBadge({
  showLabel = true,
  size = "sm",
}: VerifiedBadgeProps) {
  const iconSize = size === "sm" ? 12 : 16;
  const fontSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <View className="flex-row items-center gap-1">
      <Feather name="check-circle" size={iconSize} color="#059669" />
      {showLabel && (
        <Text className={`${fontSize} text-green-700 font-semibold`}>
          Verified
        </Text>
      )}
    </View>
  );
}
