import { Feather } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Card, COLORS, Field, StatusPill, Title } from "../../components/ui";
import { useNotifications, useUpdateProfile } from "../../hooks/data";
import { WEB_URL } from "../../lib/api";
import { endSession } from "../../lib/session";
import { useAuthStore } from "../../stores/auth";

function Row({ icon, label, onPress, badge }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-3 border-b border-line py-3.5 last:border-b-0">
      <Feather name={icon} size={18} color={COLORS.ink} />
      <Text className="flex-1 font-sans-medium text-[15px] text-ink">{label}</Text>
      {badge ? (
        <View className="rounded-full bg-brass px-2">
          <Text className="font-sans-bold text-xs text-on-brass">{badge}</Text>
        </View>
      ) : null}
      <Feather name="chevron-right" size={18} color={COLORS.muted} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotifications();
  const update = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: user?.firstName ?? "", lastName: user?.lastName ?? "", phone: user?.phone ?? "" });

  if (!user) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-bg p-4">
        <Title sub="Save homes, message landlords and pay into escrow.">Welcome to Lettr</Title>
        <View className="gap-3">
          <Button size="lg" onPress={() => router.push("/(auth)/login")}>
            Log in
          </Button>
          <Button size="lg" variant="secondary" onPress={() => router.push("/(auth)/signup")}>
            Create an account
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const web = (path: string) => WebBrowser.openBrowserAsync(`${WEB_URL}${path}`);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
        <View className="flex-row items-center gap-4">
          <Avatar person={user} size={64} />
          <View className="flex-1">
            <Text className="font-display text-2xl text-ink">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="font-sans text-sm text-muted">{user.email}</Text>
            {user.landlordProfile && (
              <View className="mt-1">
                <StatusPill kind="verification" status={user.landlordProfile.verificationStatus} />
              </View>
            )}
          </View>
        </View>

        {editing ? (
          <Card className="gap-4">
            <Field label="First name" value={form.firstName} onChangeText={(firstName) => setForm({ ...form, firstName })} />
            <Field label="Last name" value={form.lastName} onChangeText={(lastName) => setForm({ ...form, lastName })} />
            <Field label="Phone number" keyboardType="phone-pad" value={form.phone} onChangeText={(phone) => setForm({ ...form, phone })} placeholder="0801 234 5678" />
            <View className="flex-row gap-2">
              <Button className="flex-1" variant="secondary" onPress={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={update.isPending}
                onPress={() => update.mutate({ firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined }, { onSuccess: () => setEditing(false) })}
              >
                Save
              </Button>
            </View>
          </Card>
        ) : (
          <Card>
            <Row icon="edit-2" label="Edit your details" onPress={() => setEditing(true)} />
            <Row icon="bell" label="Notifications" badge={notifications.data?.unreadCount} onPress={() => router.push("/notifications")} />
            <Row icon="credit-card" label={user.role === "LANDLORD" ? "Payouts" : "Payments and receipts"} onPress={() => router.push("/payouts")} />
            {user.role === "TENANT" && <Row icon="user-check" label="Rental profile (on lettr.ng)" onPress={() => web("/settings")} />}
            {user.role === "LANDLORD" && <Row icon="shield" label="Verification and bank account (on lettr.ng)" onPress={() => web("/landlord/verification")} />}
            <Row icon="lock" label="Change password (on lettr.ng)" onPress={() => web("/settings")} />
            <Row icon="help-circle" label="Help" onPress={() => web("/help")} />
          </Card>
        )}

        <Button variant="secondary" icon="log-out" onPress={() => void endSession()}>
          Log out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
