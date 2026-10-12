// Root layout — fonts, data client, session restore, notification taps, toasts.

import { DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { Newsreader_500Medium, useFonts } from "@expo-google-fonts/newsreader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
import { ToastHost } from "../components/ui";
import { restoreSession } from "../lib/session";
import { useAuthStore } from "../stores/auth";

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        return !(status && status < 500) && count < 2;
      },
    },
  },
});

/** Map a web link from a notification to the matching app screen. */
function openLink(link?: string) {
  if (!link) return;
  const [, section, id] = link.split("/");
  if (section === "messages" && id) router.push(`/messages/${id}`);
  else if (section === "tenancies" && id) router.push(`/tenancy/${id}`);
  else if (section === "listings" && id) router.push(`/listing/${id}`);
  else if (link.startsWith("/landlord/payouts") || link.startsWith("/dashboard/payments")) router.push("/payouts");
  else router.push("/notifications");
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Newsreader_500Medium, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    void restoreSession();
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openLink((response.notification.request.content.data as { link?: string } | undefined)?.link);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded && status !== "loading") void SplashScreen.hideAsync();
  }, [fontsLoaded, status]);

  if (!fontsLoaded || status === "loading") return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F3F5F8" } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
            <Stack.Screen name="pay/[listingId]" options={{ presentation: "modal", gestureEnabled: false }} />
          </Stack>
          <ToastHost />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
