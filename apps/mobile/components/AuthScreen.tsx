import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { ScreenHeader } from "./ui";

export function AuthScreen({ title, sub, children }: { title: string; sub?: ReactNode; children: ReactNode }) {
  return (
    <View className="flex-1 bg-bg">
      <ScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="mb-2">
            <Text className="font-display text-[30px] leading-[36px] text-ink">{title}</Text>
            {sub ? <Text className="mt-1.5 font-sans text-[15px] text-muted">{sub}</Text> : null}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View accessibilityRole="alert" className="rounded-lg border border-bad/30 bg-bad-soft p-3">
      <Text className="font-sans-medium text-sm text-bad">{message}</Text>
    </View>
  );
}
