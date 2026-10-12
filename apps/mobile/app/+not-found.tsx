// File: apps/mobile/app/+not-found.tsx
import { useRouter } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7] items-center justify-center px-6">
      <Text
        className="text-7xl text-[#D4E1EE] mb-4"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        404
      </Text>
      <Text className="text-xl text-[#1A3C5E] font-bold mb-2">
        Screen not found
      </Text>
      <Text className="text-[#64748B] text-center mb-8">
        This screen doesn't exist in the app.
      </Text>
      <TouchableOpacity
        onPress={() => router.replace("/(tabs)")}
        className="h-12 px-8 bg-[#1A3C5E] rounded-xl items-center justify-center"
      >
        <Text className="text-white font-bold">Go home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
