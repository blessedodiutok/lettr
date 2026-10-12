// Shared building blocks for the app, styled with the LETTR tokens.

import { Feather } from "@expo/vector-icons";
import { getInitials, getStatusMeta, type StatusKind, type StatusTone } from "@lettr/utils";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { forwardRef, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, type TextInputProps, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "../stores/toast";

export const COLORS = {
  navy: "#1A3C5E",
  brass: "#B8862A",
  ink: "#0F1C2B",
  muted: "#5B6B7D",
  line: "#DAE2EA",
  ok: "#1D774A",
  bad: "#B42318",
  surface: "#FFFFFF",
  bg: "#F3F5F8",
};

const BUTTON = {
  primary: { box: "bg-navy", text: "text-white" },
  accent: { box: "bg-brass", text: "text-on-brass" },
  secondary: { box: "bg-surface border border-line-strong", text: "text-ink" },
  ghost: { box: "bg-transparent", text: "text-ink-2" },
  danger: { box: "bg-bad", text: "text-white" },
} as const;

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  className = "",
}: {
  children: ReactNode;
  onPress?: () => void;
  variant?: keyof typeof BUTTON;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  className?: string;
}) {
  const style = BUTTON[variant];
  const height = { sm: "h-9 px-3", md: "h-11 px-4", lg: "h-14 px-5" }[size];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(inactive), busy: Boolean(loading) }}
      onPress={inactive ? undefined : onPress}
      className={`${height} flex-row items-center justify-center rounded-lg ${style.box} ${inactive ? "opacity-50" : "active:opacity-80"} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? COLORS.navy : "#fff"} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <Feather name={icon} size={16} color={variant === "accent" ? "#1B1406" : variant === "secondary" || variant === "ghost" ? COLORS.ink : "#fff"} />}
          <Text className={`font-sans-bold ${size === "sm" ? "text-[13px]" : "text-[15px]"} ${style.text}`}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string; prefix?: string }>(function Field(
  { label, error, hint, prefix, ...props },
  ref,
) {
  return (
    <View className="gap-1.5">
      <Text className="font-sans-bold text-sm text-ink">{label}</Text>
      <View className={`h-12 flex-row items-center rounded-lg border bg-surface px-3 ${error ? "border-bad" : "border-line-strong"}`}>
        {prefix && <Text className="mr-1 font-sans-medium text-[15px] text-muted">{prefix}</Text>}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor="#8A97A6"
          className="flex-1 font-sans text-[15px] text-ink"
          {...props}
        />
      </View>
      {error ? <Text className="font-sans-medium text-[13px] text-bad">{error}</Text> : hint ? <Text className="font-sans text-[13px] text-muted">{hint}</Text> : null}
    </View>
  );
});

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <View className={`rounded-xl border border-line bg-surface p-4 ${className}`}>{children}</View>;
}

const TONES: Record<StatusTone, { box: string; text: string }> = {
  ok: { box: "bg-ok-soft", text: "text-ok" },
  warn: { box: "bg-warn-soft", text: "text-warn" },
  bad: { box: "bg-bad-soft", text: "text-bad" },
  info: { box: "bg-info-soft", text: "text-info" },
  neutral: { box: "bg-surface-2", text: "text-muted" },
};

export function Pill({ tone = "neutral", children }: { tone?: StatusTone; children: ReactNode }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${TONES[tone].box}`}>
      <Text className={`font-sans-bold text-xs ${TONES[tone].text}`}>{children}</Text>
    </View>
  );
}

export function StatusPill({ kind, status }: { kind: StatusKind; status: string }) {
  const meta = getStatusMeta(kind, status);
  return <Pill tone={meta.tone}>{meta.label}</Pill>;
}

export function Avatar({ person, size = 40 }: { person: { firstName: string; lastName: string; avatarUrl?: string | null }; size?: number }) {
  if (person.avatarUrl) return <Image source={{ uri: person.avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 }} className="items-center justify-center bg-navy-soft">
      <Text style={{ fontSize: size * 0.36 }} className="font-sans-bold text-navy">
        {getInitials(person.firstName, person.lastName)}
      </Text>
    </View>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: keyof typeof Feather.glyphMap; title: string; body?: string; action?: ReactNode }) {
  return (
    <View className="items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10">
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-navy-soft">
        <Feather name={icon} size={20} color={COLORS.navy} />
      </View>
      <Text className="text-center font-sans-bold text-base text-ink">{title}</Text>
      {body && <Text className="mt-1 text-center font-sans text-sm text-muted">{body}</Text>}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View accessibilityRole="alert" className="rounded-xl border border-bad/30 bg-bad-soft p-4">
      <Text className="font-sans-bold text-sm text-bad">{message}</Text>
      {onRetry && (
        <Pressable onPress={onRetry} className="mt-2">
          <Text className="font-sans-bold text-sm text-bad underline">Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <View className={`rounded-lg bg-surface-2 ${className}`} />;
}

/** Top bar for stack screens: back button, title, optional right element. */
export function ScreenHeader({ title, right, back = true }: { title?: string; right?: ReactNode; back?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top }} className="border-b border-line bg-surface">
      <View className="h-14 flex-row items-center gap-2 px-2">
        {back && (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} className="h-10 w-10 items-center justify-center rounded-lg">
            <Feather name="arrow-left" size={22} color={COLORS.ink} />
          </Pressable>
        )}
        <Text numberOfLines={1} className={`flex-1 font-sans-bold text-[17px] text-ink ${back ? "" : "px-2"}`}>
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View className="mb-4">
      <Text className="font-display text-[28px] leading-[34px] text-ink">{children}</Text>
      {sub && <Text className="mt-1 font-sans text-[15px] text-muted">{sub}</Text>}
    </View>
  );
}

export function ToastHost() {
  const { message, tone, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  const icon = tone === "success" ? "check-circle" : tone === "error" ? "x-circle" : "info";
  const color = tone === "success" ? COLORS.ok : tone === "error" ? COLORS.bad : COLORS.navy;
  return (
    <Pressable onPress={hide} accessibilityLiveRegion="polite" style={{ bottom: insets.bottom + 84 }} className="absolute left-4 right-4 flex-row items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-lg">
      <Feather name={icon} size={20} color={color} />
      <Text className="flex-1 font-sans-medium text-sm text-ink">{message}</Text>
    </Pressable>
  );
}
