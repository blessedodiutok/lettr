// File: apps/mobile/app/(auth)/login.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { apiClient } from "../../lib/axios";
import { saveAccessToken, saveRefreshToken } from "../../lib/storage";
import { useAuthStore, type AuthUser } from "../../stores/authStore";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { hydrate } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const login = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post<{
        data: { user: AuthUser; accessToken: string; refreshToken: string };
      }>("/api/auth/login", data);
      return res.data.data;
    },
    onSuccess: async (data) => {
      await saveAccessToken(data.accessToken);
      await saveRefreshToken(data.refreshToken);
      hydrate(data.user);
      if (data.user.role === "LANDLORD") {
        router.replace("/(tabs)/profile");
      } else {
        router.replace("/(tabs)");
      }
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#FAFAF7]"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="text-3xl text-[#1A3C5E] mb-2"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Welcome back
        </Text>
        <Text
          className="text-[#64748B] mb-8"
          style={{ fontFamily: "DMSans_400Regular" }}
        >
          Log in to your Lettr account
        </Text>

        {/* Email */}
        <View className="mb-4">
          <Text
            className="text-sm font-semibold text-[#374151] mb-1.5"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Email address
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B] text-sm"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholderTextColor="#94A3B8"
              />
            )}
          />
          {errors.email && (
            <Text className="text-xs text-red-500 mt-1">
              {errors.email.message}
            </Text>
          )}
        </View>

        {/* Password */}
        <View className="mb-6">
          <Text
            className="text-sm font-semibold text-[#374151] mb-1.5"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Password
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-[#1E293B] text-sm"
                placeholder="••••••••"
                secureTextEntry
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholderTextColor="#94A3B8"
              />
            )}
          />
          {errors.password && (
            <Text className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </Text>
          )}
        </View>

        {login.isError && (
          <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <Text className="text-red-600 text-sm">
              {(login.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "Login failed. Please try again."}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit((data) => login.mutate(data))}
          disabled={login.isPending}
          className="h-12 bg-[#1A3C5E] rounded-xl items-center justify-center mb-4"
          activeOpacity={0.85}
        >
          {login.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="text-white font-bold text-base"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Log in
            </Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity className="items-center">
            <Text
              className="text-sm text-[#64748B]"
              style={{ fontFamily: "DMSans_400Regular" }}
            >
              Don't have an account?{" "}
              <Text
                className="text-[#1A3C5E] font-bold"
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                Sign up
              </Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
