// File: apps/mobile/app/list-property/_layout.tsx
import { Stack } from "expo-router";

export default function ListPropertyLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#FAFAF7" },
        headerTintColor: "#1A3C5E",
        headerTitleStyle: { fontFamily: "DMSans_700Bold" },
      }}
    >
      <Stack.Screen
        name="step1"
        options={{ title: "Property type & location" }}
      />
      <Stack.Screen name="step2" options={{ title: "Rent & lease terms" }} />
      <Stack.Screen name="step3" options={{ title: "Rooms & features" }} />
      <Stack.Screen name="step4" options={{ title: "Amenities" }} />
      <Stack.Screen name="step5" options={{ title: "Photos" }} />
      <Stack.Screen name="step6" options={{ title: "Preview & publish" }} />
    </Stack>
  );
}
