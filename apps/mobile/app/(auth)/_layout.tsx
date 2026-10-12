// File: apps/mobile/app/(auth)/_layout.tsx
// Auth stack — full screen, no tab bar

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#FAFAF7" },
        headerTintColor: "#1A3C5E",
        headerTitleStyle: { fontFamily: "DMSans_700Bold" },
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="login" options={{ title: "Log in" }} />
      <Stack.Screen name="signup" options={{ title: "Create account" }} />
      <Stack.Screen name="verify-otp" options={{ title: "Verify email" }} />
    </Stack>
  );
}
