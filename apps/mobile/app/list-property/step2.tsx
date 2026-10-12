import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ListPropertyStep2() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white px-5 justify-center gap-5">
      <View className="gap-2">
        <Text className="text-2xl font-bold text-[#1A3C5E]">Continue on the web</Text>
        <Text className="text-[#64748B]">
          Property terms, photos, and publishing are available from the landlord web dashboard.
        </Text>
      </View>
      <TouchableOpacity onPress={() => router.replace("/(tabs)/profile")} className="h-14 bg-[#1A3C5E] rounded-xl items-center justify-center">
        <Text className="text-white font-bold">Back to profile</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
