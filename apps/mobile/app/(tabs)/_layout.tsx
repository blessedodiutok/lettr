// Bottom tabs. Tenants: Explore, Saved, Messages, Rental, Profile.
// Landlords: Overview, Listings, Inquiries, Tenancies, Profile.
// Signed-out visitors: Explore and Profile (which offers login).

import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useUnreadCount } from "../../hooks/data";
import { useAuthStore } from "../../stores/auth";

type Icon = keyof typeof Feather.glyphMap;
const icon = (name: Icon) => ({ color }: { color: string }) => <Feather name={name} size={22} color={color} />;

export default function TabsLayout() {
  const user = useAuthStore((s) => s.user);
  const unread = useUnreadCount().data?.unreadCount ?? 0;
  const tenant = user?.role === "TENANT";
  const landlord = user?.role === "LANDLORD";
  const hide = { href: null } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1A3C5E",
        tabBarInactiveTintColor: "#5B6B7D",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: "#DAE2EA" },
        tabBarLabelStyle: { fontFamily: "DMSans_500Medium", fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Explore", tabBarIcon: icon("search"), ...(landlord ? hide : {}) }} />
      <Tabs.Screen name="overview" options={{ title: "Overview", tabBarIcon: icon("grid"), ...(landlord ? {} : hide) }} />
      <Tabs.Screen name="listings" options={{ title: "Listings", tabBarIcon: icon("home"), ...(landlord ? {} : hide) }} />
      <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: icon("heart"), ...(tenant ? {} : hide) }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: landlord ? "Inquiries" : "Messages",
          tabBarIcon: icon("message-circle"),
          tabBarBadge: unread ? (unread > 9 ? "9+" : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: "#B8862A", color: "#1B1406" },
          ...(user ? {} : hide),
        }}
      />
      <Tabs.Screen name="rental" options={{ title: landlord ? "Tenancies" : "Rental", tabBarIcon: icon("file-text"), ...(user ? {} : hide) }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("user") }} />
    </Tabs>
  );
}
