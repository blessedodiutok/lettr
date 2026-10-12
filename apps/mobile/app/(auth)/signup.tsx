// File: apps/mobile/app/(auth)/signup.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
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

const schema = z.object({
  role: z.enum(["TENANT", "LANDLORD"]),
  firstName: z.string().min(2, "Required"),
  lastName: z.string().min(2, "Required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(8, "Minimum 8 characters"),
});
type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const [role, setRole] = useState<"TENANT" | "LANDLORD">("TENANT");

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "TENANT" },
  });

  const signup = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post<{ data: { userId: string } }>(
        "/api/auth/signup",
        data,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      router.push(`/(auth)/verify-otp?userId=${data.userId}`);
    },
  });

  function selectRole(r: "TENANT" | "LANDLORD") {
    setRole(r);
    setValue("role", r);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#FAFAF7]"
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="text-3xl text-[#1A3C5E] mb-2"
          style={{ fontFamily: "PlayfairDisplay_700Bold" }}
        >
          Join Lettr
        </Text>
        <Text
          className="text-[#64748B] mb-8"
          style={{ fontFamily: "DMSans_400Regular" }}
        >
          Rent directly. No agents.
        </Text>

        {/* Role selector */}
        <View className="flex-row gap-3 mb-6">
          {(["TENANT", "LANDLORD"] as const).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => selectRole(r)}
              className={[
                "flex-1 py-3 rounded-xl border-2 items-center",
                role === r
                  ? "border-[#1A3C5E] bg-[#EEF3F8]"
                  : "border-[#E2E8F0] bg-white",
              ].join(" ")}
            >
              <Text
                className={
                  role === r ? "text-[#1A3C5E] font-bold" : "text-[#64748B]"
                }
                style={{ fontFamily: "DMSans_700Bold" }}
              >
                {r === "TENANT" ? "🏠 Tenant" : "🏢 Landlord"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* First + Last name */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text
              className="text-sm font-semibold text-[#374151] mb-1.5"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              First name
            </Text>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B]"
                  placeholder="Emeka"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  placeholderTextColor="#94A3B8"
                />
              )}
            />
            {errors.firstName && (
              <Text className="text-xs text-red-500 mt-1">
                {errors.firstName.message}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text
              className="text-sm font-semibold text-[#374151] mb-1.5"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Last name
            </Text>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B]"
                  placeholder="Okonkwo"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  placeholderTextColor="#94A3B8"
                />
              )}
            />
            {errors.lastName && (
              <Text className="text-xs text-red-500 mt-1">
                {errors.lastName.message}
              </Text>
            )}
          </View>
        </View>

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
                className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B]"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
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

        {/* Phone */}
        <View className="mb-4">
          <Text
            className="text-sm font-semibold text-[#374151] mb-1.5"
            style={{ fontFamily: "DMSans_700Bold" }}
          >
            Phone <Text className="font-normal text-[#94A3B8]">(optional)</Text>
          </Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <TextInput
                className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B]"
                placeholder="+234 800 000 0000"
                keyboardType="phone-pad"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                placeholderTextColor="#94A3B8"
              />
            )}
          />
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
                className="h-12 px-4 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#1E293B]"
                placeholder="Minimum 8 characters"
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

        {signup.isError && (
          <View className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
            <Text className="text-red-600 text-sm">
              {(signup.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "Sign up failed. Please try again."}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit((data) => signup.mutate(data))}
          disabled={signup.isPending}
          className="h-12 bg-[#1A3C5E] rounded-xl items-center justify-center mb-4"
          activeOpacity={0.85}
        >
          {signup.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className="text-white font-bold text-base"
              style={{ fontFamily: "DMSans_700Bold" }}
            >
              Create account
            </Text>
          )}
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity className="items-center">
            <Text className="text-sm text-[#64748B]">
              Already have an account?{" "}
              <Text className="text-[#1A3C5E] font-bold">Log in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
