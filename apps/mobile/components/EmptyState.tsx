// File: apps/mobile/components/EmptyState.tsx
import { Feather } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type FeatherName = keyof typeof Feather.glyphMap;

interface EmptyStateProps {
  icon: FeatherName;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16 gap-4">
      <View className="w-20 h-20 bg-[#EEF3F8] rounded-full items-center justify-center">
        <Feather name={icon} size={36} color="#94A3B8" />
      </View>
      <Text
        className="text-xl text-[#1A3C5E] text-center"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        {title}
      </Text>
      <Text
        className="text-sm text-[#64748B] text-center leading-6"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        {description}
      </Text>
      {ctaLabel && onCtaPress && (
        <TouchableOpacity
          onPress={onCtaPress}
          className="mt-2 h-12 px-8 bg-[#1A3C5E] rounded-xl items-center justify-center"
          activeOpacity={0.85}
        >
          <Text
            className="text-white font-bold"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            {ctaLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
