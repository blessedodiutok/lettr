// File: apps/mobile/app/(auth)/verify-otp.tsx
import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiClient } from "../../lib/axios";
import { saveAccessToken, saveRefreshToken } from "../../lib/storage";
import { useAuthStore, type AuthUser } from "../../stores/authStore";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { hydrate } = useAuthStore();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const verify = useMutation({
    mutationFn: async (otp: string) => {
      const res = await apiClient.post<{
        data: { user: AuthUser; accessToken: string; refreshToken: string };
      }>("/api/auth/verify-otp", { userId, otp });
      return res.data.data;
    },
    onSuccess: async (data) => {
      await saveAccessToken(data.accessToken);
      await saveRefreshToken(data.refreshToken);
      hydrate(data.user);
      router.replace("/(tabs)");
    },
  });

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d !== "")) {
      verify.mutate(next.join(""));
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#FAFAF7] px-6 pt-12"
    >
      <Text className="text-4xl mb-4">✉️</Text>
      <Text
        className="text-2xl text-[#1A3C5E] mb-2"
        style={{ fontFamily: "PlayfairDisplay_700Bold" }}
      >
        Check your email
      </Text>
      <Text
        className="text-[#64748B] mb-10"
        style={{ fontFamily: "DMSans_400Regular" }}
      >
        Enter the 6-digit code we sent you. It expires in 5 minutes.
      </Text>

      <View className="flex-row justify-between mb-6">
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            className="w-12 h-14 border-2 border-[#E2E8F0] rounded-xl text-center text-2xl font-bold text-[#1A3C5E] bg-white"
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(v) => handleChange(i, v)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
            selectTextOnFocus
          />
        ))}
      </View>

      {verify.isError && (
        <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
          <Text className="text-red-600 text-sm">
            {(verify.error as { response?: { data?: { error?: string } } })
              ?.response?.data?.error ?? "Invalid code. Please try again."}
          </Text>
        </View>
      )}

      {verify.isPending && (
        <ActivityIndicator color="#1A3C5E" className="mt-4" />
      )}

      <TouchableOpacity className="items-center mt-6">
        <Text className="text-sm text-[#64748B]">
          Didn't get a code?{" "}
          <Text className="text-[#1A3C5E] font-bold">Resend</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
