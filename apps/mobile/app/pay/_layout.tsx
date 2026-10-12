// File: apps/mobile/app/pay/_layout.tsx
import { Stack } from "expo-router";

export default function PayLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FAFAF7" },
        headerTintColor: "#1A3C5E",
        headerTitleStyle: { fontFamily: "DMSans_700Bold" },
      }}
    >
      <Stack.Screen name="step1" options={{ title: "Review payment" }} />
      <Stack.Screen name="step2" options={{ title: "Payment method" }} />
      <Stack.Screen name="step3" options={{ title: "Payment confirmed" }} />
    </Stack>
  );
}
