import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Button } from "../components/ui";

export default function NotFound() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg p-6">
      <Text className="font-display text-3xl text-ink">Page not found</Text>
      <Text className="text-center font-sans text-[15px] text-muted">This screen doesn&apos;t exist or the link is out of date.</Text>
      <Button onPress={() => router.replace("/")}>Go home</Button>
    </View>
  );
}
