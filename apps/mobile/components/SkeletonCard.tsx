// File: apps/mobile/components/SkeletonCard.tsx
// Shimmer skeleton for loading states — Reanimated v4 loop animation

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

function SkeletonBlock({ className }: { className: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 750 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`bg-[#E2E8F0] rounded-xl ${className}`}
      style={animatedStyle}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="bg-white rounded-2xl overflow-hidden border border-[#E2E8F0]">
      <SkeletonBlock className="h-48 rounded-none" />
      <View className="p-4 gap-3">
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className="h-7 w-2/3" />
        <View className="flex-row gap-2">
          <SkeletonBlock className="h-6 w-16" />
          <SkeletonBlock className="h-6 w-16" />
        </View>
      </View>
    </View>
  );
}
