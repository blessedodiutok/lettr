// File: apps/mobile/app/(tabs)/profile.tsx
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../../components/EmptyState";
import { apiClient } from "../../lib/axios";
import { clearAllTokens } from "../../lib/storage";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/auth/logout");
    },
    onSuccess: async () => {
      await clearAllTokens();
      logout();
      router.replace("/(tabs)");
    },
    onError: async () => {
      // Clear locally even if server call fails
      await clearAllTokens();
      logout();
      router.replace("/(tabs)");
    },
  });

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
        <EmptyState
          icon="user"
          title="My profile"
          description="Log in to manage your account, view your tenancies, and track payments."
          ctaLabel="Log in"
          onCtaPress={() => router.push("/(auth)/login")}
        />
      </SafeAreaView>
    );
  }

  const menuItems = [
    ...(user.role === "LANDLORD"
      ? [
          {
            icon: "plus-circle" as const,
            label: "List a property",
            onPress: () => router.push("/list-property" as never),
          },
        ]
      : [
          {
            icon: "file-text" as const,
            label: "My tenancies",
            onPress: () => {},
          },
        ]),
    {
      icon: "credit-card" as const,
      label: "Payment history",
      onPress: () => {},
    },
    { icon: "bell" as const, label: "Notifications", onPress: () => {} },
    { icon: "settings" as const, label: "Account settings", onPress: () => {} },
    {
      icon: "help-circle" as const,
      label: "Help & support",
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF7]" edges={["top"]}>
      <ScrollView contentContainerClassName="pb-12">
        {/* Header */}
        <View className="bg-[#1A3C5E] px-6 pt-6 pb-8 items-center">
          <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-3">
            <Text
              className="text-white text-3xl font-bold"
              style={{ fontFamily: "PlayfairDisplay_700Bold" }}
            >
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </Text>
          </View>
          <Text
            className="text-white text-xl font-bold"
            style={{ fontFamily: "PlayfairDisplay_700Bold" }}
          >
            {user.firstName} {user.lastName}
          </Text>
          <Text className="text-[#A9C3DD] text-sm mt-1">
            {user.email} · {user.role === "LANDLORD" ? "Landlord" : "Tenant"}
          </Text>
        </View>

        {/* Menu */}
        <View className="mt-6 mx-4 bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={[
                "flex-row items-center px-5 py-4 gap-4",
                i < menuItems.length - 1 ? "border-b border-[#F1F5F9]" : "",
              ].join(" ")}
              activeOpacity={0.7}
            >
              <Feather name={item.icon} size={18} color="#1A3C5E" />
              <Text
                className="flex-1 text-[#374151] text-sm"
                style={{ fontFamily: "DMSans_500Medium" }}
              >
                {item.label}
              </Text>
              <Feather name="chevron-right" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log out */}
        <View className="mt-4 mx-4">
          <TouchableOpacity
            onPress={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="flex-row items-center justify-center bg-red-50 border border-red-100 rounded-2xl py-4 gap-2"
            activeOpacity={0.8}
          >
            {logoutMutation.isPending ? (
              <ActivityIndicator color="#DC2626" size="small" />
            ) : (
              <>
                <Feather name="log-out" size={18} color="#DC2626" />
                <Text
                  className="text-red-600 font-bold"
                  style={{ fontFamily: "DMSans_700Bold" }}
                >
                  Log out
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
